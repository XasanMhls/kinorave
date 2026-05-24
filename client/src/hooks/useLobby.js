import { useEffect, useRef, useState } from 'react'
import { getSocket } from '../services/socket'
import { useLobbyStore } from '../store/lobbyStore'

export function useLobbySocket() {
  const bound = useRef(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const socket = getSocket()

    // Socket not ready yet — retry until it is
    if (!socket) {
      if (tick < 30) {
        const t = setTimeout(() => setTick(n => n + 1), 400)
        return () => clearTimeout(t)
      }
      return
    }

    if (bound.current) return
    bound.current = true

    // Use getState() for stable handler references
    const s = useLobbyStore.getState()

    socket.on('lobby:member-joined', s.onMemberJoined)
    socket.on('lobby:member-left',   s.onMemberLeft)
    socket.on('lobby:host-changed',  s.onHostChanged)
    socket.on('lobby:chat',          s.onChatMessage)
    socket.on('lobby:ready-update',  s.onReadyUpdate)
    socket.on('lobby:sync',          s.onSyncEvent)
    socket.on('lobby:typing',        s.onTyping)

    return () => {
      socket.off('lobby:member-joined', s.onMemberJoined)
      socket.off('lobby:member-left',   s.onMemberLeft)
      socket.off('lobby:host-changed',  s.onHostChanged)
      socket.off('lobby:chat',          s.onChatMessage)
      socket.off('lobby:ready-update',  s.onReadyUpdate)
      socket.off('lobby:sync',          s.onSyncEvent)
      socket.off('lobby:typing',        s.onTyping)
      bound.current = false
    }
  }, [tick])

  return useLobbyStore()
}
