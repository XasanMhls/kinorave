import { create } from 'zustand'
import { authApi, setApiToken } from '../services/api'
import { connectSocket, disconnectSocket } from '../services/socket'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,
  error: null,

  setError: (error) => set({ error }),

  init: async () => {
    try {
      const data = await Promise.race([
        authApi.me(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ])
      if (data.user) {
        set({ user: data.user, token: data.token || null, loading: false })
        if (data.token) {
          setApiToken(data.token)
          connectSocket(data.token)
        }
      } else {
        set({ user: null, token: null, loading: false })
      }
    } catch {
      set({ user: null, token: null, loading: false })
    }
  },

  login: async (email, password) => {
    set({ error: null })
    const data = await authApi.login({ email, password })
    setApiToken(data.token)
    set({ user: data.user, token: data.token })
    if (data.token) connectSocket(data.token)
    return data
  },

  register: async (username, email, password) => {
    set({ error: null })
    const data = await authApi.register({ username, email, password })
    setApiToken(data.token)
    set({ user: data.user, token: data.token })
    if (data.token) connectSocket(data.token)
    return data
  },

  logout: async () => {
    await authApi.logout().catch(() => {})
    setApiToken(null)
    disconnectSocket()
    set({ user: null, token: null })
  },
}))
