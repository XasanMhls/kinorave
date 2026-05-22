export function formatRuntime(minutes) {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}ч ${m}м` : `${m}м`
}

export function formatDate(dateStr, locale = 'ru') {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function formatYear(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 4)
}

export function formatRating(value) {
  if (!value) return '—'
  return Number(value).toFixed(1)
}

export function formatVotes(n) {
  if (!n) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

export function secondsToTime(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${m}:${String(sec).padStart(2,'0')}`
}

export function getInitials(name = '') {
  return name.slice(0, 2).toUpperCase()
}

export function getRatingColor(rating) {
  if (rating >= 7.5) return '#22c55e'
  if (rating >= 6)   return '#eab308'
  return '#ef4444'
}
