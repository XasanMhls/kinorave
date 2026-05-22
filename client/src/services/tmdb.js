const BASE = 'https://api.themoviedb.org/3'
const KEY  = import.meta.env.VITE_TMDB_KEY

async function tmdb(endpoint, params = {}) {
  const url = new URL(`${BASE}${endpoint}`)
  url.searchParams.set('api_key', KEY)
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) url.searchParams.set(k, String(v))
  })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json()
}

export const IMG      = (path, size = 'w500') => path ? `https://image.tmdb.org/t/p/${size}${path}` : null
export const BACKDROP = (path)                 => IMG(path, 'original')

// ── Genre IDs ─────────────────────────────────────────────
export const GENRES = {
  action:    28,
  adventure: 12,
  animation: 16,
  comedy:    35,
  crime:     80,
  drama:     18,
  fantasy:   14,
  horror:    27,
  romance:   10749,
  scifi:     878,
  thriller:  53,
  family:    10751,
}

// ── Movies ────────────────────────────────────────────────
export const getTrending        = (lang='ru', page=1) => tmdb('/trending/movie/week',  { language: lang, page })
export const getPopularMovies   = (lang='ru', page=1) => tmdb('/movie/popular',        { language: lang, page })
export const getTopRated        = (lang='ru', page=1) => tmdb('/movie/top_rated',      { language: lang, page })
export const getNowPlaying      = (lang='ru', page=1) => tmdb('/movie/now_playing',    { language: lang, page })
export const getUpcoming        = (lang='ru', page=1) => tmdb('/movie/upcoming',       { language: lang, page })
export const getMovieDetails    = (id, lang='ru')     => tmdb(`/movie/${id}`,          { language: lang, append_to_response: 'credits,similar,videos' })
export const getMoviesByGenre   = (genreId, lang='ru', page=1) =>
  tmdb('/discover/movie', { language: lang, with_genres: genreId, sort_by: 'popularity.desc', page })

// Genre shortcuts
export const getActionMovies   = (lang='ru', page=1) => getMoviesByGenre(GENRES.action,    lang, page)
export const getComedyMovies   = (lang='ru', page=1) => getMoviesByGenre(GENRES.comedy,    lang, page)
export const getHorrorMovies   = (lang='ru', page=1) => getMoviesByGenre(GENRES.horror,    lang, page)
export const getDramaMovies    = (lang='ru', page=1) => getMoviesByGenre(GENRES.drama,     lang, page)
export const getScifiMovies    = (lang='ru', page=1) => getMoviesByGenre(GENRES.scifi,     lang, page)
export const getThrillerMovies = (lang='ru', page=1) => getMoviesByGenre(GENRES.thriller,  lang, page)
export const getRomanceMovies  = (lang='ru', page=1) => getMoviesByGenre(GENRES.romance,   lang, page)

// ── TV Series ─────────────────────────────────────────────
export const getTrendingTV      = (lang='ru', page=1) => tmdb('/trending/tv/week',   { language: lang, page })
export const getPopularSeries   = (lang='ru', page=1) => tmdb('/tv/popular',         { language: lang, page })
export const getTopRatedSeries  = (lang='ru', page=1) => tmdb('/tv/top_rated',       { language: lang, page })
export const getOnAirSeries     = (lang='ru', page=1) => tmdb('/tv/on_the_air',      { language: lang, page })
export const getAiringToday     = (lang='ru', page=1) => tmdb('/tv/airing_today',    { language: lang, page })
export const getSeriesDetails   = (id, lang='ru')     => tmdb(`/tv/${id}`,           { language: lang, append_to_response: 'credits,similar,videos' })
export const getSeasonDetails   = (tvId, s, lang='ru') => tmdb(`/tv/${tvId}/season/${s}`, { language: lang })
export const getSeriesByGenre   = (genreId, lang='ru', page=1) =>
  tmdb('/discover/tv', { language: lang, with_genres: genreId, sort_by: 'popularity.desc', page })

// ── Animation / Cartoons ──────────────────────────────────
export const getAnimatedMovies   = (lang='ru', page=1) =>
  tmdb('/discover/movie', { language: lang, with_genres: GENRES.animation, sort_by: 'popularity.desc', page })

export const getKidsMovies       = (lang='ru', page=1) =>
  tmdb('/discover/movie', { language: lang, with_genres: `${GENRES.animation},${GENRES.family}`, sort_by: 'popularity.desc', page })

export const getAnimatedSeries   = (lang='ru', page=1) =>
  tmdb('/discover/tv', { language: lang, with_genres: GENRES.animation, sort_by: 'popularity.desc', page })

export const getPopularCartoons  = (lang='ru', page=1) =>
  tmdb('/discover/tv', { language: lang, with_genres: `${GENRES.animation},${GENRES.family}`, sort_by: 'popularity.desc', page })

// ── Anime (Japanese animation) ────────────────────────────
export const getTrendingAnime   = (lang='ru', page=1) =>
  tmdb('/discover/tv', { language: lang, with_genres: GENRES.animation, with_origin_country: 'JP', sort_by: 'popularity.desc', page })

export const getTopAnime        = (lang='ru', page=1) =>
  tmdb('/discover/tv', { language: lang, with_genres: GENRES.animation, with_origin_country: 'JP', sort_by: 'vote_average.desc', 'vote_count.gte': 200, page })

export const getNewAnime        = (lang='ru', page=1) =>
  tmdb('/discover/tv', { language: lang, with_genres: GENRES.animation, with_origin_country: 'JP', sort_by: 'first_air_date.desc', page })

export const getAnimeMovies     = (lang='ru', page=1) =>
  tmdb('/discover/movie', { language: lang, with_genres: GENRES.animation, with_origin_country: 'JP', sort_by: 'popularity.desc', page })

// ── Search ────────────────────────────────────────────────
export const searchMulti  = (query, lang='ru', page=1) => tmdb('/search/multi',  { language: lang, query, page })
export const searchMovies = (query, lang='ru', page=1) => tmdb('/search/movie',  { language: lang, query, page })
export const searchTV     = (query, lang='ru', page=1) => tmdb('/search/tv',     { language: lang, query, page })

// ── Genres ────────────────────────────────────────────────
export const getMovieGenres = (lang='ru') => tmdb('/genre/movie/list', { language: lang })
export const getTvGenres    = (lang='ru') => tmdb('/genre/tv/list',    { language: lang })
