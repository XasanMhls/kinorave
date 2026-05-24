import { memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { IMG } from '../services/tmdb'
import { formatYear, formatRating, getRatingColor } from '../utils/format'

export const MovieCard = memo(function MovieCard({ movie, type = 'movie', index = 0 }) {
  const id    = movie.id
  const title = movie.title || movie.name || ''
  const date  = movie.release_date || movie.first_air_date || ''
  const rawPoster = movie.poster_path
  const poster = rawPoster?.startsWith('http') ? rawPoster : IMG(rawPoster, 'w342')
  const rating = movie.vote_average
  const href  = type === 'tv' ? `/tv/${id}` : `/movie/${id}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link to={href} className="block group">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-bg-elevated movie-card-hover">
          {poster ? (
            <img
              src={poster}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-card-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Rating badge */}
          {rating > 0 && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-xs font-bold"
              style={{ color: getRatingColor(rating) }}>
              {formatRating(rating)}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-full">
              <p className="text-white text-sm font-semibold line-clamp-2 drop-shadow">{title}</p>
              {date && <p className="text-text-secondary text-xs mt-0.5">{formatYear(date)}</p>}
            </div>
          </div>

          {/* Play icon on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-accent/90 backdrop-blur-sm flex items-center justify-center shadow-glow">
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Info below card */}
        <div className="mt-2.5 px-0.5">
          <p className="text-sm font-medium text-white line-clamp-1 group-hover:text-accent-light transition-colors">
            {title}
          </p>
          <p className="text-xs text-text-muted mt-0.5">{formatYear(date)}</p>
        </div>
      </Link>
    </motion.div>
  )
})

export function MovieCardSkeleton() {
  return (
    <div>
      <div className="aspect-[2/3] skeleton rounded-xl" />
      <div className="mt-2.5 space-y-1.5">
        <div className="h-3.5 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/3" />
      </div>
    </div>
  )
}
