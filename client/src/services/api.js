const BASE = (import.meta.env.VITE_API_URL || '') + '/api'

// Token is stored here after login so it can be sent as Bearer
let _token = null
export function setApiToken(t) { _token = t }
export function getApiToken()  { return _token }

async function request(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers }
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const res = await fetch(BASE + path, {
    headers,
    credentials: 'include',
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const api = {
  get:    (path, opts)       => request(path, { method: 'GET', ...opts }),
  post:   (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  put:    (path, body, opts) => request(path, { method: 'PUT', body, ...opts }),
  delete: (path, opts)       => request(path, { method: 'DELETE', ...opts }),
}

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
}

// Lobby
export const lobbyApi = {
  create: (data) => api.post('/lobby', data),
  get:    (code) => api.get(`/lobby/${code}`),
  list:   ()     => api.get('/lobby'),
}
