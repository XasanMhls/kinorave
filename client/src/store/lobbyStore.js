import { create } from 'zustand'
import { lobbyApi } from '../services/api'
import { getSocket } from '../services/socket'

export const useLobbyStore = create((set, get) => ({
  lobby: null,
  members: [],
  messages: [],
  sync: null,
  loading: false,
  error: null,
  typingUsers: new Set(),

  setError: (e) => set({ error: e }),

  create: async (movieData) => {
    set({ loading: true, error: null })
    try {
      const data = await lobbyApi.create(movieData)
      return data
    } catch (err) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  join: (code) => {
    return new Promise((resolve, reject) => {
      const socket = getSocket()
      if (!socket) return reject(new Error('Not connected'))
      set({ loading: true, error: null })

      socket.emit('lobby:join', { code }, (res) => {
        if (res?.error) {
          set({ error: res.error, loading: false })
          reject(new Error(res.error))
        } else {
          set({
            lobby: res.lobby,
            members: res.members || [],
            messages: res.messages || [],
            sync: res.sync || null,
            loading: false,
          })
          resolve(res)
        }
      })
    })
  },

  leave: () => {
    return new Promise((resolve) => {
      const socket = getSocket()
      if (!socket) return resolve()
      socket.emit('lobby:leave', {}, () => {
        set({ lobby: null, members: [], messages: [], sync: null })
        resolve()
      })
    })
  },

  sendMessage: (text) => {
    const socket = getSocket()
    if (!socket) return
    socket.emit('lobby:chat', { text })
  },

  sendTyping: (isTyping) => {
    const socket = getSocket()
    if (!socket) return
    socket.emit('lobby:typing', { isTyping })
  },

  syncAction: (action, data = {}) => {
    const socket = getSocket()
    if (!socket) return
    socket.emit('lobby:sync', { action, data })
  },

  sendReady: (isReady) => {
    const socket = getSocket()
    if (!socket) return
    socket.emit('lobby:ready', { isReady })
  },

  // Socket event handlers (called from useLobby hook)
  onMemberJoined:  (member)            => set(s => ({ members: [...s.members, member] })),
  onMemberLeft:    ({ userId })        => set(s => ({ members: s.members.filter(m => m.userId !== userId) })),
  onHostChanged:   ({ newHostId })     => set(s => ({ lobby: s.lobby ? { ...s.lobby, hostId: newHostId } : s.lobby })),
  onChatMessage:   (msg)               => set(s => ({ messages: [...s.messages, msg] })),
  onReadyUpdate:   ({ userId, isReady }) =>
    set(s => ({ members: s.members.map(m => m.userId === userId ? { ...m, isReady } : m) })),
  onSyncEvent: (payload) => {
    set(s => {
      const prev = s.sync || {}
      return { sync: { ...prev, ...payload.data } }
    })
  },
  onTyping: ({ userId, username, isTyping }) => {
    set(s => {
      const next = new Set(s.typingUsers)
      if (isTyping) next.add(username)
      else next.delete(username)
      return { typingUsers: next }
    })
  },
}))
