import { useEffect, useRef } from 'react'
import { getSocket } from '../services/socket'
import { useLobbyStore } from '../store/lobbyStore'

export function useLobbySocket() {
  const store = useLobbyStore()
  const bound = useRef(false)

  useEffect(() => {
    const socket = getSocket()
    if (!socket || bound.current) return
    bound.current = true

    socket.on('lobby:member-joined', store.onMemberJoined)
    socket.on('lobby:member-left',   store.onMemberLeft)
    socket.on('lobby:host-changed',  store.onHostChanged)
    socket.on('lobby:chat',          store.onChatMessage)
    socket.on('lobby:ready-update',  store.onReadyUpdate)
    socket.on('lobby:sync',          store.onSyncEvent)
    socket.on('lobby:typing',        store.onTyping)

    return () => {
      socket.off('lobby:member-joined', store.onMemberJoined)
      socket.off('lobby:member-left',   store.onMemberLeft)
      socket.off('lobby:host-changed',  store.onHostChanged)
      socket.off('lobby:chat',          store.onChatMessage)
      socket.off('lobby:ready-update',  store.onReadyUpdate)
      socket.off('lobby:sync',          store.onSyncEvent)
      socket.off('lobby:typing',        store.onTyping)
      bound.current = false
    }
  }, [])

  return useLobbyStore()
}
