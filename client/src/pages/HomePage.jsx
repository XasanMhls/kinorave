import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HeroSection } from '../components/HeroSection'
import { MovieRow } from '../components/MovieRow'
import { CreateLobbyModal } from '../components/CreateLobbyModal'
import {
  getTrending, getPopularMovies, getTopRated, getNowPlaying,
  getTrendingTV, getPopularSeries, getTopRatedSeries,
  getAnimatedMovies, getAnimatedSeries, getTrendingAnime,
  getActionMovies, getHorrorMovies, getScifiMovies,
  GENRE_META,
} from '../services/tmdb'
import { getKPPopular } from '../services/poiskkino'

const CATEGORY_IDS = [28, 35, 27, 878, 10749, 18, 53, 14, 16, 10402, 99, 10751, 80, 36, 12, 37, 10752, 9648, 10770]

export function HomePage({ onAuthOpen }) {
  const [data, setData]         = useState({})
  const [loading, setLoading]   = useState(true)
  const [partyMovie, setPartyMovie] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      getTrending(),
      getPopularMovies(),
      getTopRated(),
      getNowPlaying(),
      getTrendingTV(),
      getPopularSeries(),
      getTopRatedSeries(),
      getAnimatedMovies(),
      getAnimatedSeries(),
      getTrendingAnime(),
      getActionMovies(),
      getHorrorMovies(),
      getScifiMovies(),
      getKPPopular(20),
    ]).then(results => {
      const r = v => v.status === 'fulfilled' ? v.value.results || [] : []
      setData({
        trending:     r(results[0]),
        popular:      r(results[1]),
        topRated:     r(results[2]),
        nowPlaying:   r(results[3]),
        trendingTV:   r(results[4]),
        popularSeries:r(results[5]),
        topSeries:    r(results[6]),
        animMovies:   r(results[7]),
        animSeries:   r(results[8]),
        anime:        r(results[9]),
        action:       r(results[10]),
        horror:       r(results[11]),
        scifi:        r(results[12]),
        kpPopular:    r(results[13]),
      })
    }).finally(() => setLoading(false))
  }, [])

  const hero = [...(data.trending || []), ...(data.trendingTV || [])].slice(0, 6)

  return (
    <div className="min-h-screen">
      <HeroSection movies={hero} onWatchParty={m => setPartyMovie(m)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-14">
        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white tracking-tight">Категории</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_IDS.map(id => {
              const meta = GENRE_META[id]
              if (!meta) return null
              return (
                <Link
                  key={id}
                  to={`/genre/${id}`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium
                             border border-white/8 text-white/60
                             hover:border-violet-500/60 hover:text-violet-300 hover:bg-violet-500/10
                             transition-all duration-150"
                >
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Кинопоиск */}
        {(data.kpPopular?.length > 0 || loading) && (
          <>
            <SectionHeader title="Кинопоиск" emoji="🇷🇺" />
            <MovieRow title="Популярное на Кинопоиске" movies={data.kpPopular} loading={loading} type="movie" />
          </>
        )}

        {/* Movies */}
        <SectionHeader title="Фильмы" emoji="🎬" />
        <MovieRow title="В тренде сейчас"     movies={data.trending}   loading={loading} type="movie" />
        <MovieRow title="Популярные фильмы"   movies={data.popular}    loading={loading} type="movie" />
        <MovieRow title="Новинки в кино"      movies={data.nowPlaying} loading={loading} type="movie" />
        <MovieRow title="Лучшие фильмы"       movies={data.topRated}   loading={loading} type="movie" />
        <MovieRow title="Боевики"             movies={data.action}     loading={loading} type="movie" />
        <MovieRow title="Ужасы"               movies={data.horror}     loading={loading} type="movie" />
        <MovieRow title="Фантастика"          movies={data.scifi}      loading={loading} type="movie" />

        {/* Series */}
        <SectionHeader title="Сериалы" emoji="📺" />
        <MovieRow title="Тренды среди сериалов" movies={data.trendingTV}    loading={loading} type="tv" />
        <MovieRow title="Популярные сериалы"    movies={data.popularSeries} loading={loading} type="tv" />
        <MovieRow title="Лучшие сериалы"        movies={data.topSeries}     loading={loading} type="tv" />

        {/* Animation */}
        <SectionHeader title="Мультфильмы и Анимация" emoji="✨" />
        <MovieRow title="Анимационные фильмы"  movies={data.animMovies}  loading={loading} type="movie" />
        <MovieRow title="Мультсериалы"         movies={data.animSeries}  loading={loading} type="tv" />

        {/* Anime */}
        <SectionHeader title="Аниме" emoji="⚡" />
        <MovieRow title="Популярные аниме"     movies={data.anime} loading={loading} type="tv" />
      </main>

      <CreateLobbyModal
        open={!!partyMovie}
        movie={partyMovie}
        onClose={() => setPartyMovie(null)}
        onAuthRequired={onAuthOpen}
      />
    </div>
  )
}

function SectionHeader({ title, emoji }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-2xl">{emoji}</span>
      <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-violet-600/30 to-transparent ml-3" />
    </div>
  )
}
