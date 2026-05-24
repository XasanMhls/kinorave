import { useState, useRef, useEffect, useCallback } from 'react'
import Hls from 'hls.js'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || ''

// ─── Embed providers (live-tested 200 OK with real player content) ────────────
const EMBEDS = [
  {
    key: 'vidsrc_me',
    label: 'VidSrc',
    movie: (id)       => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    tv:    (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    key: 'vidsrc_pm',
    label: 'VidSrc 2',
    movie: (id)       => `https://vidsrc.pm/embed/movie/${id}`,
    tv:    (id, s, e) => `https://vidsrc.pm/embed/tv/${id}/${s}/${e}`,
  },
  {
    key: 'vidsrc_co',
    label: 'VidSrc 3',
    movie: (id)       => `https://player.vidsrc.co/embed/movie/${id}`,
    tv:    (id, s, e) => `https://player.vidsrc.co/embed/tv/${id}/${s}/${e}`,
  },
  {
    key: 'multiembed',
    label: 'MultiEmbed',
    movie: (id)       => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv:    (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    key: 'nontongo',
    label: 'NonTongo',
    movie: (id)       => `https://nontongo.win/embed/movie/${id}`,
    tv:    (id, s, e) => `https://nontongo.win/embed/tv/${id}/${s}/${e}`,
  },
  {
    key: '2embed_cc',
    label: '2Embed',
    movie: (id)       => `https://www.2embed.cc/embed/${id}`,
    tv:    (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
]

// ─── HLS native player ────────────────────────────────────────────────────────
function HlsPlayer({ sources, onFallback }) {
  const videoRef = useRef(null)
  const hlsRef   = useRef(null)

  useEffect(() => {
    if (!videoRef.current || !sources.length) { onFallback(); return }
    const best = sources[0]

    if (best.isHLS && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, startLevel: -1 })
      hlsRef.current = hls
      hls.loadSource(best.url)
      hls.attachMedia(videoRef.current)
      hls.on(Hls.Events.MANIFEST_PARSED, () => videoRef.current?.play().catch(() => {}))
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) onFallback() })
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = best.url
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.src = best.url
      videoRef.current.play().catch(() => {})
    }

    return () => { hlsRef.current?.destroy(); hlsRef.current = null }
  }, [sources])

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      className="absolute inset-0 w-full h-full"
      style={{ background: '#000' }}
    />
  )
}

