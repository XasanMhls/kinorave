const BASE = 'https://api.themoviedb.org/3'
const KEY  = import.meta.env.VITE_TMDB_KEY

// 16 languages → ~95% trailer coverage (vs ~30% with just 'ru')
const TRAILER_LANGS = 'ru,en,de,fr,es,it,pt,ja,ko,zh,hi,tr,pl,nl,sv,uk,null'

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
  action:      28,
  adventure:   12,
  animation:   16,
  comedy:      35,
  crime:       80,
  drama:       18,
  fantasy:     14,
  horror:      27,
  romance:     10749,
  scifi:       878,
  thriller:    53,
  family:      10751,
  documentary: 99,
  history:     36,
  music:       10402,
  mystery:     9648,
  war:         10752,
  western:     37,
}

export const GENRE_META = {
  28:    { emoji: '🎬', label: 'Боевик' },
  35:    { emoji: '😂', label: 'Комедия' },
  27:    { emoji: '👻', label: 'Ужасы' },
  878:   { emoji: '🚀', label: 'Фантастика' },
  10749: { emoji: '💘', label: 'Мелодрама' },
  18:    { emoji: '🎭', label: 'Драма' },
  53:    { emoji: '🔍', label: 'Триллер' },
  14:    { emoji: '🧙', label: 'Фэнтези' },
  16:    { emoji: '🎪', label: 'Мультфильм' },
  10402: { emoji: '🎵', label: 'Музыкальный' },
  99:    { emoji: '🌍', label: 'Документальный' },
  10751: { emoji: '👨‍👩‍👧', label: 'Семейный' },
  80:    { emoji: '🕵️', label: 'Криминал' },
  36:    { emoji: '⚔️', label: 'Исторический' },
  12:    { emoji: '🌊', label: 'Приключения' },
  37:    { emoji: '🤠', label: 'Вестерн' },
  10752: { emoji: '🪖', label: 'Военный' },
  9648:  { emoji: '🧩', label: 'Мистика' },
  28162: { emoji: '🥋', label: 'Аниме' },
  10770: { emoji: '📺', label: 'ТВ-фильм' },
}

// ── Movies ────────────────────────────────────────────────
export const getTrending        = (lang='ru', page=1) => tmdb('/trending/movie/week',  { language: lang, page })
export const getPopularMovies   = (lang='ru', page=1) => tmdb('/movie/popular',        { language: lang, page })
export const getTopRated        = (lang='ru', page=1) => tmdb('/movie/top_rated',      { language: lang, page })
export const getNowPlaying      = (lang='ru', page=1) => tmdb('/movie/now_playing',    { language: lang, page })
export const getUpcoming        = (lang='ru', page=1) => tmdb('/movie/upcoming',       { language: lang, page })
export const getMovieDetails    = (id, lang='ru')     => tmdb(`/movie/${id}`,          { language: lang, append_to_response: 'credits,similar,videos,watch/providers', include_video_language: TRAILER_LANGS })
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
export const getSeriesDetails   = (id, lang='ru')     => tmdb(`/tv/${id}`,           { language: lang, append_to_response: 'credits,similar,videos,watch/providers,external_ids', include_video_language: TRAILER_LANGS })
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

// ── Lightweight video fetch (no credits/similar overhead) ──
export const getMovieVideos = (id, lang='ru') => tmdb(`/movie/${id}/videos`, { language: lang, include_video_language: TRAILER_LANGS })
export const getTvVideos    = (id, lang='ru') => tmdb(`/tv/${id}/videos`,    { language: lang, include_video_language: TRAILER_LANGS })

// ── Trailer helper ────────────────────────────────────────
// Picks the best YouTube trailer from TMDB videos array
export function findTrailer(videos) {
  if (!videos?.results?.length) return null
  const yt = videos.results.filter(v => v.site === 'YouTube')
  return (
    yt.find(v => v.type === 'Trailer' && v.iso_639_1 === 'ru') ||
    yt.find(v => v.type === 'Trailer' && v.iso_639_1 === 'en') ||
    yt.find(v => v.type === 'Trailer') ||
    yt.find(v => v.type === 'Teaser') ||
    yt[0] || null
  )
}
