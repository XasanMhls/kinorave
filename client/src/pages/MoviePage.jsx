import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { VideoPlayer } from '../components/VideoPlayer'
import { MovieRow } from '../components/MovieRow'
import { CreateLobbyModal } from '../components/CreateLobbyModal'
import { Comments } from '../components/Comments'
import { getMovieDetails, IMG, BACKDROP } from '../services/tmdb'
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
