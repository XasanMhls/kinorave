import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { Avatar } from './ui/Avatar'

const NAV = [
  { to: '/',         label: 'Главная'    },
  { to: '/movies',   label: 'Фильмы'    },
  { to: '/series',   label: 'Сериалы'   },
  { to: '/cartoons', label: 'Мультфильмы' },
  { to: '/anime',    label: 'Аниме'     },
]

export function Navbar({ onAuthOpen }) {
  const { user, logout } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [scrolled,    setScrolled]    = useState(false)
  const [search,      setSearch]      = useState('')
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [userMenuOpen,setUserMenuOpen]= useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false) }, [location.pathname])

  const handleSearch = e => {
    e.preventDefault()
    const q = search.trim()
    if (q) { navigate(`/search?q=${encodeURIComponent(q)}`); setSearch('') }
  }

  const isActive = to => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <motion.header
      initial={{ y: -72 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#07070d]/85 backdrop-blur-2xl border-b border-white/6 shadow-[0_1px_24px_rgba(0,0,0,0.5)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-5">

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

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`relative px-3.5 py-2 text-sm font-medium rounded-xl transition-colors duration-150 ${
                isActive(to)
                  ? 'text-white'
                  : 'text-white/45 hover:text-white/80'
              }`}
            >
              {isActive(to) && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-white/8"
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
              )}
              <span className="relative">{label}</span>
            </Link>
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

          {/* Mobile menu button */}
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
            className="lg:hidden overflow-hidden border-t border-white/6 bg-[#07070d]/95 backdrop-blur-2xl"
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
              {NAV.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(to)
                      ? 'text-white bg-white/8'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
