import { useState, useRef, useEffect, useCallback } from 'react'
import Hls from 'hls.js'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || ''

// ─── Embed providers ─────────────────────────────────────────────────────────
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

// ─── Format seconds to HH:MM:SS ──────────────────────────────────────────────
function fmtTime(sec) {
  if (!sec || sec < 0) sec = 0
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}

// ─── HLS native player ───────────────────────────────────────────────────────
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

// ─── Hover Sync Overlay (lobby mode) ─────────────────────────────────────────
function SyncOverlay({ syncState, isHost, onSyncAction }) {
  const [currentTime, setCurrentTime] = useState(0)
  const [visible, setVisible] = useState(false)
  const hideTimer = useRef(null)

  const playing = syncState?.isPlaying
  const paused = !playing

  // Live time counter
  useEffect(() => {
    if (!syncState) return
    const update = () => {
      if (syncState.isPlaying && syncState.playedAt) {
        const elapsed = (Date.now() - syncState.playedAt) / 1000
        setCurrentTime((syncState.position || 0) + elapsed)
      } else {
        setCurrentTime(syncState.position || 0)
      }
    }
    update()
    const id = setInterval(update, 500)
    return () => clearInterval(id)
  }, [syncState?.isPlaying, syncState?.playedAt, syncState?.position])

  // Always visible when paused
  useEffect(() => {
    if (paused) { setVisible(true); clearTimeout(hideTimer.current) }
  }, [paused])

  const showControls = useCallback(() => {
    setVisible(true)
    clearTimeout(hideTimer.current)
    if (playing) {
      hideTimer.current = setTimeout(() => setVisible(false), 3000)
    }
  }, [playing])

  const handlePlayPause = useCallback(() => {
    if (!isHost || !onSyncAction) return
    if (playing) {
      onSyncAction('pause', {})
    } else {
      onSyncAction('play', { position: currentTime })
    }
  }, [isHost, onSyncAction, playing, currentTime])

  const handleSeek = useCallback((delta) => {
    if (!isHost || !onSyncAction) return
    onSyncAction('seek', { position: Math.max(0, currentTime + delta) })
    showControls()
  }, [isHost, onSyncAction, currentTime, showControls])

  const btnCls = isHost
    ? "hover:bg-white/15 text-white/80 hover:text-white cursor-pointer active:scale-95"
    : "text-white/30 cursor-default"

  return (
    <div
      className="absolute inset-0 z-20"
      onMouseMove={showControls}
      onMouseEnter={showControls}
      onMouseLeave={() => playing && setVisible(false)}
      onClick={(e) => {
        // Only toggle on click on the backdrop area, not on buttons
        if (e.target === e.currentTarget) handlePlayPause()
      }}
    >
      <AnimatePresence>
        {(visible || paused) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col"
            style={{ background: paused
              ? 'rgba(0,0,0,0.82)'
              : 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.6) 100%)'
            }}
          >
            {/* Spacer — click anywhere to toggle */}
            <div className="flex-1" />

            {/* Pause label in center */}
            {paused && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-white/50 text-xs sm:text-sm">
                  {isHost ? 'Нажмите для продолжения' : 'Хост поставил на паузу'}
                </p>
              </div>
            )}

            {/* Bottom controls bar */}
            <div
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Play / Pause button */}
              <button
                onClick={handlePlayPause}
                className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-md transition-all ${btnCls}`}
                title={playing ? 'Пауза' : 'Играть'}
              >
                {playing ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>

              <div className="w-px h-4 bg-white/10 mx-0.5" />

              {/* Seek buttons */}
              <button onClick={() => handleSeek(-60)} className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[10px] sm:text-xs font-bold transition-all ${btnCls}`} title="-1 мин">
                -1м
              </button>
              <button onClick={() => handleSeek(-15)} className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[10px] sm:text-xs font-bold transition-all ${btnCls}`} title="-15с">
                -15
              </button>
              <button onClick={() => handleSeek(15)} className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[10px] sm:text-xs font-bold transition-all ${btnCls}`} title="+15с">
                +15
              </button>
              <button onClick={() => handleSeek(60)} className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[10px] sm:text-xs font-bold transition-all ${btnCls}`} title="+1 мин">
                +1м
              </button>
              <button onClick={() => handleSeek(300)} className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[10px] sm:text-xs font-bold transition-all ${btnCls}`} title="+5 мин">
                +5м
              </button>

              <div className="flex-1" />

              {/* Status + time */}
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${playing ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              <span className="text-white/80 text-xs sm:text-sm font-mono tabular-nums ml-1.5">{fmtTime(currentTime)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

  const notify = useCallback((text, duration = 4000) => {
    setNotification(text)
    clearTimeout(notifTimer.current)
    notifTimer.current = setTimeout(() => setNotification(null), duration)
  }, [])

  // ── Try to get direct stream ───────────────────────────────────────────────
  useEffect(() => {
    if (inLobby) return
    setHdAvailable(false)
    setHlsSources([])
    setMode('iframe')

    const params = new URLSearchParams({ tmdbId: movieId, type: movieType })
    if (movieType === 'tv') { params.set('season', String(activeSeason)); params.set('episode', String(activeEpisode)) }

    const controller = new AbortController()
    const abort = setTimeout(() => controller.abort(), 40000)

    async function findStream() {
      try {
        const r = await fetch(`${API_URL}/api/stream?${params}`, { signal: AbortSignal.timeout(12000) })
        if (r.ok) {
          const data = await r.json()
          const sources = (data.sources || []).filter(s => s.url)
          if (sources.length) return sources
        }
      } catch {}

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

  // ── reset on change ────────────────────────────────────────────────────────
  useEffect(() => {
    setIframeKey(k => k + 1)
    setMode('iframe')
    setHdAvailable(false)
    setShowLinks(false)
  }, [movieId, movieType, activeSeason, activeEpisode])

  // ── lobby sync notifications ───────────────────────────────────────────────
  useEffect(() => {
    if (!inLobby || !syncState) return
    const prev = prevSync.current
    if (!prev) { prevSync.current = { ...syncState }; return }

    if (prev.source !== syncState.source)
      notify(`Источник: ${EMBEDS.find(e => e.key === syncState.source)?.label ?? syncState.source}`)
    else if (Math.abs((prev.position || 0) - (syncState.position || 0)) > 5)
      notify(`Перемотка на ${fmtTime(syncState.position)} — перемотайте вручную`, 6000)

    prevSync.current = { ...syncState }
  }, [syncState, inLobby, notify])

  const switchEmbed = useCallback((idx) => {
    setShowMenu(false)
    setMode('iframe')
    if (inLobby && isHost && onSyncAction)
      onSyncAction('source', { source: EMBEDS[idx].key, season: activeSeason, episode: activeEpisode })
    else setEmbedIdx(idx)
  }, [inLobby, isHost, onSyncAction, activeSeason, activeEpisode])

  const goNext = useCallback(() => switchEmbed((activeEmbedIdx + 1) % EMBEDS.length), [activeEmbedIdx, switchEmbed])

  return (
    <div className="w-full">
      {/* ── Video frame ── */}
      <div
        className="relative w-full bg-black overflow-hidden rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)]"
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

        {/* Hover sync overlay — lobby mode only */}
        {inLobby && (
          <SyncOverlay
            syncState={syncState}
            isHost={isHost}
            onSyncAction={onSyncAction}
          />
        )}

        {/* Lobby badge */}
        {inLobby && (
          <div className="absolute top-2 left-2 z-30 pointer-events-none">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-md border ${
              isHost ? 'bg-violet-600/80 border-violet-500/50 text-white' : 'bg-black/60 border-white/10 text-white/50'
            }`}>
              <span className={`w-1 h-1 rounded-full ${isHost ? 'bg-white animate-pulse' : 'bg-white/40'}`} />
              {isHost ? 'Хост' : 'Гость'}
            </div>
          </div>
        )}

        {/* Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-2 left-1/2 -translate-x-1/2 z-40 pointer-events-none px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium whitespace-nowrap"
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* HD + source picker */}
        <div className="absolute top-2 right-2 z-30 flex flex-col items-end gap-1">
          {mode === 'iframe' && hdAvailable && (
            <button onClick={() => setMode('hls')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-600/80 backdrop-blur-md border border-violet-400/30 text-[10px] font-bold text-white hover:bg-violet-600 transition-colors">
              <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />HD
            </button>
          )}

          {mode === 'hls' && (
            <button onClick={() => setMode('iframe')}
              className="px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-white/60 hover:text-white transition-colors">
              Зеркала
            </button>
          )}

          {mode === 'iframe' && (
            <>
              <div className="relative">
                <button onClick={() => canControl && setShowMenu(v => !v)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md border text-[10px] font-semibold transition-colors ${
                    canControl ? 'bg-black/70 border-white/10 text-white hover:bg-black/90' : 'bg-black/40 border-white/5 text-white/30 cursor-default'
                  }`}>
                  <svg className="w-2.5 h-2.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M3 8a1 1 0 011-1h9a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
                  </svg>
                  {activeEmbed.label}
                  {canControl && <svg className={`w-2.5 h-2.5 opacity-60 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
                </button>

                <AnimatePresence>
                  {showMenu && canControl && (
                    <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.95 }} transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-1 w-36 bg-[#12121a]/96 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden shadow-2xl">
                      {EMBEDS.map((e, i) => (
                        <button key={e.key} onClick={() => switchEmbed(i)}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 text-xs transition-colors ${i === activeEmbedIdx ? 'text-white bg-violet-600/30 font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                          <div className={`w-1 h-1 rounded-full flex-shrink-0 ${i === activeEmbedIdx ? 'bg-violet-400' : 'bg-white/20'}`} />
                          {e.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {canControl && (
                <button onClick={goNext}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-white/60 hover:text-white transition-colors">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      {!inLobby && (
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
      )}
    </div>
  )
}
