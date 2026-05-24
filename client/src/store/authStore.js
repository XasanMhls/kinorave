import { create } from 'zustand'
import { authApi, setApiToken, getApiToken } from '../services/api'
import { connectSocket, disconnectSocket } from '../services/socket'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,
  error: null,

  setError: (error) => set({ error }),

  init: async () => {
    // Restore token from localStorage before calling /me
    const saved = getApiToken()
    if (saved) {
      setApiToken(saved)
      connectSocket(saved)
    }

    try {
      const data = await Promise.race([
        authApi.me(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ])
      if (data.user) {
        const token = data.token || saved || null
        set({ user: data.user, token, loading: false })
        if (token) {
          setApiToken(token)
          connectSocket(token)
        }
      } else {
        setApiToken(null)
        set({ user: null, token: null, loading: false })
      }
    } catch {
      // If we had a saved token, keep trying with it
      if (saved) {
        set({ user: null, token: null, loading: false })
      } else {
        set({ user: null, token: null, loading: false })
      }
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
