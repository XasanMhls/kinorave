const BASE = (import.meta.env.VITE_API_URL || '') + '/api/poiskkino'

async function pk(path, params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) qs.set(k, String(v))
  })
  const q = qs.toString()
  const res = await fetch(`${BASE}${path}${q ? '?' + q : ''}`)
  if (!res.ok) throw new Error(`PoiskkKino ${res.status}`)
  return res.json()
}

export const getKPPopular  = (limit = 20, next)  => pk('/popular', { limit, next })
export const searchKP      = (query, limit = 20)  => pk('/search',  { query, limit })
export const getKPMovie    = (kpId)               => pk(`/movie/${kpId}`)
