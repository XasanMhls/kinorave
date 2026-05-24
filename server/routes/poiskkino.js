import { Router } from 'express'

const router = Router()
const BASE   = 'https://api.kinopoisk.dev'
const KEY    = () => process.env.POISKKINO_KEY

// Common fields we always request
const SELECT = [
  'id', 'externalId', 'name', 'enName', 'alternativeName',
  'poster', 'rating', 'year', 'genres', 'type', 'isSeries',
  'description', 'shortDescription', 'movieLength',
].join('&selectFields=')

async function pkFetch(path, params = {}) {
  const url = new URL(`${BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(val => url.searchParams.append(k, val))
    else if (v != null) url.searchParams.set(k, String(v))
  })

  const res = await fetch(url, {
    headers: { 'X-API-KEY': KEY() },
  })

  if (!res.ok) throw new Error(`PoiskkKino ${res.status}`)
  return res.json()
}

// Transform PoiskkKino movie → TMDB-compatible shape
function adapt(doc) {
  const tmdbId = doc.externalId?.tmdb
  return {
    id: tmdbId ?? doc.id,
    kp_id: doc.id,
    title: doc.name ?? doc.enName ?? doc.alternativeName ?? '',
    name: doc.name ?? doc.enName ?? '',
    // Full URL — MovieCard detects this and uses directly
    poster_path: doc.poster?.previewUrl ?? doc.poster?.url ?? null,
    backdrop_path: null,
    vote_average: doc.rating?.kp ?? 0,
    release_date: doc.year ? `${doc.year}-01-01` : '',
    first_air_date: doc.year ? `${doc.year}-01-01` : '',
    overview: doc.shortDescription ?? doc.description ?? '',
    genre_ids: [],
    genres: doc.genres ?? [],
    type: doc.isSeries ? 'tv' : 'movie',
    _source: 'kp',
  }
}

// GET /api/poiskkino/popular — топ по рейтингу КП
router.get('/popular', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 40)
    const data = await pkFetch('/v1.5/movie', {
      'selectFields': SELECT.split('&selectFields='),
      'notNullFields': ['poster.url', 'name', 'externalId.tmdb'],
      'rating.kp': '7-10',
      'type': 'movie',
      'year': '2000-2026',
      limit,
      ...(req.query.next ? { next: req.query.next } : {}),
    })

    res.json({
      results: (data.docs ?? []).map(adapt),
      hasNext: data.hasNext,
      next: data.next,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/poiskkino/search?query=... — поиск по названию
router.get('/search', async (req, res) => {
  const { query, limit = 20 } = req.query
  if (!query) return res.json({ results: [] })

  try {
    const data = await pkFetch('/v1.4/movie/search', {
      query,
      limit: Math.min(Number(limit), 40),
      page: req.query.page || 1,
    })

    res.json({
      results: (data.docs ?? []).map(adapt),
      total: data.total,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/poiskkino/movie/:kpId — фильм по КП-ID
router.get('/movie/:kpId', async (req, res) => {
  try {
    const data = await pkFetch(`/v1.4/movie/${req.params.kpId}`)
    res.json(adapt(data))
  } catch (err) {
    res.status(err.message.includes('404') ? 404 : 500).json({ error: err.message })
  }
})

export default router
