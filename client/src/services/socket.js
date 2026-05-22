import { io } from 'socket.io-client'

let socket = null

export function getSocket() {
  return socket
}

export function connectSocket(token) {
  if (socket?.connected) return socket

  socket = io('http://localhost:3001', {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => console.log('[socket] connected'))
  socket.on('disconnect', (reason) => console.log('[socket] disconnected:', reason))
  socket.on('connect_error', (err) => console.warn('[socket] error:', err.message))

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
