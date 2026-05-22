import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoPlayer } from '../components/VideoPlayer'
import { MovieRow } from '../components/MovieRow'
import { CreateLobbyModal } from '../components/CreateLobbyModal'
import { Comments } from '../components/Comments'
import { getSeriesDetails, getSeasonDetails, IMG, BACKDROP } from '../services/tmdb'
import { formatYear, formatRating, getRatingColor } from '../utils/format'

export function TvShowPage({ onAuthOpen }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const playerRef = useRef(null)
  const [show, setShow] = useState(null)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [partyOpen, setPartyOpen] = useState(false)

  const startPlay = () => {
    setPlaying(true)
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
  }

  useEffect(() => {
    setLoading(true)
    setPlaying(false)
    window.scrollTo(0, 0)
    getSeriesDetails(id)
      .then(data => {
        setShow(data)
        const s = data.seasons?.find(s => s.season_number > 0)?.season_number || 1
        setSeason(s)
        if (searchParams.get('play') === '1') {
          setTimeout(() => { setPlaying(true); playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 400)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!show) return
    getSeasonDetails(id, season)
      .then(data => setEpisodes(data.episodes || []))
      .catch(() => setEpisodes([]))
  }, [id, season, show])

  if (loading) return <div className="min-h-screen bg-bg-base animate-pulse"><div className="h-[60vh] skeleton" /></div>
  if (!show) return null

  const backdrop = BACKDROP(show.backdrop_path)
  const poster   = IMG(show.poster_path, 'w500')
  const year     = formatYear(show.first_air_date)
  const rating   = formatRating(show.vote_average)
  const ratingColor = getRatingColor(show.vote_average)
  const genres   = show.genres?.map(g => g.name) || []
  const seasons  = show.seasons?.filter(s => s.season_number > 0) || []
  const similar  = show.similar?.results?.slice(0, 12) || []

  const currentEpisode = episodes.find(e => e.episode_number === episode) || episodes[0]

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Backdrop */}
      <div className="relative h-[50vh] min-h-[360px] overflow-hidden">
        {backdrop && (
          <>
            <img src={backdrop} alt={show.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg-base/95 via-bg-base/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-transparent" />
          </>
        )}
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
            {poster && <img src={poster} alt={show.name} className="w-52 rounded-2xl shadow-card border border-border-subtle" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {genres.map(g => (
                <span key={g} className="px-3 py-1 rounded-full bg-bg-elevated border border-border text-text-secondary text-xs font-medium">{g}</span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">{show.name}</h1>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-text-secondary text-sm">{year}</span>
              <span className="text-text-muted">·</span>
              <span className="text-sm font-bold" style={{ color: ratingColor }}>★ {rating}</span>
              {seasons.length > 0 && (
                <>
                  <span className="text-text-muted">·</span>
                  <span className="text-text-secondary text-sm">{seasons.length} сез.</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={startPlay}
                className="relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-base text-white overflow-hidden
                           bg-gradient-to-r from-violet-600 to-purple-500
                           shadow-[0_0_32px_rgba(124,58,237,0.5)] hover:shadow-[0_0_48px_rgba(124,58,237,0.7)]
                           transition-shadow duration-300"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                <svg className="w-5 h-5 relative" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
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

            {show.overview && <p className="text-white/80 leading-relaxed mb-6">{show.overview}</p>}
          </div>
        </div>

        {/* Player */}
        {playing && (
          <motion.div ref={playerRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <VideoPlayer movieId={show.id} movieType="tv" season={season} episode={episode} />
          </motion.div>
        )}

        {/* Season / Episode selector */}
        <div className="mt-10 space-y-6">
          {/* Seasons */}
          {seasons.length > 1 && (
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Сезон</h3>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {seasons.map(s => (
                  <button
                    key={s.season_number}
                    onClick={() => { setSeason(s.season_number); setEpisode(1) }}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      season === s.season_number
                        ? 'bg-accent text-white shadow-glow-sm'
                        : 'bg-bg-elevated border border-border text-text-secondary hover:text-white hover:border-border-strong'
                    }`}
                  >
                    Сезон {s.season_number}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Episodes */}
          {episodes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Эпизоды</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {episodes.map(ep => (
                  <button
                    key={ep.episode_number}
                    onClick={() => { setEpisode(ep.episode_number); startPlay() }}
                    className={`flex gap-3 p-3 rounded-xl text-left transition-all ${
                      episode === ep.episode_number
                        ? 'bg-accent/10 border border-accent/30'
                        : 'bg-bg-elevated border border-border hover:border-border-strong'
                    }`}
                  >
                    {ep.still_path
                      ? <img src={IMG(ep.still_path, 'w185')} alt="" className="w-24 h-14 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-24 h-14 rounded-lg bg-bg-base flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-text-muted" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                    }
                    <div className="min-w-0">
                      <p className="text-xs text-text-muted">Эп. {ep.episode_number}</p>
                      <p className="text-sm font-semibold text-white line-clamp-1 mt-0.5">{ep.name}</p>
                      <p className="text-xs text-text-muted line-clamp-2 mt-0.5">{ep.overview}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Comments */}
        <Comments movieId={id} movieType="tv" />

        {similar.length > 0 && (
          <div className="mt-14 pb-16">
            <MovieRow title="Похожие сериалы" movies={similar} type="tv" />
          </div>
        )}
      </div>

      <CreateLobbyModal
        open={partyOpen}
        movie={{ ...show, id: show.id, title: show.name, release_date: show.first_air_date, media_type: 'tv' }}
        onClose={() => setPartyOpen(false)}
        onAuthRequired={onAuthOpen}
      />
    </div>
  )
}
