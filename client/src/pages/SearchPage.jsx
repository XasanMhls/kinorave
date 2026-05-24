import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MovieCard, MovieCardSkeleton } from '../components/MovieCard'
import { searchMulti } from '../services/tmdb'
import { searchKP } from '../services/poiskkino'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery]     = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage]       = useState(1)
  const [total, setTotal]     = useState(0)

  const debounced = useDebounce(query, 350)

  useEffect(() => {
    if (!debounced.trim()) { setResults([]); setTotal(0); return }
    setLoading(true)
    setSearchParams({ q: debounced }, { replace: true })

    Promise.allSettled([
      searchMulti(debounced, 'ru', 1),
      searchKP(debounced, 10),
    ]).then(([tmdbRes, kpRes]) => {
      const tmdb = tmdbRes.status === 'fulfilled'
        ? (tmdbRes.value.results || []).filter(r => r.media_type !== 'person')
        : []

      // Only KP results that have a TMDB ID (so the movie page works)
      const kp = kpRes.status === 'fulfilled'
        ? (kpRes.value.results || []).filter(m => m._source === 'kp' && m.id !== m.kp_id)
        : []

      // Deduplicate: skip KP items already in TMDB results
      const tmdbIds = new Set(tmdb.map(m => m.id))
      const uniqueKP = kp.filter(m => !tmdbIds.has(m.id))

      setResults([...tmdb, ...uniqueKP])
      setTotal(tmdbRes.status === 'fulfilled' ? (tmdbRes.value.total_results || 0) + uniqueKP.length : 0)
      setPage(1)
    }).finally(() => setLoading(false))
  }, [debounced])

  const loadMore = () => {
    const next = page + 1
    setLoading(true)
    searchMulti(debounced, 'ru', next)
      .then(data => {
        setResults(r => [...r, ...(data.results?.filter(r => r.media_type !== 'person') || [])])
        setPage(next)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const canLoadMore = results.length < total && !loading

  return (
    <div className="min-h-screen bg-bg-base pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск фильмов и сериалов..."
              autoFocus
              className="w-full pl-12 pr-4 py-4 text-base rounded-2xl bg-bg-surface border border-border text-white placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors shadow-card"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results header */}
        {debounced && (
          <div className="mb-6">
            <p className="text-text-secondary">
              {loading
                ? 'Поиск...'
                : total > 0
                  ? `Найдено ${total.toLocaleString('ru')} результатов по запросу "${debounced}"`
                  : `Ничего не найдено по запросу "${debounced}"`
              }
            </p>
          </div>
        )}

        {/* Empty state */}
        {!debounced && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-bg-elevated border border-border flex items-center justify-center">
              <svg className="w-9 h-9 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-text-secondary text-lg">Введите название фильма или сериала</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
          {results.map((item, i) => (
            <MovieCard
              key={item.id}
              movie={item}
              type={item.media_type === 'tv' || item.type === 'tv' ? 'tv' : 'movie'}
              index={i}
            />
          ))}
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>

        {/* Load more */}
        {canLoadMore && (
          <div className="flex justify-center mt-10">
            <button onClick={loadMore} className="btn-secondary px-8 py-3">
              Загрузить ещё
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
