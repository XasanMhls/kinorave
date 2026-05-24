import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { VideoPlayer } from '../components/VideoPlayer'
import { MovieRow } from '../components/MovieRow'
import { CreateLobbyModal } from '../components/CreateLobbyModal'
import { Comments } from '../components/Comments'
import { getMovieDetails, IMG, BACKDROP, findTrailer } from '../services/tmdb'
import { formatRuntime, formatYear, formatRating, formatVotes, getRatingColor } from '../utils/format'

export function MoviePage({ onAuthOpen }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [partyOpen, setPartyOpen] = useState(false)
  const playerRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setPlaying(false)
    window.scrollTo(0, 0)
    getMovieDetails(id)
      .then(data => {
        setMovie(data)
        // ?play=1 — auto-start player (from Hero "Watch" button)
        if (searchParams.get('play') === '1') {
          setTimeout(() => {
            setPlaying(true)
            playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 400)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <MoviePageSkeleton />
  if (!movie) return <NotFound />

  const backdrop = BACKDROP(movie.backdrop_path)
  const poster   = IMG(movie.poster_path, 'w500')
  const year     = formatYear(movie.release_date)
  const runtime  = formatRuntime(movie.runtime)
  const rating   = formatRating(movie.vote_average)
  const ratingColor = getRatingColor(movie.vote_average)
  const genres   = movie.genres?.map(g => g.name) || []
  const cast     = movie.credits?.cast?.slice(0, 8) || []
  const similar  = movie.similar?.results?.slice(0, 12) || []
  const trailer  = findTrailer(movie.videos)
  const providers = movie['watch/providers']?.results?.RU

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Backdrop */}
      <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
        {backdrop && (
          <>
            <img src={backdrop} alt={movie.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg-base/95 via-bg-base/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-transparent" />
          </>
        )}

        {/* Play overlay */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPlaying(true)}
              className="w-20 h-20 rounded-full bg-accent/90 backdrop-blur-sm flex items-center justify-center shadow-glow-lg"
            >
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-32 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Poster */}
          <div className="hidden lg:block flex-shrink-0">
            {poster && (
              <img
                src={poster}
                alt={movie.title}
                className="w-56 rounded-2xl shadow-card border border-border-subtle"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-8">
            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-4">
              {genres.map(g => (
                <span key={g} className="px-3 py-1 rounded-full bg-bg-elevated border border-border text-text-secondary text-xs font-medium">
                  {g}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-3">
              {movie.title}
            </h1>
            {movie.original_title !== movie.title && (
              <p className="text-text-muted text-lg mb-4">{movie.original_title}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-text-secondary text-sm">{year}</span>
              {runtime && <span className="text-text-muted">·</span>}
              {runtime && <span className="text-text-secondary text-sm">{runtime}</span>}
              <span className="text-text-muted">·</span>
              <span className="text-sm font-bold" style={{ color: ratingColor }}>★ {rating}</span>
              <span className="text-text-muted text-xs">{formatVotes(movie.vote_count)} голосов</span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-8">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setPlaying(true)
                  setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
                }}
                className="relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-base text-white overflow-hidden
                           bg-gradient-to-r from-violet-600 to-purple-500
                           shadow-[0_0_32px_rgba(124,58,237,0.5)] hover:shadow-[0_0_48px_rgba(124,58,237,0.7)]
                           transition-shadow duration-300"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                <svg className="w-5 h-5 relative" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="relative">Смотреть</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setPartyOpen(true)}
                className="btn-secondary text-base px-6 py-3.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Watch Party
              </motion.button>
            </div>

            {/* Trailer */}
            <div className="mb-8">
              {trailer ? (
                <div className="rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.6)]" style={{ aspectRatio: '16/9' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    className="w-full h-full border-0"
                    title="Трейлер"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-elevated border border-border">
                  <svg className="w-5 h-5 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M3 8a1 1 0 011-1h9a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
                  </svg>
                  <span className="text-text-muted text-sm">Трейлер не найден</span>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent((movie.title || movie.original_title) + ' трейлер')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/80 text-white text-xs font-medium hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    Найти на YouTube
                  </a>
                </div>
              )}
            </div>

            {/* Watch Providers */}
            {providers && (providers.flatrate || providers.rent || providers.buy) && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Где смотреть</h3>
                <div className="flex flex-wrap gap-2">
                  {[...(providers.flatrate || []), ...(providers.rent || []), ...(providers.buy || [])]
                    .filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i)
                    .map(p => (
                      <a
                        key={p.provider_id}
                        href={providers.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-elevated border border-border hover:border-violet-500/40 hover:bg-violet-500/5 transition-all group"
                        title={p.provider_name}
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                          alt={p.provider_name}
                          className="w-6 h-6 rounded"
                        />
                        <span className="text-xs text-white/60 group-hover:text-white transition-colors">{p.provider_name}</span>
                      </a>
                    ))
                  }
                </div>
                <p className="text-xs text-text-muted mt-2">Данные от JustWatch / TMDB</p>
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Описание</h3>
                <p className="text-white/80 leading-relaxed">{movie.overview}</p>
              </div>
            )}
          </div>
        </div>

        {/* Video player (when playing) */}
        {playing && (
          <motion.div
            ref={playerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <VideoPlayer movieId={movie.id} movieType="movie" />
          </motion.div>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-4">В ролях</h2>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {cast.map(person => (
                <div key={person.id} className="flex-shrink-0 w-24 text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-bg-elevated mb-2 mx-auto">
                    {person.profile_path
                      ? <img src={IMG(person.profile_path, 'w185')} alt={person.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-text-muted">
                          {person.name[0]}
                        </div>
                    }
                  </div>
                  <p className="text-xs font-medium text-white line-clamp-1">{person.name}</p>
                  <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Comments */}
        <Comments movieId={movie.id} movieType="movie" />

        {/* Similar */}
        {similar.length > 0 && (
          <div className="mt-14 pb-16">
            <MovieRow title="Похожие фильмы" movies={similar} type="movie" />
          </div>
        )}
      </div>

      <CreateLobbyModal
        open={partyOpen}
        movie={movie}
        onClose={() => setPartyOpen(false)}
        onAuthRequired={onAuthOpen}
      />
    </div>
  )
}

function MoviePageSkeleton() {
  return (
    <div className="min-h-screen bg-bg-base animate-pulse">
      <div className="h-[60vh] skeleton" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-32 relative z-10">
        <div className="flex gap-8 pt-8">
          <div className="hidden lg:block w-56 aspect-[2/3] skeleton rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-4 pt-8">
            <div className="h-4 skeleton rounded w-40" />
            <div className="h-12 skeleton rounded w-3/4" />
            <div className="h-4 skeleton rounded w-48" />
            <div className="h-10 skeleton rounded w-40 mt-6" />
            <div className="h-4 skeleton rounded w-full mt-6" />
            <div className="h-4 skeleton rounded w-5/6" />
          </div>
        </div>
      </div>
    </div>
  )
}

function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl font-black text-text-muted mb-4">404</p>
        <p className="text-white text-xl font-bold mb-6">Фильм не найден</p>
        <button onClick={() => navigate('/')} className="btn-primary">На главную</button>
      </div>
    </div>
  )
}
