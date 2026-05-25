import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { useLobbyStore } from '../store/lobbyStore'

export function WatchPartyPage({ onAuthOpen }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { create, loading: creating } = useLobbyStore()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [screenError, setScreenError] = useState('')

  const handleJoin = (e) => {
    e.preventDefault()
    const c = code.trim().toUpperCase()
    if (!c) { setError('Введите код лобби'); return }
    if (!user) { onAuthOpen?.(); return }
    navigate(`/lobby/${c}`)
  }

  const handleCreateScreencast = async () => {
    if (!user) { onAuthOpen?.(); return }
    setScreenError('')
    try {
      const data = await create({ mode: 'screencast' })
      navigate(`/lobby/${data.code}`)
    } catch (err) {
      setScreenError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-[0_0_40px_rgba(124,58,237,0.4)]">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Watch Party</h1>
          <p className="text-text-muted">Смотрите фильмы вместе с друзьями в реальном времени</p>
        </motion.div>

        {/* Screencast lobby */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-bg-elevated border border-border rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-1">Показ экрана</h2>
              <p className="text-text-muted text-sm mb-4">Создайте комнату и покажите свой экран друзьям</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCreateScreencast}
                disabled={creating}
                className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_28px_rgba(124,58,237,0.5)] transition-all disabled:opacity-50"
              >
                {creating ? 'Создаю...' : 'Создать комнату'}
              </motion.button>
              {screenError && <p className="text-red-400 text-sm mt-2">{screenError}</p>}
            </div>
          </div>
        </motion.div>

        {/* Join by code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-bg-elevated border border-border rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-bold text-white mb-4">Присоединиться по коду</h2>
          <form onSubmit={handleJoin} className="flex gap-3">
            <input
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
              placeholder="Введите код, напр. ABC123"
              maxLength={10}
              className="flex-1 px-4 py-3 text-base rounded-xl bg-bg-base border border-border text-white placeholder:text-white/30 outline-none focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] transition-all caret-violet-400 uppercase tracking-widest font-mono"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_28px_rgba(124,58,237,0.5)] transition-all"
            >
              Войти
            </motion.button>
          </form>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </motion.div>

        {/* How to create */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-bg-elevated border border-border rounded-2xl p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4">Как создать лобби с фильмом</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                <span className="text-violet-400 text-sm font-bold">1</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Выберите фильм или сериал</p>
                <p className="text-text-muted text-xs mt-0.5">Откройте страницу любого фильма</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                <span className="text-violet-400 text-sm font-bold">2</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Нажмите "Watch Party"</p>
                <p className="text-text-muted text-xs mt-0.5">Кнопка рядом с "Смотреть"</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                <span className="text-violet-400 text-sm font-bold">3</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Отправьте код друзьям</p>
                <p className="text-text-muted text-xs mt-0.5">Они введут код на этой странице</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
