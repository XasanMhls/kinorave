import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoPlayer } from '../components/VideoPlayer'
import { WatchPartyPanel } from '../components/WatchPartyPanel'
import { useLobbySocket } from '../hooks/useLobby'
import { useAuthStore } from '../store/authStore'
import { getSocket } from '../services/socket'

export function LobbyPage({ onAuthOpen }) {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { lobby, members, sync, join, leave, syncAction, loading, error } = useLobbySocket()
  const [panelOpen, setPanelOpen] = useState(false)
  const [joined, setJoined] = useState(false)
  const [retries, setRetries] = useState(0)
  const [pingInterval, setPingInterval] = useState(null)

  // Require auth
  useEffect(() => {
    if (!user) {
      onAuthOpen?.()
      navigate('/', { replace: true })
    }
  }, [user])

  // Join lobby — retry until socket is ready
  useEffect(() => {
    if (!user || !code || joined) return
    const socket = getSocket()
    if (!socket?.connected) {
      const timer = setTimeout(() => setRetries(r => r + 1), 600)
      return () => clearTimeout(timer)
    }
    join(code.toUpperCase()).then(() => setJoined(true)).catch(console.error)
  }, [user, code, joined, retries])

  // Ping for sync check
  useEffect(() => {
    if (!joined) return
    const id = setInterval(() => {
      const socket = getSocket()
      if (socket && sync?.isPlaying) {
        socket.emit('lobby:ping', { clientPosition: sync.position })
      }
    }, 5000)
    setPingInterval(id)
    return () => clearInterval(id)
  }, [joined, sync?.isPlaying])

  // Leave on unmount
  useEffect(() => {
    return () => {
      leave()
      if (pingInterval) clearInterval(pingInterval)
    }
  }, [])

  // Open panel by default on desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    if (mq.matches) setPanelOpen(true)
  }, [])

  const isHost = lobby?.hostId === user?.id
  const hasVideo = lobby?.movieId

  if (!user) return null

  if (error) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
        <div className="text-center glass p-8 rounded-2xl max-w-sm w-full">
          <p className="text-red-400 text-lg font-semibold mb-2">Комната не найдена</p>
          <p className="text-text-muted mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">На главную</button>
        </div>
      </div>
    )
  }

  if (loading || !joined) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-2 border-accent/20 border-t-accent animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">Подключение к комнате...</p>
          <p className="text-text-muted text-sm mt-1">{code?.toUpperCase()}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-bg-base overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top bar */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 h-12 sm:h-14 border-b border-border-subtle flex-shrink-0 bg-bg-base/80 backdrop-blur-sm">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 sm:p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm truncate">{lobby?.movieTitle || 'Watch Party'}</p>
            <p className="text-text-muted text-xs truncate">
              {members.length} {members.length === 1 ? 'участник' : 'участника'} · {code?.toUpperCase()}
            </p>
          </div>

          {/* Sync status */}
          {sync && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-elevated border border-border text-xs flex-shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${sync.isPlaying ? 'bg-green-400 animate-pulse' : 'bg-text-muted'}`} />
              <span className="text-text-secondary">{sync.isPlaying ? 'Синхронизировано' : 'Пауза'}</span>
            </div>
          )}

          {/* Mobile sync dot */}
          {sync && (
            <div className="sm:hidden flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${sync.isPlaying ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            </div>
          )}

          {/* Members avatars */}
          <div className="hidden md:flex items-center -space-x-2 flex-shrink-0">
            {members.slice(0, 4).map(m => (
              <div
                key={m.userId}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-xs font-bold text-white ring-2 ring-bg-base"
                title={m.username}
              >
                {m.username[0]?.toUpperCase()}
              </div>
            ))}
            {members.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-xs text-text-muted ring-2 ring-bg-base">
                +{members.length - 4}
              </div>
            )}
          </div>

          <button
            onClick={() => setPanelOpen(v => !v)}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${panelOpen ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>

        {/* Player */}
        <div className="flex-1 flex items-center bg-black overflow-hidden min-h-0">
          {hasVideo ? (
            <VideoPlayer
              movieId={lobby.movieId}
              movieType={lobby.movieType || 'movie'}
              season={sync?.season || 1}
              episode={sync?.episode || 1}
              syncState={sync}
              isHost={isHost}
              onSyncAction={syncAction}
            />
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-4 py-12">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-bg-elevated flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-text-muted text-sm">Нет активного контента</p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop side panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="hidden md:block flex-shrink-0 overflow-hidden"
          >
            <div className="w-80 h-full">
              <WatchPartyPanel onClose={() => setPanelOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile panel overlay */}
      <AnimatePresence>
        {panelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setPanelOpen(false)}
            />
            {/* Bottom sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-2xl overflow-hidden"
              style={{ height: '70dvh' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-2 pb-1 bg-bg-surface">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <WatchPartyPanel onClose={() => setPanelOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
