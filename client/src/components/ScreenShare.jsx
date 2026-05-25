import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSocket } from '../services/socket'

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

/**
 * ScreenShare — host shares screen, guests view it via WebRTC
 *
 * Props:
 *   isHost       — is this user the lobby host
 *   members      — current lobby members list
 *   hostId       — the host's userId
 *   currentUserId — this user's id
 */
export function ScreenShare({ isHost, members, hostId, currentUserId }) {
  const [sharing, setSharing] = useState(false)
  const [remoteStream, setRemoteStream] = useState(null)
  const [status, setStatus] = useState('idle') // idle | waiting | connected | error

  const localStream = useRef(null)
  const peerConns   = useRef(new Map()) // userId → RTCPeerConnection
  const videoRef    = useRef(null)

  // Attach remote stream to video element
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSharing()
      closeAllPeers()
    }
  }, [])

  const closeAllPeers = useCallback(() => {
    for (const pc of peerConns.current.values()) {
      pc.close()
    }
    peerConns.current.clear()
  }, [])

  // ── HOST: start sharing ──
  const startSharing = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', frameRate: { max: 30 } },
        audio: true,
      })
      localStream.current = stream
      setSharing(true)

      // When user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => stopSharing()

      // Notify everyone
      const socket = getSocket()
      socket?.emit('lobby:screen-share', { active: true })

      // Create peer connections for existing guests
      for (const m of members) {
        if (m.userId !== currentUserId) {
          createOffer(m.userId, stream)
        }
      }
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        console.error('Screen share error:', err)
      }
    }
  }, [members, currentUserId])

  const stopSharing = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => t.stop())
      localStream.current = null
    }
    setSharing(false)
    closeAllPeers()

    const socket = getSocket()
    socket?.emit('lobby:screen-share', { active: false })
  }, [closeAllPeers])

  // ── HOST: create offer for a guest ──
  const createOffer = useCallback(async (guestUserId, stream) => {
    const socket = getSocket()
    if (!socket) return

    // Close existing connection if any
    if (peerConns.current.has(guestUserId)) {
      peerConns.current.get(guestUserId).close()
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    peerConns.current.set(guestUserId, pc)

    // Add stream tracks
    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('lobby:rtc-signal', {
          targetUserId: guestUserId,
          signal: { type: 'ice', candidate: e.candidate },
        })
      }
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    socket.emit('lobby:rtc-signal', {
      targetUserId: guestUserId,
      signal: { type: 'offer', sdp: offer.sdp },
    })
  }, [])

  // ── GUEST: handle incoming offer ──
  const handleOffer = useCallback(async (fromUserId, sdp) => {
    const socket = getSocket()
    if (!socket) return

    if (peerConns.current.has(fromUserId)) {
      peerConns.current.get(fromUserId).close()
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    peerConns.current.set(fromUserId, pc)

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('lobby:rtc-signal', {
          targetUserId: fromUserId,
          signal: { type: 'ice', candidate: e.candidate },
        })
      }
    }

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0])
      setStatus('connected')
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setRemoteStream(null)
        setStatus('waiting')
      }
    }

    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    socket.emit('lobby:rtc-signal', {
      targetUserId: fromUserId,
      signal: { type: 'answer', sdp: answer.sdp },
    })
  }, [])

  // ── Handle incoming signals ──
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleSignal = async ({ fromUserId, signal }) => {
      if (signal.type === 'offer') {
        // Guest receives offer from host
        await handleOffer(fromUserId, signal.sdp)
      } else if (signal.type === 'answer') {
        // Host receives answer from guest
        const pc = peerConns.current.get(fromUserId)
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }))
        }
      } else if (signal.type === 'ice') {
        // Both: ICE candidates
        const pc = peerConns.current.get(fromUserId)
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
        }
      }
    }

    const handleScreenShare = ({ active, hostUserId }) => {
      if (!isHost) {
        if (active) {
          setStatus('waiting')
        } else {
          setRemoteStream(null)
          setStatus('idle')
          closeAllPeers()
        }
      }
    }

    // When a new member joins, host sends them an offer
    const handleMemberJoined = (member) => {
      if (isHost && sharing && localStream.current) {
        setTimeout(() => createOffer(member.userId, localStream.current), 500)
      }
    }

    socket.on('lobby:rtc-signal', handleSignal)
    socket.on('lobby:screen-share', handleScreenShare)
    socket.on('lobby:member-joined', handleMemberJoined)

    return () => {
      socket.off('lobby:rtc-signal', handleSignal)
      socket.off('lobby:screen-share', handleScreenShare)
      socket.off('lobby:member-joined', handleMemberJoined)
    }
  }, [isHost, sharing, handleOffer, createOffer, closeAllPeers])

  // ══════════════════════════════════════════════════════════
  // HOST UI
  // ══════════════════════════════════════════════════════════
  if (isHost) {
    return (
      <div className="w-full">
        <div
          className="relative w-full bg-black overflow-hidden rounded-t-xl"
          style={{ aspectRatio: '16/9' }}
        >
          {sharing && localStream.current ? (
            <video
              ref={(el) => { if (el) el.srcObject = localStream.current }}
              autoPlay
              muted
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-violet-600/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold mb-1">Показ экрана</p>
                <p className="text-text-muted text-sm">Покажите свой экран участникам комнаты</p>
              </div>
              <button
                onClick={startSharing}
                className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all"
              >
                Начать трансляцию
              </button>
            </div>
          )}

          {/* Host badge */}
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-md border bg-violet-600/80 border-violet-500/50 text-white">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
              Хост
            </div>
          </div>

          {/* Sharing indicator */}
          {sharing && (
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={stopSharing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 backdrop-blur-md border border-red-500/50 text-xs font-bold text-white hover:bg-red-500 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Остановить
              </button>
            </div>
          )}
        </div>

        {/* Sync-like bar */}
        <div className="flex items-center gap-2 px-3 h-10 bg-[#0c0c16] border-t border-white/5 rounded-b-xl">
          <div className={`w-1.5 h-1.5 rounded-full ${sharing ? 'bg-red-500 animate-pulse' : 'bg-text-muted'}`} />
          <span className="text-white/60 text-xs">
            {sharing ? 'Транслируется...' : 'Трансляция остановлена'}
          </span>
          <div className="flex-1" />
          <span className="text-white/30 text-[10px]">
            {members.length} {members.length === 1 ? 'зритель' : 'зрителей'}
          </span>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // GUEST UI
  // ══════════════════════════════════════════════════════════
  return (
    <div className="w-full">
      <div
        className="relative w-full bg-black overflow-hidden rounded-t-xl"
        style={{ aspectRatio: '16/9' }}
      >
        {status === 'connected' && remoteStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-bg-elevated flex items-center justify-center">
              {status === 'waiting' ? (
                <div className="w-8 h-8 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
              ) : (
                <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <p className="text-text-muted text-sm">
              {status === 'waiting' ? 'Подключение к трансляции...' : 'Ожидание хоста...'}
            </p>
          </div>
        )}

        {/* Guest badge */}
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-md border bg-black/60 border-white/10 text-white/50">
            <span className="w-1 h-1 rounded-full bg-white/40" />
            Гость
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-2 px-3 h-10 bg-[#0c0c16] border-t border-white/5 rounded-b-xl">
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
        <span className="text-white/60 text-xs">
          {status === 'connected' ? 'Подключено' : 'Ожидание трансляции'}
        </span>
        <div className="flex-1" />
        <span className="text-white/20 text-[9px]">хост управляет</span>
      </div>
    </div>
  )
}
