import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MovieCard, MovieCardSkeleton } from '../components/MovieCard'
import { getMoviesByGenre, getSeriesByGenre, GENRE_META } from '../services/tmdb'

export function GenrePage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const genreId = Number(id)
  const mediaType = searchParams.get('type') === 'tv' ? 'tv' : 'movie'

  const meta = GENRE_META[genreId] ?? { emoji: '🎬', label: 'Жанр' }

  const [items,   setItems]   = useState([])
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [more,    setMore]    = useState(false)

  const fetcher = mediaType === 'tv' ? getSeriesByGenre : getMoviesByGenre

  useEffect(() => {
    setItems([])
    setPage(1)
    setTotal(0)
    setLoading(true)
    fetcher(genreId, 'ru', 1)
      .then(res => {
        setItems(res.results ?? [])
        setTotal(res.total_pages ?? 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [genreId, mediaType])

  const loadMore = () => {
    const next = page + 1
    setMore(true)
    fetcher(genreId, 'ru', next)
      .then(res => {
        setItems(prev => [...prev, ...(res.results ?? [])])
        setPage(next)
      })
      .catch(console.error)
      .finally(() => setMore(false))
  }

  const backTo = mediaType === 'tv' ? '/series' : '/movies'
  const backLabel = mediaType === 'tv' ? 'Сериалы' : 'Фильмы'

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-5 text-sm text-white/30">
            <Link to="/" className="hover:text-white/60 transition-colors">Главная</Link>
            <span>/</span>
            <Link to={backTo} className="hover:text-white/60 transition-colors">{backLabel}</Link>
            <span>/</span>
            <span className="text-white/60">{meta.label}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-600/20 border border-violet-500/20 flex items-center justify-center text-3xl flex-shrink-0">
              {meta.emoji}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{meta.label}</h1>
              <p className="text-white/35 text-sm mt-1">
                {mediaType === 'tv' ? 'Сериалы' : 'Фильмы'} · Жанр
              </p>
            </div>
          </div>

          {/* Type switcher */}
          <div className="flex gap-2 mt-6">
            <Link
              to={`/genre/${genreId}?type=movie`}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                mediaType === 'movie'
                  ? 'bg-violet-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.35)]'
                  : 'bg-white/5 border border-white/8 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              Фильмы
            </Link>
            <Link
              to={`/genre/${genreId}?type=tv`}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                mediaType === 'tv'
                  ? 'bg-violet-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.35)]'
                  : 'bg-white/5 border border-white/8 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              Сериалы
            </Link>
          </div>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
            {Array.from({ length: 21 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <span className="text-6xl mb-4">{meta.emoji}</span>
            <p className="text-white/40 text-lg">Ничего не найдено</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4"
            >
              {items.map((item, i) => (
                <MovieCard key={`${item.id}-${i}`} movie={item} type={mediaType} index={i} />
              ))}
            </motion.div>

            {page < total && (
              <div className="flex justify-center mt-12">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={loadMore}
                  disabled={more}
                  className="px-8 py-3 rounded-2xl font-semibold text-sm
                             bg-white/5 border border-white/10 text-white/70
                             hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-all duration-150"
                >
                  {more ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Загружаем...
                    </span>
                  ) : 'Загрузить ещё'}
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
