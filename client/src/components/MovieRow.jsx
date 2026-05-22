import { useRef } from 'react'
import { motion } from 'framer-motion'
import { MovieCard, MovieCardSkeleton } from './MovieCard'

export function MovieRow({ title, movies = [], type = 'movie', loading = false }) {
  const rowRef = useRef(null)

  const scroll = (dir) => {
    rowRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' })
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="flex gap-1">
          <button
            onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-lg bg-bg-elevated border border-border text-text-secondary hover:text-white hover:bg-bg-overlay transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-8 h-8 rounded-lg bg-bg-elevated border border-border text-text-secondary hover:text-white hover:bg-bg-overlay transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Row */}
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-36 sm:w-44">
                <MovieCardSkeleton />
              </div>
            ))
          : movies.map((movie, i) => (
              <div key={movie.id} className="flex-shrink-0 w-36 sm:w-44">
                <MovieCard movie={movie} type={type} index={i} />
              </div>
            ))
        }
      </div>
    </section>
  )
}
