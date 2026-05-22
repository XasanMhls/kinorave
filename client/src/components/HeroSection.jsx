import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BACKDROP, IMG } from '../services/tmdb'
import { formatRating, formatYear } from '../utils/format'

export function HeroSection({ movies = [], onWatchParty }) {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const featured = movies.slice(0, 5)
  const movie = featured[current]

  useEffect(() => {
    if (paused || featured.length < 2) return
    const timer = setInterval(() => setCurrent(c => (c + 1) % featured.length), 6000)
    return () => clearInterval(timer)
  }, [paused, featured.length])

  if (!movie) return null

  const backdrop = BACKDROP(movie.backdrop_path)
  const title    = movie.title || movie.name
  const year     = formatYear(movie.release_date || movie.first_air_date)
  const rating   = formatRating(movie.vote_average)
  const overview = movie.overview

  return (
    <div
      className="relative h-[85vh] min-h-[500px] max-h-[800px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background */}
      <AnimatePresence mode="sync">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {backdrop && (
            <img
              src={backdrop}
              alt={title}
              className="w-full h-full object-cover"
            />
          )}
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-base/95 via-bg-base/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-bg-base/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.15),transparent_60%)]" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-end pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                В тренде
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-text-secondary text-xs font-medium">
                {year}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-yellow-400">
                ★ {rating}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4 drop-shadow-2xl">
              {title}
            </h1>

            {/* Overview */}
            {overview && (
              <p className="text-text-secondary text-base leading-relaxed line-clamp-3 mb-7">
                {overview}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  const type = movie.media_type === 'tv' || !movie.title ? 'tv' : 'movie'
                  navigate(`/${type}/${movie.id}?play=1`)
                }}
                className="relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-base text-white overflow-hidden
                           bg-gradient-to-r from-violet-600 to-purple-500
                           shadow-[0_0_32px_rgba(124,58,237,0.5)] hover:shadow-[0_0_52px_rgba(124,58,237,0.75)]
                           transition-shadow duration-300"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                <svg className="w-5 h-5 relative" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="relative">Смотреть</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => onWatchParty?.(movie)}
                className="btn-secondary text-base px-6 py-3.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Watch Party
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide indicators */}
        {featured.length > 1 && (
          <div className="flex gap-2 mt-8">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === current ? 'bg-accent w-8' : 'bg-white/30 w-4 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
