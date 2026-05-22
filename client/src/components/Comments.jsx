import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from './ui/Avatar'
import { useAuthStore } from '../store/authStore'
import { api } from '../services/api'

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥']

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'только что'
  if (m < 60) return `${m} мин. назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч. назад`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d} дн. назад`
  return new Date(dateStr).toLocaleDateString('ru', { day: 'numeric', month: 'short' })
}

function CommentSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-bg-elevated flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 bg-bg-elevated rounded" />
        <div className="h-3 w-full bg-bg-elevated rounded" />
        <div className="h-3 w-3/4 bg-bg-elevated rounded" />
      </div>
    </div>
  )
}

function CommentItem({ comment, onReact, currentUserId }) {
  const [showReactions, setShowReactions] = useState(false)
  const reactionRef = useRef(null)

  useEffect(() => {
    if (!showReactions) return
    const handler = (e) => {
      if (reactionRef.current && !reactionRef.current.contains(e.target)) {
        setShowReactions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showReactions])

  const topReactions = Object.entries(comment.reactions || {})
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-3 group"
    >
      <Avatar name={comment.username} size="sm" className="flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white">
            {comment.username}
          </span>
          <span className="text-xs text-text-muted">{timeAgo(comment.createdAt)}</span>
        </div>

        <p className="text-white/80 text-sm leading-relaxed break-words">{comment.text}</p>

        {/* Reactions row */}
        <div className="flex items-center gap-2 mt-2">
          {topReactions.map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => onReact(comment._id, emoji)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-elevated border border-border text-xs hover:border-violet-500/50 transition-colors"
            >
              <span>{emoji}</span>
              <span className="text-white/60">{count}</span>
            </button>
          ))}

          {/* Add reaction */}
          <div className="relative" ref={reactionRef}>
            <button
              onClick={() => setShowReactions(v => !v)}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-elevated border border-border text-xs text-white/40 hover:text-white hover:border-border-strong transition-all"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 rounded-2xl bg-bg-surface border border-border shadow-xl"
                >
                  {REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => { onReact(comment._id, emoji); setShowReactions(false) }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 text-base transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Comments section for movie/tv pages.
 * Uses local storage (in-memory) for now since there's no comment API endpoint.
 * Comments are stored per movieId in the server's future /api/comments route.
 * For now: client-only optimistic state with localStorage persistence.
 */
export function Comments({ movieId, movieType = 'movie' }) {
  const { user } = useAuthStore()
  const [comments, setComments]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [text, setText]           = useState('')
  const [sending, setSending]     = useState(false)
  const [showAll, setShowAll]     = useState(false)
  const textareaRef               = useRef(null)

  const storageKey = `comments:${movieType}:${movieId}`

  // Load comments from localStorage
  useEffect(() => {
    setLoading(true)
    setComments([])
    setShowAll(false)
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) setComments(JSON.parse(stored))
    } catch {}
    setLoading(false)
  }, [storageKey])

  const save = (list) => {
    setComments(list)
    try { localStorage.setItem(storageKey, JSON.stringify(list)) } catch {}
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim() || !user) return
    setSending(true)

    const comment = {
      _id:       `${Date.now()}-${Math.random()}`,
      userId:    user.id,
      username:  user.username,
      text:      text.trim().slice(0, 1000),
      createdAt: new Date().toISOString(),
      reactions: {},
    }

    save([comment, ...comments])
    setText('')
    setSending(false)
    textareaRef.current?.focus()
  }

  const handleReact = (commentId, emoji) => {
    if (!user) return
    const updated = comments.map(c => {
      if (c._id !== commentId) return c
      const prev = c.reactions?.[emoji] || 0
      return {
        ...c,
        reactions: { ...c.reactions, [emoji]: prev > 0 ? prev - 1 : 1 },
      }
    })
    save(updated)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e)
    }
  }

  const visible = showAll ? comments : comments.slice(0, 5)

  return (
    <section className="mt-14">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-white">Комментарии</h2>
        {comments.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-bg-elevated border border-border text-text-muted text-xs font-medium">
            {comments.length}
          </span>
        )}
      </div>

      {/* Write comment */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <Avatar name={user.username} size="sm" className="flex-shrink-0 mt-1" />
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Напишите что думаете..."
                rows={3}
                maxLength={1000}
                className="w-full px-4 py-3 rounded-2xl bg-bg-elevated border border-border text-sm text-white placeholder:text-text-muted outline-none focus:border-accent focus:bg-bg-elevated transition-all resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-text-muted">Ctrl+Enter для отправки</span>
                <motion.button
                  type="submit"
                  disabled={!text.trim() || sending}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-40 hover:bg-accent-light transition-colors"
                >
                  {sending ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                  Отправить
                </motion.button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 rounded-2xl bg-bg-elevated border border-border text-center">
          <p className="text-text-muted text-sm">
            Войдите, чтобы оставить комментарий
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => <CommentSkeleton key={i} />)}
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-bg-elevated flex items-center justify-center">
            <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-text-muted text-sm">Пока нет комментариев. Будьте первым!</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {visible.map(comment => (
              <CommentItem
                key={comment._id}
                comment={comment}
                onReact={handleReact}
                currentUserId={user?.id}
              />
            ))}
          </AnimatePresence>

          {comments.length > 5 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="w-full py-3 rounded-xl bg-bg-elevated border border-border text-text-secondary text-sm font-medium hover:text-white hover:border-border-strong transition-all"
            >
              {showAll
                ? 'Скрыть'
                : `Показать ещё ${comments.length - 5} комментариев`}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
