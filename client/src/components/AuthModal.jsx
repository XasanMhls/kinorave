import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'

/* ═══════════════════════════════════════════════════════════════
   AUTH MODAL — Matrix code rain + glassmorphism
   Inspired by space.marsit.uz — adapted for cinema theme
   ═══════════════════════════════════════════════════════════════ */

// ── Characters for the rain (katakana + cinema symbols) ──
const RAIN_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFKINOFILM'

// ── Dot-matrix pixel map for "KINO" ──
const KINO_PIXELS = [
  // K
  [1,0,0,1],[1,0,1,0],[1,1,0,0],[1,0,1,0],[1,0,0,1],
  // gap
  [0,0,0,0],
  // I
  [1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1],
  // gap
  [0,0,0,0],
  // N
  [1,0,0,1],[1,1,0,1],[1,0,1,1],[1,0,0,1],[1,0,0,1],
  // gap
  [0,0,0,0],
  // O
  [0,1,1,0],[1,0,0,1],[1,0,0,1],[1,0,0,1],[0,1,1,0],
]

// Flat grid: 5 rows, columns for K(4)+gap(1)+I(3)+gap(1)+N(4)+gap(1)+O(4) = 18 cols
const KINO_GRID = (() => {
  const letters = {
    K: [[1,0,0,1],[1,0,1,0],[1,1,0,0],[1,0,1,0],[1,0,0,1]],
    I: [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
    N: [[1,0,0,1],[1,1,0,1],[1,0,1,1],[1,0,0,1],[1,0,0,1]],
    O: [[0,1,1,0],[1,0,0,1],[1,0,0,1],[1,0,0,1],[0,1,1,0]],
  }
  const order = ['K','I','N','O']
  const rows = []
  for (let r = 0; r < 5; r++) {
    const row = []
    order.forEach((ch, li) => {
      if (li > 0) row.push(0) // gap column
      letters[ch][r].forEach(v => row.push(v))
    })
    rows.push(row)
  }
  return rows
})()

// ── Code Rain Canvas ──
function CodeRainCanvas({ width, height }) {
  const canvasRef = useRef(null)
  const columnsRef = useRef([])
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = width
    canvas.height = height

    const fontSize = 14
    const cols = Math.floor(width / fontSize)
    columnsRef.current = Array.from({ length: cols }, () => Math.random() * height / fontSize | 0)

    function draw() {
      ctx.fillStyle = 'rgba(10, 10, 18, 0.06)'
      ctx.fillRect(0, 0, width, height)
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < cols; i++) {
        const char = RAIN_CHARS[Math.random() * RAIN_CHARS.length | 0]
        const y = columnsRef.current[i] * fontSize

        // Gradient: bright at head, dimmer behind
        const brightness = Math.random()
        if (brightness > 0.96) {
          ctx.fillStyle = '#ffffff'  // rare bright flash
        } else if (brightness > 0.8) {
          ctx.fillStyle = '#fc6736'  // orange accent (cinema)
        } else {
          ctx.fillStyle = `rgba(80, 220, 160, ${0.3 + Math.random() * 0.5})`
        }

        ctx.fillText(char, i * fontSize, y)

        if (y > height && Math.random() > 0.975) {
          columnsRef.current[i] = 0
        }
        columnsRef.current[i]++
      }
      animRef.current = requestAnimationFrame(draw)
    }

    // Initial dark fill
    ctx.fillStyle = '#0a0a12'
    ctx.fillRect(0, 0, width, height)
    draw()

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [width, height])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block' }}
    />
  )
}

