import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import { useLobbyStore } from '../store/lobbyStore'
import { useAuthStore } from '../store/authStore'

export function WatchPartyPanel({ onClose }) {
  const { user } = useAuthStore()
  const { lobby, members, messages, typingUsers, sendMessage, sendTyping } = useLobbyStore()
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState('chat') // 'chat' | 'members'
  const msgEndRef = useRef(null)
  const typingTimer = useRef(null)

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleTyping = useCallback((e) => {
    setText(e.target.value)
    sendTyping(true)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => sendTyping(false), 1500)
  }, [sendTyping])

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage(text.trim())
    setText('')
    sendTyping(false)
    clearTimeout(typingTimer.current)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(lobby?.code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/lobby/${lobby?.code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const typingList = Array.from(typingUsers).filter(u => u !== user?.username)

  return (
    <div className="flex flex-col h-full bg-bg-surface border-l border-border-subtle">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-semibold text-sm">{members.length} участника</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Room code */}
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border text-xs font-mono font-bold text-accent hover:border-accent transition-colors"
          >
            {lobby?.code}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle flex-shrink-0">
        {[['chat', 'Чат'], ['members', 'Участники']].map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
              tab === t ? 'text-white border-accent' : 'text-text-muted border-transparent hover:text-text-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Copy invite link */}
      <div className="px-4 py-2 border-b border-border-subtle flex-shrink-0">
        <button
          onClick={copyLink}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {copied ? 'Скопировано!' : 'Скопировать ссылку'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'chat' ? (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-bg-elevated flex items-center justify-center">
                    <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-text-muted text-sm">Начните общение!</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <ChatMessage
                    key={i}
                    msg={msg}
                    isOwn={msg.userId === user?.id}
                  />
                ))
              )}

              {/* Typing indicator */}
              <AnimatePresence>
                {typingList.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex gap-0.5 px-3 py-2 rounded-2xl bg-bg-elevated">
                      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '100ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '200ms' }} />
                    </div>
                    <span className="text-xs text-text-muted">{typingList[0]} печатает...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={msgEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex gap-2 px-4 py-3 border-t border-border-subtle flex-shrink-0">
              <input
                value={text}
                onChange={handleTyping}
                placeholder="Написать..."
                maxLength={500}
                className="flex-1 px-3 py-2 text-sm rounded-xl bg-bg-elevated border border-border text-white placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-accent disabled:opacity-40 hover:bg-accent-light transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <div className="overflow-y-auto p-4 space-y-2">
            {members.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                isHost={lobby?.hostId === member.userId}
                isYou={member.userId === user?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChatMessage({ msg, isOwn }) {
  const time = new Date(msg.sentAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isOwn && <Avatar name={msg.username} size="xs" className="flex-shrink-0 mt-0.5" />}
      <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {!isOwn && (
          <span className="text-xs text-text-muted px-1">{msg.username}</span>
        )}
        <div className={`px-3 py-2 rounded-2xl text-sm break-words ${
          isOwn
            ? 'bg-accent text-white rounded-br-sm'
            : 'bg-bg-elevated text-white rounded-bl-sm'
        }`}>
          {msg.text}
        </div>
        <span className="text-xs text-text-muted px-1">{time}</span>
      </div>
    </motion.div>
  )
}

function MemberRow({ member, isHost, isYou }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-bg-elevated transition-colors">
      <div className="relative">
        <Avatar name={member.username} size="sm" />
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-bg-surface" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {member.username}
          {isYou && <span className="text-text-muted font-normal"> (вы)</span>}
        </p>
        {isHost && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Хост
          </span>
        )}
      </div>
      {member.isReady && (
        <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
          <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  )
}
