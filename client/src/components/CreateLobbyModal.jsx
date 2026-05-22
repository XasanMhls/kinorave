import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { useLobbyStore } from '../store/lobbyStore'
import { useAuthStore } from '../store/authStore'
import { IMG } from '../services/tmdb'

export function CreateLobbyModal({ open, onClose, onAuthRequired, movie }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { create, loading } = useLobbyStore()
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!user) { onAuthRequired?.(); onClose(); return }
    setError('')
    try {
      const data = await create({
        movieId: movie.id,
        movieType: movie.media_type || (movie.title ? 'movie' : 'tv'),
        movieTitle: movie.title || movie.name,
        moviePoster: movie.poster_path,
        isPrivate,
      })
      onClose()
      navigate(`/lobby/${data.code}`)
    } catch (err) {
      setError(err.message)
    }
  }

  if (!movie) return null

  const poster = IMG(movie.poster_path, 'w185')
  const title  = movie.title || movie.name

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-5">Создать Watch Party</h2>

        {/* Movie preview */}
        <div className="flex gap-4 p-4 rounded-xl bg-bg-base border border-border mb-5">
          {poster && (
            <img src={poster} alt={title} className="w-16 h-24 rounded-lg object-cover flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-white line-clamp-2">{title}</p>
            <p className="text-text-muted text-sm mt-1">
              {movie.release_date?.slice(0, 4) || movie.first_air_date?.slice(0, 4)}
            </p>
          </div>
        </div>

        {/* Privacy toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-bg-base border border-border mb-5">
          <div>
            <p className="text-sm font-medium text-white">Приватная комната</p>
            <p className="text-xs text-text-muted mt-0.5">Только по ссылке-приглашению</p>
          </div>
          <button
            onClick={() => setIsPrivate(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isPrivate ? 'bg-accent' : 'bg-bg-elevated border border-border'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isPrivate ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-red-400 text-sm mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Отмена</Button>
          <Button variant="primary" className="flex-1" loading={loading} onClick={handleCreate}>
            Создать
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function JoinLobbyModal({ open, onClose, onAuthRequired }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!user) { onAuthRequired?.(); onClose(); return }
    const trimmed = code.trim().toUpperCase()
    if (!trimmed || trimmed.length < 4) { setError('Введите код комнаты'); return }
    setLoading(true); setError('')
    try {
      navigate(`/lobby/${trimmed}`)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2">Войти в комнату</h2>
        <p className="text-text-muted text-sm mb-6">Введите код или вставьте ссылку-приглашение</p>

        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            placeholder="ABC123"
            maxLength={8}
            className="input-field text-center text-2xl font-mono tracking-[0.3em] uppercase"
            autoFocus
          />
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-red-400 text-sm text-center">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex gap-3 mt-1">
            <Button variant="secondary" type="button" className="flex-1" onClick={onClose}>Отмена</Button>
            <Button variant="primary" type="submit" className="flex-1" loading={loading}>Войти</Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
