import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { AuthModal } from './components/AuthModal'
import { useAuthStore } from './store/authStore'

const HomePage    = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const MoviePage   = lazy(() => import('./pages/MoviePage').then(m => ({ default: m.MoviePage })))
const TvShowPage  = lazy(() => import('./pages/TvShowPage').then(m => ({ default: m.TvShowPage })))
const SearchPage  = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })))
const LobbyPage   = lazy(() => import('./pages/LobbyPage').then(m => ({ default: m.LobbyPage })))
const MoviesPage  = lazy(() => import('./pages/CatalogPage').then(m => ({ default: m.MoviesPage })))
const SeriesPage  = lazy(() => import('./pages/CatalogPage').then(m => ({ default: m.SeriesPage })))
const CartoonsPage= lazy(() => import('./pages/CatalogPage').then(m => ({ default: m.CartoonsPage })))
const AnimePage   = lazy(() => import('./pages/CatalogPage').then(m => ({ default: m.AnimePage })))

function Spinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#07070d]">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
    </div>
  )
}

function MainLayout({ onAuthOpen, children }) {
  return (
    <div className="min-h-screen bg-[#07070d] flex flex-col">
      <Navbar onAuthOpen={onAuthOpen} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  const [authOpen, setAuthOpen] = useState(false)
  const { init, loading } = useAuthStore()

  useEffect(() => { init() }, [])

  if (loading) return <Spinner />

  const openAuth = () => setAuthOpen(true)

  return (
    <BrowserRouter>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* Lobby — full-screen, no chrome */}
          <Route path="/lobby/:code" element={<LobbyPage onAuthOpen={openAuth} />} />

          {/* Everything else inside layout */}
          <Route path="*" element={
            <MainLayout onAuthOpen={openAuth}>
              <Routes>
                <Route path="/"           element={<HomePage   onAuthOpen={openAuth} />} />
                <Route path="/movies"     element={<MoviesPage />} />
                <Route path="/series"     element={<SeriesPage />} />
                <Route path="/cartoons"   element={<CartoonsPage />} />
                <Route path="/anime"      element={<AnimePage />} />
                <Route path="/movie/:id"  element={<MoviePage  onAuthOpen={openAuth} />} />
                <Route path="/tv/:id"     element={<TvShowPage onAuthOpen={openAuth} />} />
                <Route path="/search"     element={<SearchPage />} />
                <Route path="*"           element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
