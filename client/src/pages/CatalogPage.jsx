import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MovieCard, MovieCardSkeleton } from '../components/MovieCard'
import {
  getPopularMovies, getTopRated, getNowPlaying, getUpcoming,
  getActionMovies, getComedyMovies, getHorrorMovies,
  getDramaMovies, getScifiMovies, getThrillerMovies,
  getPopularSeries, getTopRatedSeries, getTrendingTV, getOnAirSeries,
  getAnimatedMovies, getAnimatedSeries, getKidsMovies, getPopularCartoons,
  getTrendingAnime, getTopAnime, getNewAnime, getAnimeMovies,
} from '../services/tmdb'

// ── Movies ────────────────────────────────────────────────────────────────────
const MOVIE_TABS = [
  { label: 'Популярные',    fn: getPopularMovies,   type: 'movie' },
  { label: 'Топ рейтинг',  fn: getTopRated,         type: 'movie' },
  { label: 'В кино',        fn: getNowPlaying,       type: 'movie' },
  { label: 'Скоро',         fn: getUpcoming,         type: 'movie' },
  { label: 'Боевики',       fn: getActionMovies,     type: 'movie' },
  { label: 'Комедии',       fn: getComedyMovies,     type: 'movie' },
  { label: 'Ужасы',         fn: getHorrorMovies,     type: 'movie' },
  { label: 'Драмы',         fn: getDramaMovies,      type: 'movie' },
  { label: 'Фантастика',    fn: getScifiMovies,      type: 'movie' },
  { label: 'Триллеры',      fn: getThrillerMovies,   type: 'movie' },
]

// ── TV Series ─────────────────────────────────────────────────────────────────
const SERIES_TABS = [
  { label: 'Популярные',    fn: getPopularSeries,    type: 'tv' },
  { label: 'В тренде',      fn: getTrendingTV,       type: 'tv' },
  { label: 'Топ рейтинг',  fn: getTopRatedSeries,   type: 'tv' },
  { label: 'Сейчас в эфире', fn: getOnAirSeries,    type: 'tv' },
]

// ── Cartoons / Animation ──────────────────────────────────────────────────────
const CARTOON_TABS = [
  { label: 'Мультфильмы',   fn: getAnimatedMovies,  type: 'movie' },
  { label: 'Мультсериалы',  fn: getAnimatedSeries,  type: 'tv' },
  { label: 'Для детей',     fn: getKidsMovies,      type: 'movie' },
  { label: 'Семейные',      fn: getPopularCartoons, type: 'tv' },
]

// ── Anime ─────────────────────────────────────────────────────────────────────
const ANIME_TABS = [
  { label: 'Популярные',    fn: getTrendingAnime,   type: 'tv' },
  { label: 'Топ аниме',     fn: getTopAnime,        type: 'tv' },
  { label: 'Новинки',       fn: getNewAnime,        type: 'tv' },
  { label: 'Аниме-фильмы',  fn: getAnimeMovies,     type: 'movie' },
]

function CatalogGrid({ tabs, title, accent = 'violet' }) {
  const [tab, setTab]       = useState(0)
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback((tabIdx, pageNum, append = false) => {
    setLoading(true)
    tabs[tabIdx].fn('ru', pageNum)
      .then(d => {
        const results = d.results || []
        setItems(prev => append ? [...prev, ...results] : results)
        setTotalPages(d.total_pages || 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tabs])

  useEffect(() => {
    setItems([])
    setPage(1)
    load(tab, 1, false)
  }, [tab])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    load(tab, next, true)
  }

  return (
    <div>
      {/* Tab bar — scrollable on mobile */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-8" style={{ scrollbarWidth: 'none' }}>
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === i
                ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.35)]'
                : 'bg-white/5 border border-white/8 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
        {items.map((item, i) => (
          <MovieCard key={`${item.id}-${i}`} movie={item} type={tabs[tab].type} index={i} />
        ))}
        {loading && Array.from({ length: 14 }).map((_, i) => <MovieCardSkeleton key={i} />)}
      </div>

      {/* Load more */}
      {!loading && page < totalPages && items.length > 0 && (
        <div className="flex justify-center mt-10">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={loadMore}
            className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 text-sm font-semibold transition-all"
          >
            Загрузить ещё
          </motion.button>
        </div>
      )}
    </div>
  )
}

function CatalogPage({ title, emoji, tabs, description }) {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{emoji}</span>
            <h1 className="text-4xl font-black text-white tracking-tight">{title}</h1>
          </div>
          {description && <p className="text-white/40 text-sm mt-2 ml-14">{description}</p>}
        </motion.div>

        <CatalogGrid tabs={tabs} title={title} />
      </div>
    </div>
  )
}

export function MoviesPage() {
  return (
    <CatalogPage
      title="Фильмы"
      emoji="🎬"
      tabs={MOVIE_TABS}
      description="Полная коллекция — от боевиков до драм"
    />
  )
}

export function SeriesPage() {
  return (
    <CatalogPage
      title="Сериалы"
      emoji="📺"
      tabs={SERIES_TABS}
      description="Лучшие сериалы со всего мира"
    />
  )
}

export function CartoonsPage() {
  return (
    <CatalogPage
      title="Мультфильмы"
      emoji="✨"
      tabs={CARTOON_TABS}
      description="Анимация для детей и взрослых"
    />
  )
}

export function AnimePage() {
  return (
    <CatalogPage
      title="Аниме"
      emoji="⚡"
      tabs={ANIME_TABS}
      description="Лучшее японское аниме — сериалы и фильмы"
    />
  )
}