// ── 3D Tilt Icon Container (like space.marsit.uz) ──
function TiltIcon({ children }) {
  const ref = useRef(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glow: false })

  const handleMove = useCallback(e => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5   // -0.5 → 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ rx: -y * 25, ry: x * 25, glow: true })
  }, [])

  const handleLeave = useCallback(() => {
    setTilt({ rx: 0, ry: 0, glow: false })
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative cursor-pointer"
      style={{ perspective: '600px' }}
    >
      <motion.div
        animate={{
          rotateX: tilt.rx,
          rotateY: tilt.ry,
          scale: tilt.glow ? 1.08 : 1,
        }}
        transition={{ type: 'spring', damping: 15, stiffness: 300, mass: 0.6 }}
        className="relative p-3 rounded-xl"
        style={{
          background: tilt.glow ? 'rgba(252,103,54,0.14)' : 'rgba(252,103,54,0.08)',
          border: `1px solid rgba(252,103,54,${tilt.glow ? 0.35 : 0.15})`,
          boxShadow: tilt.glow
            ? '0 8px 32px rgba(252,103,54,0.25), 0 0 60px rgba(252,103,54,0.1)'
            : '0 0 20px rgba(252,103,54,0.05)',
          transformStyle: 'preserve-3d',
          transition: 'background 0.2s, border-color 0.2s, box-shadow 0.3s',
        }}
      >
        {children}
        {/* Shine reflection on hover */}
        <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: tilt.glow ? 0.15 : 0,
              background: `radial-gradient(circle at ${50 + tilt.ry * 2}% ${50 - tilt.rx * 2}%, rgba(255,255,255,0.4), transparent 60%)`,
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}

// ── Dot-Matrix KINO Logo ──
function DotMatrixLogo() {
  const [revealed, setRevealed] = useState([])

  useEffect(() => {
    // Reveal pixels one by one with random order
    const allPixels = []
    KINO_GRID.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val) allPixels.push({ r, c })
      })
    })
    // Shuffle
    for (let i = allPixels.length - 1; i > 0; i--) {
      const j = Math.random() * (i + 1) | 0
      ;[allPixels[i], allPixels[j]] = [allPixels[j], allPixels[i]]
    }

    const timers = []
    allPixels.forEach((px, i) => {
      timers.push(setTimeout(() => {
        setRevealed(prev => [...prev, `${px.r}-${px.c}`])
      }, 80 + i * 35))
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  const cols = KINO_GRID[0].length

  return (
    <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, 6px)` }}>
      {KINO_GRID.flatMap((row, r) =>
        row.map((val, c) => {
          const key = `${r}-${c}`
          const active = val && revealed.includes(key)
          return (
            <div
              key={key}
              className="w-[6px] h-[6px] rounded-[1px] transition-all duration-300"
              style={{
                background: active
                  ? '#fc6736'
                  : val
                    ? 'rgba(252,103,54,0.1)'
                    : 'transparent',
                boxShadow: active ? '0 0 6px rgba(252,103,54,0.6)' : 'none',
              }}
            />
          )
        })
      )}
    </div>
  )
}

// ── Eye icon ──
function EyeIcon({ open }) {
  return open
    ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
      </svg>
    : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path strokeLinecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
}

// ── Input field ──
function Field({ label, type = 'text', ...props }) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  const isPw = type === 'password'

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          className={`text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200
            ${focused ? 'text-[#fc6736]' : 'text-[#8a8a9a]'}`}
          style={{ fontFamily: "'League Spartan', sans-serif" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={isPw ? (show ? 'text' : 'password') : type}
          className={`
            w-full h-[46px] px-4 rounded-xl text-[14px] font-medium outline-none
            transition-all duration-200
            text-white placeholder:text-[#555566]
            ${focused
              ? 'bg-[rgba(252,103,54,0.08)] border-[#fc6736] shadow-[0_0_0_2px_rgba(252,103,54,0.15)]'
              : 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
            }
            border-[1.5px]
            ${isPw ? 'pr-12' : ''}
          `}
          style={{ fontFamily: "'League Spartan', sans-serif", caretColor: '#fc6736' }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {isPw && (
          <button type="button" onClick={() => setShow(v => !v)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors
              ${focused ? 'text-[#fc6736]' : 'text-[#555566] hover:text-[#fc6736]'}`}>
            <EyeIcon open={show} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export function AuthModal({ open, onClose }) {
  const [tab, setTab]         = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ username: '', email: '', password: '' })
  const [shakeKey, setShakeKey] = useState(0)
  const [cardSize, setCardSize] = useState({ w: 420, h: 600 })
  const cardRef = useRef(null)

  const { login, register } = useAuthStore()

  useEffect(() => {
    if (!open) return
    setTab('login'); setError(''); setLoading(false)
    setForm({ username: '', email: '', password: '' })
  }, [open])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  // Measure card for canvas sizing
  const measuredRef = useCallback(node => {
    if (node) {
      cardRef.current = node
      const rect = node.getBoundingClientRect()
      setCardSize({ w: Math.ceil(rect.width), h: Math.ceil(rect.height) })
    }
  }, [])

  if (!open) return null

  const isLogin = tab === 'login'
  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setError('') }
  const switchTab = t => { setTab(t); setError(''); setForm({ username: '', email: '', password: '' }) }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      if (isLogin) {
        await login(form.email, form.password)
      } else {
        if (form.username.length < 3) { setError('Имя минимум 3 символа'); setShakeKey(k => k + 1); setLoading(false); return }
        if (form.password.length < 6) { setError('Пароль минимум 6 символов'); setShakeKey(k => k + 1); setLoading(false); return }
        await register(form.username, form.email, form.password)
      }
      onClose()
      setForm({ username: '', email: '', password: '' })
    } catch (err) {
      setError(err.message)
      setShakeKey(k => k + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop — dark with code rain visible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a0a12]/90 backdrop-blur-sm"
          />

          {/* Card */}
          <motion.div
            ref={measuredRef}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300, mass: 0.8 }}
            className="relative w-full max-w-[440px] rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(16, 16, 26, 0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 120px rgba(252,103,54,0.05), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Code rain background — inside the card */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" style={{ opacity: 0.35 }}>
              <CodeRainCanvas width={cardSize.w || 440} height={cardSize.h || 600} />
            </div>

            {/* Glass overlay to soften the rain */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(180deg, rgba(16,16,26,0.7) 0%, rgba(16,16,26,0.85) 40%, rgba(16,16,26,0.9) 100%)' }}
            />

            {/* Top accent line — orange gradient */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-[3px]"
              style={{ background: 'linear-gradient(90deg, #fc6736, #ff9a44, #fc6736)', transformOrigin: 'left' }}
            />

            {/* Close */}
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(252,103,54,0.15)' }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-3.5 right-4 z-20 flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </motion.button>

            {/* Content — above the rain */}
            <div className="relative z-10 px-8 pt-7 pb-6">
              {/* Brand: dot-matrix KINO logo with 3D tilt + text */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="flex items-center gap-4 mb-7"
              >
                <TiltIcon>
                  <DotMatrixLogo />
                </TiltIcon>
                <div>
                  <div className="flex text-[22px] font-extrabold tracking-[-0.03em] text-white leading-none"
                    style={{ fontFamily: "'League Spartan', sans-serif" }}>
                    {'KINO'.split('').map((letter, i) => (
                      <span
                        key={i}
                        style={{ display: 'inline-block', transition: 'transform 0.06s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.14em] mt-1"
                    style={{ fontFamily: "'League Spartan', sans-serif", color: 'rgba(252,103,54,0.7)' }}>
                    Online Cinema
                  </div>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h2
                key={`h-${tab}`}
                initial={{ opacity: 0, x: isLogin ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                className="text-[24px] font-bold tracking-[-0.02em] text-white leading-tight mb-1"
                style={{ fontFamily: "'League Spartan', sans-serif" }}
              >
                {isLogin ? 'Вход в систему' : 'Регистрация'}
              </motion.h2>
              <motion.p
                key={`s-${tab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="text-[13px] mb-6"
                style={{ fontFamily: "'League Spartan', sans-serif", color: 'rgba(255,255,255,0.35)' }}
              >
                {isLogin ? 'Войдите, чтобы продолжить просмотр.' : 'Создайте аккаунт и смотрите вместе.'}
              </motion.p>

              {/* Tabs — glassmorphism pill switcher */}
              <div className="relative grid grid-cols-2 p-[3px] rounded-xl mb-6"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <motion.div
                  layout
                  className="absolute top-[3px] bottom-[3px] rounded-[10px]"
                  style={{
                    width: 'calc(50% - 3px)',
                    background: 'rgba(252,103,54,0.15)',
                    border: '1px solid rgba(252,103,54,0.25)',
                    boxShadow: '0 0 12px rgba(252,103,54,0.1)',
                  }}
                  animate={{ x: isLogin ? 3 : 'calc(100% + 3px)' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                />
                {['login', 'signup'].map(t => (
                  <button key={t} onClick={() => switchTab(t)}
                    className="relative z-10 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors duration-200"
                    style={{
                      fontFamily: "'League Spartan', sans-serif",
                      color: tab === t ? '#fc6736' : 'rgba(255,255,255,0.35)',
                    }}>
                    {t === 'login' ? 'Войти' : 'Регистрация'}
                  </button>
                ))}
              </div>

              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={tab}
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, x: isLogin ? -16 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 16 : -16 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  {!isLogin && (
                    <Field
                      label="Имя пользователя"
                      value={form.username}
                      onChange={set('username')}
                      placeholder="Введите имя"
                      autoComplete="username"
                      required
                    />
                  )}

                  <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />

                  <Field
                    label="Пароль"
                    type="password"
                    value={form.password}
                    onChange={set('password')}
                    placeholder={isLogin ? 'Введите пароль' : 'Минимум 6 символов'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                  />

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        key={shakeKey}
                        initial={{ opacity: 0, x: 0 }}
                        animate={{ opacity: 1, x: [0, -6, 6, -4, 4, -2, 2, 0] }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
                        style={{ background: 'rgba(252,103,54,0.1)', border: '1px solid rgba(252,103,54,0.2)' }}
                      >
                        <svg width="14" height="14" fill="#fc6736" viewBox="0 0 24 24" className="flex-shrink-0">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        <span className="text-[12px] font-semibold" style={{ fontFamily: "'League Spartan', sans-serif", color: '#fc6736' }}>
                          {error}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit — orange gradient button with shine */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={loading ? {} : { y: -2, boxShadow: '0 12px 32px rgba(252,103,54,0.35)' }}
                    whileTap={loading ? {} : { scale: 0.97, y: 0 }}
                    className="relative w-full h-[48px] mt-1 rounded-xl text-white font-bold text-[14px] tracking-[0.01em]
                               flex items-center justify-center gap-2 overflow-hidden
                               disabled:opacity-50 disabled:cursor-not-allowed transition-shadow duration-200"
                    style={{
                      fontFamily: "'League Spartan', sans-serif",
                      background: 'linear-gradient(135deg, #fc6736 0%, #ff8a44 50%, #fc6736 100%)',
                      boxShadow: '0 4px 20px rgba(252,103,54,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                    }}
                  >
                    {/* Shine sweep */}
                    {!loading && (
                      <span className="absolute top-0 left-[-75%] w-1/2 h-full pointer-events-none"
                        style={{
                          background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.25), transparent)',
                          transform: 'skewX(-20deg)',
                          animation: 'authShine 3s ease-in-out infinite',
                        }}
                      />
                    )}
                    <span className="relative flex items-center gap-2">
                      {loading
                        ? <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        : <>
                            {isLogin ? 'Войти в систему' : 'Создать аккаунт'}
                            <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                          </>
                      }
                    </span>
                  </motion.button>

                  {isLogin && (
                    <button type="button"
                      className="text-center text-[12px] font-medium transition-colors mt-0.5 hover:text-[#fc6736]"
                      style={{ fontFamily: "'League Spartan', sans-serif", color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none' }}>
                      Забыли пароль?
                    </button>
                  )}
                </motion.form>
              </AnimatePresence>

              {/* Switch tab */}
              <p className="text-center text-[12px] mt-5"
                style={{ fontFamily: "'League Spartan', sans-serif", color: 'rgba(255,255,255,0.3)' }}>
                {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
                <button onClick={() => switchTab(isLogin ? 'signup' : 'login')}
                  className="font-bold hover:underline underline-offset-2 transition-colors"
                  style={{ fontFamily: "'League Spartan', sans-serif", color: '#fc6736', background: 'none', border: 'none' }}>
                  {isLogin ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </p>
            </div>

            {/* Footer with "Cinema Rain — KINO" badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative z-10 flex items-center justify-between px-6 py-3.5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,18,0.5)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.1em]"
                  style={{ fontFamily: "'League Spartan', sans-serif", color: 'rgba(255,255,255,0.2)' }}>
                  KINO
                </span>
                <div className="w-[3px] h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                <span className="text-[10px] font-medium uppercase tracking-[0.1em]"
                  style={{ fontFamily: "'League Spartan', sans-serif", color: 'rgba(255,255,255,0.2)' }}>
                  2025
                </span>
              </div>

              {/* Cinema Rain badge — adapted from "Code Rain - Mars Team" */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(252,103,54,0.08)', border: '1px solid rgba(252,103,54,0.12)' }}>
                <div className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ background: '#fc6736', boxShadow: '0 0 6px rgba(252,103,54,0.5)' }} />
                <span className="text-[10px] font-semibold tracking-[0.06em]"
                  style={{ fontFamily: "'League Spartan', sans-serif", color: 'rgba(252,103,54,0.7)' }}>
                  Cinema Rain — KINO
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Global keyframes */}
          <style>{`
            @keyframes authShine {
              0%   { left: -75% }
              100% { left: 150% }
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  )
}
