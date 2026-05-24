import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { Avatar } from './ui/Avatar'

// ── Category dropdowns ─────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    label: 'Фильмы',
    to: '/movies',
    items: [
      { label: 'Все фильмы',    to: '/movies' },
      null,
      { label: '🎬 Боевики',    to: '/genre/28?type=movie' },
      { label: '😂 Комедии',    to: '/genre/35?type=movie' },
      { label: '🎭 Драмы',      to: '/genre/18?type=movie' },
      { label: '👻 Ужасы',      to: '/genre/27?type=movie' },
      { label: '🚀 Фантастика', to: '/genre/878?type=movie' },
      { label: '🔍 Триллеры',   to: '/genre/53?type=movie' },
      { label: '🧙 Фэнтези',    to: '/genre/14?type=movie' },
      { label: '💘 Мелодрамы',  to: '/genre/10749?type=movie' },
      { label: '🌊 Приключения',to: '/genre/12?type=movie' },
      { label: '🕵️ Криминал',   to: '/genre/80?type=movie' },
      { label: '⚔️ Исторические',to: '/genre/36?type=movie' },
      { label: '🌍 Документальные', to: '/genre/99?type=movie' },
    ],
  },
  {
    label: 'Сериалы',
    to: '/series',
    items: [
      { label: 'Все сериалы',   to: '/series' },
      null,
      { label: '🎬 Боевики',    to: '/genre/28?type=tv' },
      { label: '😂 Комедии',    to: '/genre/35?type=tv' },
      { label: '🎭 Драмы',      to: '/genre/18?type=tv' },
      { label: '👻 Ужасы',      to: '/genre/27?type=tv' },
      { label: '🚀 Фантастика', to: '/genre/878?type=tv' },
      { label: '🔍 Триллеры',   to: '/genre/53?type=tv' },
      { label: '💘 Мелодрамы',  to: '/genre/10749?type=tv' },
      { label: '🧩 Мистика',    to: '/genre/9648?type=tv' },
      { label: '🕵️ Криминал',   to: '/genre/80?type=tv' },
    ],
  },
  {
    label: 'Мультфильмы',
    to: '/cartoons',
    items: [
      { label: 'Все мультфильмы', to: '/cartoons' },
      null,
      { label: '🎪 Анимация (фильмы)',  to: '/genre/16?type=movie' },
      { label: '📺 Мультсериалы',       to: '/genre/16?type=tv' },
      { label: '👨‍👩‍👧 Семейные',           to: '/genre/10751?type=movie' },
      { label: '✨ Для детей',           to: '/genre/10751?type=tv' },
    ],
  },
  {
    label: 'Аниме',
    to: '/anime',
    items: [
      { label: 'Всё аниме',         to: '/anime' },
      null,
      { label: '⚡ Аниме-сериалы',  to: '/genre/16?type=tv' },
      { label: '🎌 Аниме-фильмы',   to: '/genre/16?type=movie' },
    ],
  },
]

function NavDropdown({ cat, isActive }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const location = useLocation()

  // Close on outside click
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Close on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`relative flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-xl transition-colors duration-150 ${
          isActive ? 'text-white' : 'text-white/45 hover:text-white/80'
        }`}
      >
        {isActive && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 rounded-xl bg-white/8"
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          />
        )}
        <span className="relative">{cat.label}</span>
        <svg
          className={`relative w-3 h-3 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.13 }}
            className="absolute left-0 top-full mt-2 w-52 bg-[#0f0f1a]/97 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden z-50"
          >
            <div className="p-1.5">
              {cat.items.map((item, i) =>
                item === null ? (
                  <div key={i} className="h-px bg-white/6 my-1" />
                ) : (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl text-white/60 hover:text-white hover:bg-white/6 transition-colors"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Navbar({ onAuthOpen }) {
  const { user, logout } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [scrolled,     setScrolled]     = useState(false)
  const [search,       setSearch]       = useState('')
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(null) // which category is expanded in mobile
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
    setMobileExpanded(null)
  }, [location.pathname])

  const handleSearch = e => {
    e.preventDefault()
    const q = search.trim()
    if (q) { navigate(`/search?q=${encodeURIComponent(q)}`); setSearch('') }
  }

  const isCatActive = cat =>
    location.pathname === cat.to ||
    (cat.to !== '/' && location.pathname.startsWith(cat.to))

  return (
    <motion.header
      initial={{ y: -72 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#07070d]/88 backdrop-blur-2xl border-b border-white/6 shadow-[0_1px_24px_rgba(0,0,0,0.5)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.4)] group-hover:shadow-[0_0_24px_rgba(124,58,237,0.6)] transition-shadow">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-400 hidden sm:block">
            KINO
          </span>
        </Link>

        {/* Desktop nav — Главная + dropdowns */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {/* Главная */}
          <Link
            to="/"
            className={`relative px-3.5 py-2 text-sm font-medium rounded-xl transition-colors duration-150 ${
              location.pathname === '/' ? 'text-white' : 'text-white/45 hover:text-white/80'
            }`}
          >
            {location.pathname === '/' && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-xl bg-white/8"
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              />
            )}
            <span className="relative">Главная</span>
          </Link>

          {CATEGORIES.map(cat => (
            <NavDropdown key={cat.to} cat={cat} isActive={isCatActive(cat)} />
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs hidden sm:flex">
          <div className="relative w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-[#161625] border border-white/10 text-white placeholder:text-white/30 outline-none focus:bg-[#1e1e30] focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] transition-all caret-violet-400"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 px-2 pr-3 py-1.5 rounded-xl hover:bg-white/6 transition-colors"
              >
                <Avatar name={user.username} size="sm" />
                <span className="text-sm font-medium text-white hidden sm:block">{user.username}</span>
                <svg className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-[#12121a]/95 backdrop-blur-xl border border-white/8 rounded-2xl shadow-2xl overflow-hidden"
                  >
                    <div className="p-1.5">
                      <div className="px-3 py-2 mb-1">
                        <p className="text-xs text-white/30">Вошёл как</p>
                        <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                      </div>
                      <div className="h-px bg-white/6 mb-1" />
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/6 rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                        Выйти
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onAuthOpen}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_28px_rgba(124,58,237,0.5)] transition-all"
            >
              Войти
            </motion.button>
          )}

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/6 transition-colors"
          >
            <motion.svg
              animate={{ rotate: mobileOpen ? 45 : 0 }}
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              }
            </motion.svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-t border-white/6 bg-[#07070d]/97 backdrop-blur-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="mb-2">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск фильмов, аниме..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#161625] border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-violet-500/60 transition-all caret-violet-400"
                />
              </form>

              {/* Главная */}
              <Link
                to="/"
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === '/' ? 'text-white bg-white/8' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                Главная
              </Link>

              {/* Categories with accordion */}
              {CATEGORIES.map(cat => (
                <div key={cat.to}>
                  <button
                    onClick={() => setMobileExpanded(prev => prev === cat.to ? null : cat.to)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isCatActive(cat) ? 'text-white bg-white/8' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <svg
                      className={`w-4 h-4 opacity-50 transition-transform duration-200 ${mobileExpanded === cat.to ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {mobileExpanded === cat.to && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-3 mt-0.5 mb-1 pl-3 border-l border-white/8 flex flex-col gap-0.5">
                          {cat.items.map((item, i) =>
                            item === null ? (
                              <div key={i} className="h-px bg-white/5 my-0.5" />
                            ) : (
                              <Link
                                key={item.to}
                                to={item.to}
                                className="px-2 py-2 text-sm text-white/45 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                              >
                                {item.label}
                              </Link>
                            )
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