// ─── Main VideoPlayer ─────────────────────────────────────────────────────────
export function VideoPlayer({
  movieId,
  movieType    = 'movie',
  season       = 1,
  episode      = 1,
  syncState    = null,
  isHost       = false,
  onSyncAction = null,
}) {
  const inLobby = !!syncState

  const [mode,         setMode]         = useState('iframe')
  const [hlsSources,   setHlsSources]   = useState([])
  const [hdAvailable,  setHdAvailable]  = useState(false)
  const [embedIdx,     setEmbedIdx]     = useState(0)
  const [iframeKey,    setIframeKey]    = useState(0)
  const [showMenu,     setShowMenu]     = useState(false)
  const [showLinks,    setShowLinks]    = useState(false)
  const [notification, setNotification] = useState(null)

  const notifTimer = useRef(null)
  const prevSync   = useRef(null)

  const activeSeason   = inLobby ? (syncState?.season  ?? season)  : season
  const activeEpisode  = inLobby ? (syncState?.episode ?? episode) : episode
  const activeEmbedIdx = inLobby
    ? Math.max(0, EMBEDS.findIndex(e => e.key === syncState?.source))
    : embedIdx
  const canControl  = !inLobby || isHost
  const activeEmbed = EMBEDS[activeEmbedIdx]

  const embedUrl = movieType === 'tv'
    ? activeEmbed.tv(movieId, activeSeason, activeEpisode)
    : activeEmbed.movie(movieId)

  const notify = useCallback((text) => {
    setNotification(text)
    clearTimeout(notifTimer.current)
    notifTimer.current = setTimeout(() => setNotification(null), 3500)
  }, [])

  // ── Try to get direct stream: consumet first, Puppeteer as fallback ─────
  useEffect(() => {
    if (inLobby) return
    setHdAvailable(false)
    setHlsSources([])
    setMode('iframe') // show iframe immediately

    const params = new URLSearchParams({ tmdbId: movieId, type: movieType })
    if (movieType === 'tv') { params.set('season', String(activeSeason)); params.set('episode', String(activeEpisode)) }

    const controller = new AbortController()
    const abort = setTimeout(() => controller.abort(), 40000)

    async function findStream() {
      // 1) Try consumet/FlixHQ — fast (~5-8s), no browser needed
      try {
        const r = await fetch(`${API_URL}/api/stream?${params}`, {
          signal: AbortSignal.timeout(12000),
        })
        if (r.ok) {
          const data = await r.json()
          const sources = (data.sources || []).filter(s => s.url)
          if (sources.length) return sources
        }
      } catch {}

      // 2) Fallback: Puppeteer scraper (~20-25s per provider)
      if (controller.signal.aborted) return []
      try {
        const r = await fetch(`${API_URL}/api/scrape?${params}`, { signal: controller.signal })
        if (r.ok) {
          const data = await r.json()
          return (data.sources || []).filter(s => s.url)
        }
      } catch {}

      return []
    }

    findStream().then(sources => {
      clearTimeout(abort)
      if (sources.length) {
        setHlsSources(sources)
        setHdAvailable(true)
        setMode('hls')
        notify('Прямой поток найден — играю в HD')
      }
    })

    return () => { clearTimeout(abort); controller.abort() }
  }, [movieId, movieType, activeSeason, activeEpisode, inLobby])

  // ── reset on change ──────────────────────────────────────────────────────
  useEffect(() => {
    setIframeKey(k => k + 1)
    setMode('iframe')
    setHdAvailable(false)
    setShowLinks(false)
  }, [movieId, movieType, activeSeason, activeEpisode])

  // ── lobby sync ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!inLobby || !syncState) return
    const prev = prevSync.current
    if (!prev) { prevSync.current = syncState; return }
    if (prev.source !== syncState.source)
      notify(`Источник: ${EMBEDS.find(e => e.key === syncState.source)?.label ?? syncState.source}`)
    prevSync.current = syncState
  }, [syncState, inLobby, notify])

  const switchEmbed = useCallback((idx) => {
    setShowMenu(false)
    setMode('iframe')
    if (inLobby && isHost && onSyncAction)
      onSyncAction('source', { source: EMBEDS[idx].key, season: activeSeason, episode: activeEpisode })
    else setEmbedIdx(idx)
  }, [inLobby, isHost, onSyncAction, activeSeason, activeEpisode])

  const goNext = useCallback(() => switchEmbed((activeEmbedIdx + 1) % EMBEDS.length), [activeEmbedIdx, switchEmbed])

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* ── Video frame ── */}
      <div
        className="relative w-full bg-black rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]"
        style={{ aspectRatio: '16/9' }}
      >
        {mode === 'hls' && (
          <HlsPlayer sources={hlsSources} onFallback={() => { setMode('iframe') }} />
        )}

        {mode === 'iframe' && (
          <iframe
            key={`${activeEmbed.key}-${movieId}-${activeSeason}-${activeEpisode}-${iframeKey}`}
            src={embedUrl}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; web-share"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full border-0"
            title="Video Player"
          />
        )}

        {/* Lobby badge */}
        {inLobby && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md border ${
              isHost ? 'bg-violet-600/80 border-violet-500/50 text-white' : 'bg-black/60 border-white/10 text-white/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isHost ? 'bg-white animate-pulse' : 'bg-white/40'}`} />
              {isHost ? 'Вы — хост' : 'Хост управляет'}
            </div>
          </div>
        )}

        {/* Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs font-medium whitespace-nowrap"
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* HD + source picker */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
          {mode === 'iframe' && hdAvailable && (
            <button onClick={() => setMode('hls')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/80 backdrop-blur-md border border-violet-400/30 text-xs font-bold text-white hover:bg-violet-600 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />HD
            </button>
          )}

          {mode === 'hls' && (
            <button onClick={() => setMode('iframe')}
              className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs text-white/60 hover:text-white transition-colors">
              Зеркала
            </button>
          )}

          {mode === 'iframe' && (
            <>
              <div className="relative">
                <button onClick={() => canControl && setShowMenu(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-semibold transition-colors ${
                    canControl ? 'bg-black/70 border-white/10 text-white hover:bg-black/90' : 'bg-black/40 border-white/5 text-white/30 cursor-default'
                  }`}>
                  <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M3 8a1 1 0 011-1h9a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
                  </svg>
                  {activeEmbed.label}
                  {canControl && <svg className={`w-3 h-3 opacity-60 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
                </button>

                <AnimatePresence>
                  {showMenu && canControl && (
                    <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.95 }} transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-44 bg-[#12121a]/96 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                      {EMBEDS.map((e, i) => (
                        <button key={e.key} onClick={() => switchEmbed(i)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${i === activeEmbedIdx ? 'text-white bg-violet-600/30 font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === activeEmbedIdx ? 'bg-violet-400' : 'bg-white/20'}`} />
                          {e.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {canControl && (
                <button onClick={goNext}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs text-white/60 hover:text-white transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Другой
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Fallback: open in new tab ── */}
      <div className="mt-3">
        <button
          onClick={() => setShowLinks(v => !v)}
          className="flex items-center gap-2 text-sm text-white/35 hover:text-white/60 transition-colors"
        >
          <svg className={`w-4 h-4 transition-transform ${showLinks ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Плеер не работает? Открыть напрямую
        </button>

        <AnimatePresence>
          {showLinks && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EMBEDS.map((e) => {
                  const url = movieType === 'tv'
                    ? e.tv(movieId, activeSeason, activeEpisode)
                    : e.movie(movieId)
                  return (
                    <a
                      key={e.key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-bg-elevated border border-border hover:border-violet-500/40 hover:bg-violet-500/5 transition-all group"
                    >
                      <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{e.label}</span>
                      <svg className="w-3.5 h-3.5 text-white/25 group-hover:text-violet-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )
                })}
              </div>
              <p className="text-xs text-white/20 mt-2 ml-1">Открываются на сайте провайдера в новой вкладке</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
