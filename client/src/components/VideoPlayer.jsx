import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Hls from 'hls.js'

// ─── Embed providers — tested & reachable from UZ network ────────────────
const EMBEDS = [
  // ── WORKING (HTTP 200 from Uzbekistan) ──
  {
    key: 'vidsrc_dev',
    label: 'VidSrc',
    movie: (id)       => `https://vidsrc.dev/embed/movie/${id}`,
    tv:    (id, s, e) => `https://vidsrc.dev/embed/tv/${id}/${s}/${e}`,
  },
  {
    key: 'vidsrc_to',
    label: 'VidSrc 2',
    movie: (id)       => `https://vidsrc.to/embed/movie/${id}`,
    tv:    (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    key: 'nontongo',
    label: 'NonTongo',
    movie: (id)       => `https://nontongo.win/embed/movie/${id}`,
    tv:    (id, s, e) => `https://nontongo.win/embed/tv/${id}/${s}/${e}`,
  },
  // ── FALLBACKS (may be blocked in some regions) ──
  {
    key: 'embedsu',
    label: 'EmbedSu',
    movie: (id)       => `https://embed.su/embed/movie/${id}`,
    tv:    (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    key: 'autoembed',
    label: 'AutoEmbed',
    movie: (id)       => `https://autoembed.cc/embed/movie/${id}`,
    tv:    (id, s, e) => `https://autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
  {
    key: 'multiembed',
    label: 'MultiEmbed',
    movie: (id)       => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv:    (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    key: 'vidlink',
    label: 'VidLink',
    movie: (id)       => `https://vidlink.pro/movie/${id}`,
    tv:    (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    key: 'smashystream',
    label: 'Smashy',
    movie: (id)       => `https://player.smashy.stream/movie/${id}`,
    tv:    (id, s, e) => `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`,
  },
]

function embedKey(key) {
  return EMBEDS.findIndex(e => e.key === key)
}

const STUCK_MS    = 3500
const AUTO_ADV_MS = 5500

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

  // ── direct-stream state ──
  const videoRef   = useRef(null)
  const hlsRef     = useRef(null)
  const [streamSources, setStreamSources] = useState([]) // []=use embeds, [...]= has direct streams
  const [streamIdx,     setStreamIdx]     = useState(0)
  const [streamError,   setStreamError]   = useState(false)

  // ── embed fallback state ──
  const [embedIdx,   setEmbedIdx]   = useState(0)
  const [embedKey2,  setEmbedKey2]  = useState(0)
  const [loadState,  setLoadState]  = useState('loading')
  const [showMenu,   setShowMenu]   = useState(false)
  const [notification, setNotification] = useState(null)
  const [autoAdvCountdown, setAutoAdvCountdown] = useState(null)

  const stuckTimer   = useRef(null)
  const autoAdvTimer = useRef(null)
  const countdownInt = useRef(null)
  const notifTimer   = useRef(null)
  const prevSync     = useRef(null)

  const activeSeason  = inLobby ? (syncState?.season  ?? season)  : season
  const activeEpisode = inLobby ? (syncState?.episode ?? episode) : episode
  const activeEmbedIdx = inLobby ? Math.max(0, embedKey(syncState?.source)) : embedIdx

  const canControl = !inLobby || isHost

  // ── derived (must be before useEffects that reference it) ──
  const usingDirect   = streamSources.length > 0 && !streamError
  const loadingDirect = false // embeds start immediately; direct stream upgrades silently

  // ── fetch direct streams from backend (non-blocking — embeds start immediately) ──
  useEffect(() => {
    setStreamIdx(0)
    setStreamError(false)

    const params = new URLSearchParams({
      tmdbId: String(movieId),
      type: movieType,
      ...(movieType === 'tv' ? { season: String(activeSeason), episode: String(activeEpisode) } : {}),
    })

    const controller = new AbortController()

    fetch(`/api/stream?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.sources?.length) {
          setStreamSources(data.sources)
        }
        // If empty, keep [] — embeds continue
      })
      .catch(() => {}) // embeds already running, ignore

    return () => controller.abort()
  }, [movieId, movieType, activeSeason, activeEpisode])

  // ── attach HLS.js when we have a direct HLS stream ─────────────────────────
  useEffect(() => {
    if (!streamSources?.length || streamError) return
    const src = streamSources[streamIdx]
    if (!src) return

    const video = videoRef.current
    if (!video) return

    if (src.isHLS) {
      if (Hls.isSupported()) {
        if (hlsRef.current) { hlsRef.current.destroy() }
        const hls = new Hls({ enableWorker: true })
        hlsRef.current = hls
        hls.loadSource(src.url)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            hls.destroy()
            hlsRef.current = null
            // Try next stream quality / fall back to embeds
            if (streamIdx + 1 < streamSources.length) {
              setStreamIdx(i => i + 1)
            } else {
              setStreamError(true)
            }
          }
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = src.url
      } else {
        setStreamError(true)
      }
    } else {
      // Plain MP4
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
      video.src = src.url
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    }
  }, [streamSources, streamIdx, streamError])

  // ── embed timer helpers ────────────────────────────────────────────────────
  const clearTimers = useCallback(() => {
    clearTimeout(stuckTimer.current)
    clearTimeout(autoAdvTimer.current)
    clearInterval(countdownInt.current)
    setAutoAdvCountdown(null)
  }, [])

  const notify = useCallback((text) => {
    setNotification(text)
    clearTimeout(notifTimer.current)
    notifTimer.current = setTimeout(() => setNotification(null), 3000)
  }, [])

  const goNextEmbed = useCallback(() => {
    clearTimers()
    const next = (activeEmbedIdx + 1) % EMBEDS.length
    if (inLobby && isHost && onSyncAction) {
      onSyncAction('source', { source: EMBEDS[next].key, season: activeSeason, episode: activeEpisode })
    } else {
      setEmbedIdx(next)
    }
  }, [activeEmbedIdx, clearTimers, inLobby, isHost, onSyncAction, activeSeason, activeEpisode])

  // ── reset embed state when embed source / episode changes ─────────────────
  useEffect(() => {
    if (usingDirect) return // direct stream is active, no timers needed
    setLoadState('loading')
    setEmbedKey2(k => k + 1)
    clearTimers()

    stuckTimer.current = setTimeout(() => {
      setLoadState('stuck')
      let rem = 3
      setAutoAdvCountdown(rem)
      countdownInt.current = setInterval(() => {
        rem -= 1
        if (rem <= 0) { clearInterval(countdownInt.current); setAutoAdvCountdown(null) }
        else setAutoAdvCountdown(rem)
      }, 1000)
    }, STUCK_MS)

    autoAdvTimer.current = setTimeout(() => {
      setAutoAdvCountdown(null)
      goNextEmbed()
    }, AUTO_ADV_MS)

    return clearTimers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, movieType, activeSeason, activeEpisode, activeEmbedIdx, streamError, usingDirect])

  // ── lobby sync watcher ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!inLobby || !syncState) return
    const prev = prevSync.current
    if (!prev) { prevSync.current = syncState; return }
    if (prev.source !== syncState.source) {
      notify(`Источник: ${EMBEDS[embedKey(syncState.source)]?.label ?? syncState.source}`)
    }
    prevSync.current = syncState
  }, [syncState, inLobby, notify])

  const onEmbedLoad = useCallback(() => {
    clearTimers()
    setLoadState('ready')
  }, [clearTimers])

  const retryEmbed = useCallback(() => {
    clearTimers()
    setLoadState('loading')
    setEmbedKey2(k => k + 1)
    stuckTimer.current = setTimeout(() => {
      setLoadState('stuck')
      let rem = 3
      setAutoAdvCountdown(rem)
      countdownInt.current = setInterval(() => {
        rem -= 1
        if (rem <= 0) { clearInterval(countdownInt.current); setAutoAdvCountdown(null) }
        else setAutoAdvCountdown(rem)
      }, 1000)
    }, STUCK_MS)
    autoAdvTimer.current = setTimeout(() => {
      setAutoAdvCountdown(null)
      goNextEmbed()
    }, AUTO_ADV_MS)
  }, [clearTimers, goNextEmbed])

  const switchEmbed = useCallback((idx) => {
    setShowMenu(false)
    clearTimers()
    if (inLobby && isHost && onSyncAction) {
      onSyncAction('source', { source: EMBEDS[idx].key, season: activeSeason, episode: activeEpisode })
    } else {
      setEmbedIdx(idx)
    }
  }, [clearTimers, inLobby, isHost, onSyncAction, activeSeason, activeEpisode])

  const activeEmbed = EMBEDS[activeEmbedIdx]
  const embedUrl = movieType === 'tv'
    ? activeEmbed.tv(movieId, activeSeason, activeEpisode)
    : activeEmbed.movie(movieId)

  const currentStream = streamSources?.[streamIdx]

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full bg-black rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]"
      style={{ aspectRatio: '16/9' }}
    >
      {/* ── Direct HLS player ─────────────────────────────────────────── */}
      {usingDirect && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          controls
          autoPlay
          playsInline
        />
      )}

      {/* ── Embed iframe ──────────────────────────────────────────────── */}
      {!usingDirect && !loadingDirect && (
        <iframe
          key={`${activeEmbed.key}-${movieId}-${activeSeason}-${activeEpisode}-${embedKey2}`}
          src={embedUrl}
          onLoad={onEmbedLoad}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 w-full h-full border-0"
          title="Video Player"
        />
      )}

      {/* ── Loading: resolving direct stream ──────────────────────────── */}
      <AnimatePresence>
        {loadingDirect && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#07070d] flex flex-col items-center justify-center gap-4 pointer-events-none"
          >
            <div className="w-14 h-14 rounded-full border-[3px] border-white/8 border-t-violet-500 animate-spin" />
            <p className="text-white/50 text-sm">Поиск прямого потока…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Embed loading overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {!usingDirect && !loadingDirect && loadState === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#07070d] flex flex-col items-center justify-center gap-4 pointer-events-none"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-[3px] border-white/8 border-t-violet-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <p className="text-white/40 text-xs">{activeEmbed.label}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Embed stuck overlay ───────────────────────────────────────── */}
      <AnimatePresence>
        {!usingDirect && !loadingDirect && loadState === 'stuck' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#07070d]/92 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10"
          >
            <div className="text-center">
              <p className="text-white font-semibold">{activeEmbed.label} не отвечает</p>
              <p className="text-white/40 text-sm mt-1">
                {autoAdvCountdown != null
                  ? `Авто-переключение через ${autoAdvCountdown}…`
                  : 'Переключение…'}
              </p>
            </div>

            <div className="flex gap-2">
              {canControl && (
                <button onClick={goNextEmbed}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">
                  Следующий
                </button>
              )}
              <button onClick={retryEmbed}
                className="px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-white/50 hover:text-white text-sm transition-colors">
                Повторить
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 px-4">
              {EMBEDS.map((e, i) => (
                <button key={e.key} onClick={() => canControl && switchEmbed(i)} disabled={!canControl}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    i === activeEmbedIdx
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/8 text-white/40 hover:text-white hover:bg-white/12 disabled:pointer-events-none'
                  }`}>
                  {e.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quality badges for direct stream ──────────────────────────── */}
      {usingDirect && streamSources.length > 1 && (
        <div className="absolute top-3 left-3 z-10 flex gap-1.5">
          {streamSources.map((s, i) => (
            <button key={i} onClick={() => setStreamIdx(i)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors backdrop-blur-md ${
                i === streamIdx
                  ? 'bg-violet-600 text-white'
                  : 'bg-black/60 border border-white/10 text-white/60 hover:text-white'
              }`}>
              {s.quality}
            </button>
          ))}
        </div>
      )}

      {/* ── Lobby badge ───────────────────────────────────────────────── */}
      {inLobby && (
        <div className="absolute top-3 left-3 z-10">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md border ${
            isHost ? 'bg-violet-600/80 border-violet-500/50 text-white' : 'bg-black/60 border-white/10 text-white/50'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isHost ? 'bg-white animate-pulse' : 'bg-white/40'}`} />
            {isHost ? 'Вы — хост' : 'Хост управляет'}
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs font-medium whitespace-nowrap pointer-events-none"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Source picker (embed mode) ────────────────────────────────── */}
      {!usingDirect && !loadingDirect && (
        <div className="absolute top-3 right-3 z-10">
          <div className="relative">
            <button
              onClick={() => canControl && setShowMenu(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-semibold transition-colors ${
                canControl
                  ? 'bg-black/70 border-white/10 text-white hover:bg-black/90'
                  : 'bg-black/40 border-white/5 text-white/30 cursor-default'
              }`}
            >
              <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M3 8a1 1 0 011-1h9a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
              </svg>
              {activeEmbed.label}
              {canControl && (
                <svg className={`w-3 h-3 opacity-60 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            <AnimatePresence>
              {showMenu && canControl && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-[#12121a]/96 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                >
                  {EMBEDS.map((e, i) => (
                    <button key={e.key} onClick={() => switchEmbed(i)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                        i === activeEmbedIdx
                          ? 'text-white bg-violet-600/30 font-semibold'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === activeEmbedIdx ? 'bg-violet-400' : 'bg-white/20'}`} />
                      {e.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {canControl && loadState !== 'stuck' && (
            <button onClick={goNextEmbed}
              className="mt-2 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs text-white/60 hover:text-white transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Другой
            </button>
          )}
        </div>
      )}
    </div>
  )
}
