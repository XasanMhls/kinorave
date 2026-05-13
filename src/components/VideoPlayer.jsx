"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LobbyOverlay from "./LobbyOverlay";
import PlayerControls from "./player/PlayerControls";
import WatchPartyPanel from "./player/WatchPartyPanel";
import Button from "./ui/Button";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function getSourceMode(source) {
  return source?.kind === "media" ? "media" : "embed";
}

export default function VideoPlayer({
  tmdbId,
  type = "movie",
  season,
  episode,
  initialLobbyCode = null,
  title,
  poster,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const controlsHideTimerRef = useRef(null);
  const pendingRemotePlaybackRef = useRef(null);
  const suppressOutboundSyncRef = useRef(false);
  const sourceFailureRef = useRef(new Set());
  const lobbyControllerRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [lobbyCode, setLobbyCode] = useState(initialLobbyCode);
  const [copied, setCopied] = useState(false);

  const [resolverState, setResolverState] = useState({
    loading: true,
    error: "",
    mediaSources: [],
    embedSources: [],
  });
  const [activeSourceId, setActiveSourceId] = useState(null);
  const [currentSeason, setCurrentSeason] = useState(season || 1);
  const [currentEpisode, setCurrentEpisode] = useState(episode || 1);
  const [playbackError, setPlaybackError] = useState("");
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekValue, setSeekValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Auth init
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (payload?.user) {
          setCurrentUser({ userId: payload.user.id, username: payload.user.username });
        }
      })
      .catch(() => {});
    setAuthToken(readCookie("auth_token"));
  }, []);

  // Source resolution
  useEffect(() => {
    const controller = new AbortController();

    async function resolve() {
      setResolverState((prev) => ({ ...prev, loading: true, error: "" }));
      setPlaybackError("");
      sourceFailureRef.current.clear();

      try {
        const params = new URLSearchParams({ tmdbId: String(tmdbId), type });
        if (type === "tv") {
          params.set("season", String(currentSeason));
          params.set("episode", String(currentEpisode));
        }
        const res = await fetch(`/api/player?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to resolve player sources");

        setResolverState({
          loading: false,
          error: "",
          mediaSources: payload.mediaSources || [],
          embedSources: payload.embedSources || [],
        });
        setActiveSourceId((prev) => {
          const ids = new Set([
            ...(payload.mediaSources || []).map((s) => s.id),
            ...(payload.embedSources || []).map((s) => s.id),
          ]);
          if (prev && ids.has(prev)) return prev;
          if (payload.preferredSourceId && ids.has(payload.preferredSourceId)) return payload.preferredSourceId;
          return payload.mediaSources?.[0]?.id || payload.embedSources?.[0]?.id || null;
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        setResolverState({ loading: false, error: err.message || "Failed to resolve sources", mediaSources: [], embedSources: [] });
      }
    }

    resolve();
    return () => controller.abort();
  }, [tmdbId, type, currentSeason, currentEpisode]);

  const sourceOptions = useMemo(
    () => [...resolverState.mediaSources, ...resolverState.embedSources],
    [resolverState.embedSources, resolverState.mediaSources]
  );

  const activeSource =
    sourceOptions.find((s) => s.id === activeSourceId) || sourceOptions[0] || null;

  const isHost = Boolean(lobbyCode && lobbyControllerRef.current?.isHost);
  const canControlPlayback = !lobbyCode || isHost;

  const applyRemotePlayback = useCallback(async (nextState) => {
    const video = videoRef.current;
    if (!video || getSourceMode(activeSource) !== "media") {
      pendingRemotePlaybackRef.current = nextState;
      return;
    }
    suppressOutboundSyncRef.current = true;
    try {
      const nextPos = clamp(
        nextState.position || 0,
        0,
        Number.isFinite(video.duration) ? video.duration : nextState.position || 0
      );
      if (Math.abs(video.currentTime - nextPos) > 1) video.currentTime = nextPos;
      setCurrentTime(nextPos);
      setSeekValue(nextPos);
      if (nextState.isPlaying) {
        await video.play();
      } else {
        video.pause();
      }
    } catch {
      setPlaybackError("The selected source could not be controlled. Try another source.");
    } finally {
      window.setTimeout(() => { suppressOutboundSyncRef.current = false; }, 0);
    }
  }, [activeSource]);

  useEffect(() => {
    if (!activeSource || getSourceMode(activeSource) !== "media") return;
    if (!pendingRemotePlaybackRef.current) return;
    applyRemotePlayback(pendingRemotePlaybackRef.current);
    pendingRemotePlaybackRef.current = null;
  }, [activeSource, applyRemotePlayback]);

  const handleSyncEvent = useCallback(async (event) => {
    if (!event) return;
    if (event.fromUserId && event.fromUserId === currentUser?.userId) return;

    if (event.source !== undefined || event.position !== undefined || event.isPlaying !== undefined) {
      if (event.source) setActiveSourceId(event.source);
      if (event.season != null) setCurrentSeason(event.season);
      if (event.episode != null) setCurrentEpisode(event.episode);
      await applyRemotePlayback({ position: event.position || 0, isPlaying: Boolean(event.isPlaying) });
      return;
    }

    const { action, data, serverTimestamp } = event;
    switch (action) {
      case "source":
        if (data?.source) setActiveSourceId(data.source);
        if (data?.season != null) setCurrentSeason(data.season);
        if (data?.episode != null) setCurrentEpisode(data.episode);
        setPlaybackError("");
        break;
      case "play": {
        const drift = serverTimestamp ? Math.max((Date.now() - serverTimestamp) / 1000, 0) : 0;
        await applyRemotePlayback({ position: (data?.position || 0) + drift, isPlaying: true });
        break;
      }
      case "pause":
        await applyRemotePlayback({ position: data?.position || currentTime, isPlaying: false });
        break;
      case "seek":
        await applyRemotePlayback({ position: data?.position || 0, isPlaying });
        break;
      default:
        break;
    }
  }, [applyRemotePlayback, currentTime, currentUser?.userId, isPlaying]);

  const emitLobbySync = useCallback((action, data = {}) => {
    if (!lobbyCode || !lobbyControllerRef.current?.isHost) return;
    lobbyControllerRef.current.emitSync(action, data);
  }, [lobbyCode]);

  const selectSource = useCallback((sourceId) => {
    setActiveSourceId(sourceId);
    setPlaybackError("");
    if (type === "tv") {
      emitLobbySync("source", { source: sourceId, season: currentSeason, episode: currentEpisode });
      return;
    }
    emitLobbySync("source", { source: sourceId });
  }, [currentEpisode, currentSeason, emitLobbySync, type]);

  const updateControlsVisibility = useCallback((visible) => {
    setControlsVisible(visible);
    if (controlsHideTimerRef.current) clearTimeout(controlsHideTimerRef.current);
    if (visible && isPlaying) {
      controlsHideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 2200);
    }
  }, [isPlaying]);

  useEffect(() => () => { if (controlsHideTimerRef.current) clearTimeout(controlsHideTimerRef.current); }, []);

  const handleMediaError = useCallback(() => {
    if (getSourceMode(activeSource) !== "media") {
      setPlaybackError("This embedded source is unavailable right now. Try another provider.");
      return;
    }
    sourceFailureRef.current.add(activeSource.id);
    const next = resolverState.mediaSources.find(
      (s) => s.id !== activeSource.id && !sourceFailureRef.current.has(s.id)
    );
    if (next) { setActiveSourceId(next.id); setPlaybackError(""); return; }
    setPlaybackError("No valid direct video source could be played. Try an embedded fallback provider below.");
  }, [activeSource, resolverState.mediaSources]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
    setCurrentTime(video.currentTime || 0);
    setSeekValue(video.currentTime || 0);
    if (pendingRemotePlaybackRef.current) {
      applyRemotePlayback(pendingRemotePlaybackRef.current);
      pendingRemotePlaybackRef.current = null;
    }
  }, [applyRemotePlayback]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || isSeeking) return;
    setCurrentTime(videoRef.current.currentTime || 0);
    setSeekValue(videoRef.current.currentTime || 0);
  }, [isSeeking]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    updateControlsVisibility(true);
    if (suppressOutboundSyncRef.current || !canControlPlayback) return;
    emitLobbySync("play", { position: videoRef.current?.currentTime || 0 });
  }, [canControlPlayback, emitLobbySync, updateControlsVisibility]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    setControlsVisible(true);
    if (suppressOutboundSyncRef.current || !canControlPlayback) return;
    emitLobbySync("pause", { position: videoRef.current?.currentTime || 0 });
  }, [canControlPlayback, emitLobbySync]);

  const togglePlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !canControlPlayback || getSourceMode(activeSource) !== "media") return;
    try {
      if (video.paused) { await video.play(); } else { video.pause(); }
    } catch {
      setPlaybackError("This video source could not be started. Try another source.");
    }
  }, [activeSource, canControlPlayback]);

  const commitSeek = useCallback((rawValue) => {
    const video = videoRef.current;
    if (!video || !canControlPlayback) return;
    const nextTime = clamp(rawValue, 0, duration || rawValue);
    suppressOutboundSyncRef.current = true;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    setSeekValue(nextTime);
    setIsSeeking(false);
    window.setTimeout(() => { suppressOutboundSyncRef.current = false; }, 0);
    emitLobbySync("seek", { position: nextTime });
  }, [canControlPlayback, duration, emitLobbySync]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
  }, []);

  const handleVolumeChange = useCallback((nextVolume) => {
    const video = videoRef.current;
    if (!video) return;
    const norm = clamp(Number(nextVolume), 0, 1);
    video.volume = norm;
    video.muted = norm === 0;
    setVolume(norm);
    setMuted(norm === 0);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const onFSChange = () => updateControlsVisibility(true);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, [updateControlsVisibility]);

  const getPlaybackState = useCallback(() => ({
    currentTime: videoRef.current?.currentTime || currentTime,
    isPlaying: !videoRef.current?.paused,
    sourceId: activeSource?.id || null,
  }), [activeSource?.id, currentTime]);

  const copyInviteLink = useCallback(() => {
    if (!lobbyCode) return;
    const url = new URL(window.location.href);
    url.searchParams.set("lobby", lobbyCode);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }).catch(() => {});
  }, [lobbyCode]);

  const mediaSource = getSourceMode(activeSource) === "media" ? activeSource : null;
  const embedSource = getSourceMode(activeSource) === "embed" ? activeSource : null;

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,17,26,0.96),rgba(7,7,11,0.96))] shadow-elevated">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-[0.18em] text-accent">Player</p>
            <h3 className="mt-1 text-[20px] font-[family-name:var(--font-display)] tracking-[-0.03em] text-text-primary">
              {title || "Now Playing"}
            </h3>
          </div>

          {/* Source selector */}
          <div className="flex flex-wrap items-center gap-2">
            {sourceOptions.map((source) => {
              const active = source.id === activeSource?.id;
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => selectSource(source.id)}
                  disabled={Boolean(lobbyCode && !isHost)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-semibold transition-all duration-300 ${
                    active
                      ? "border-accent/30 bg-accent/14 text-accent shadow-[0_12px_30px_rgba(185,255,102,0.12)]"
                      : "border-white/[0.08] bg-white/[0.03] text-text-secondary hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-text-primary"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${source.kind === "media" ? "bg-accent" : "bg-amber"}`} />
                  {source.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className={`flex gap-5 p-5 ${lobbyCode ? "flex-col xl:flex-row" : "flex-col"}`}>
          <div className="min-w-0 flex-1 space-y-4">
            {/* Video container */}
            <div
              ref={containerRef}
              className="group relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-black"
              onMouseMove={() => updateControlsVisibility(true)}
              onMouseLeave={() => updateControlsVisibility(false)}
            >
              <div className="aspect-video">
                {resolverState.loading ? (
                  <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(185,255,102,0.1),transparent_40%),linear-gradient(180deg,#0d0d14,#050507)]">
                    <div className="flex flex-col items-center gap-4 text-text-secondary">
                      <div className="h-10 w-10 rounded-full border-2 border-accent/40 border-t-accent animate-spin" />
                      <p className="text-[13px]">Resolving the best video source…</p>
                    </div>
                  </div>
                ) : mediaSource ? (
                  <>
                    <video
                      key={`${mediaSource.id}-${currentSeason}-${currentEpisode}`}
                      ref={videoRef}
                      className="h-full w-full bg-black object-contain"
                      src={mediaSource.url}
                      poster={poster || undefined}
                      playsInline
                      preload="metadata"
                      crossOrigin="anonymous"
                      onLoadedMetadata={handleLoadedMetadata}
                      onTimeUpdate={handleTimeUpdate}
                      onDurationChange={() => setDuration(videoRef.current?.duration || 0)}
                      onPlay={handlePlay}
                      onPause={handlePause}
                      onWaiting={() => setIsBuffering(true)}
                      onPlaying={() => setIsBuffering(false)}
                      onCanPlay={() => setIsBuffering(false)}
                      onError={handleMediaError}
                      onClick={togglePlayback}
                    />

                    <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

                    {isBuffering && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="h-14 w-14 rounded-full border-2 border-white/20 border-t-accent animate-spin" />
                      </div>
                    )}

                    {playbackError && (
                      <div className="absolute left-4 right-4 top-4 rounded-2xl border border-crimson/20 bg-crimson/12 px-4 py-3 text-[13px] text-red-100 backdrop-blur-xl">
                        {playbackError}
                      </div>
                    )}

                    <div
                      className={`absolute inset-0 flex items-end transition-opacity duration-300 ${
                        controlsVisible ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <PlayerControls
                        isPlaying={isPlaying}
                        isSeeking={isSeeking}
                        seekValue={seekValue}
                        currentTime={currentTime}
                        duration={duration}
                        volume={volume}
                        muted={muted}
                        canControlPlayback={canControlPlayback}
                        lobbyCode={lobbyCode}
                        isHost={isHost}
                        title={title}
                        mediaLabel={mediaSource.label}
                        onTogglePlayback={togglePlayback}
                        onSeekChange={(v) => { setIsSeeking(true); setSeekValue(v); }}
                        onSeekCommit={commitSeek}
                        onToggleMute={toggleMute}
                        onVolumeChange={handleVolumeChange}
                        onToggleFullscreen={toggleFullscreen}
                      />
                    </div>
                  </>
                ) : embedSource ? (
                  <div className="flex h-full flex-col">
                    <iframe
                      key={`${embedSource.id}-${currentSeason}-${currentEpisode}`}
                      src={embedSource.url}
                      className="h-full w-full"
                      frameBorder="0"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="origin"
                    />
                    <div className="border-t border-white/[0.06] bg-[#08080d] px-4 py-3 text-[13px] text-text-secondary">
                      Direct HTML5 playback is unavailable for this title right now. Using an embedded fallback provider instead.
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center bg-[linear-gradient(180deg,#0d0d14,#050507)] p-6 text-center">
                    <div className="max-w-md space-y-3">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                        <svg className="h-7 w-7 text-accent" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <h4 className="text-[20px] font-semibold text-text-primary">No playable source found</h4>
                      <p className="text-[14px] text-text-secondary">
                        Configure a direct stream provider via <code className="text-accent">STREAM_API_URL</code> or add fallback media URLs.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status + Watch Party row */}
            <div className="grid gap-3 md:grid-cols-[1.3fr_1fr]">
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-[0.16em] text-text-muted">Status</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[12px] font-semibold text-accent">
                    {mediaSource ? "Direct HTML5 playback" : embedSource ? "Embedded fallback" : "Unavailable"}
                  </span>
                  {resolverState.error && (
                    <span className="rounded-full border border-crimson/20 bg-crimson/10 px-3 py-1 text-[12px] font-semibold text-crimson">
                      Resolver warning
                    </span>
                  )}
                  {lobbyCode && (
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[12px] font-semibold text-text-primary">
                      Room {lobbyCode}
                    </span>
                  )}
                </div>
                {(resolverState.error || playbackError) && (
                  <p className="mt-3 text-[13px] leading-6 text-text-secondary">
                    {playbackError || resolverState.error}
                  </p>
                )}
              </div>

              <WatchPartyPanel
                lobbyCode={lobbyCode}
                isHost={isHost}
                copied={copied}
                currentUser={currentUser}
                authToken={authToken}
                tmdbId={tmdbId}
                type={type}
                title={title}
                poster={poster}
                onLobbyCreated={(code) => setLobbyCode(code)}
                onLobbyJoined={(code) => setLobbyCode(code)}
                onLeave={() => setLobbyCode(null)}
                onCopyInvite={copyInviteLink}
              />
            </div>
          </div>

          {/* Lobby overlay */}
          {lobbyCode && (
            <div className="w-full shrink-0 xl:w-[360px]">
              <div className="h-[620px] overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#0b0b12] shadow-elevated">
                <LobbyOverlay
                  lobbyCode={lobbyCode}
                  currentUser={currentUser}
                  token={authToken}
                  onSyncChange={handleSyncEvent}
                  onClose={() => setLobbyCode(null)}
                  onControllerReady={(controller) => { lobbyControllerRef.current = controller; }}
                  getPlaybackState={getPlaybackState}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
