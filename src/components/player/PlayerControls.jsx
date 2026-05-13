"use client";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function PlayerControls({
  isPlaying,
  isSeeking,
  seekValue,
  currentTime,
  duration,
  volume,
  muted,
  canControlPlayback,
  lobbyCode,
  isHost,
  title,
  mediaLabel,
  onTogglePlayback,
  onSeekChange,
  onSeekCommit,
  onToggleMute,
  onVolumeChange,
  onToggleFullscreen,
}) {
  return (
    <div className="w-full px-4 pb-4 pt-12">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] text-white/70">{mediaLabel}</p>
          <p className="text-[15px] font-semibold text-white">{title || "Stream"}</p>
        </div>
        {lobbyCode && (
          <div className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
            {isHost ? "Host controls" : "Synced viewer"}
          </div>
        )}
      </div>

      {/* Seek bar */}
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={isSeeking ? seekValue : currentTime}
        onChange={(e) => onSeekChange(Number(e.target.value))}
        onMouseUp={(e) => onSeekCommit(Number(e.currentTarget.value))}
        onTouchEnd={(e) => onSeekCommit(Number(e.currentTarget.value))}
        disabled={!canControlPlayback}
        className="mb-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-accent disabled:cursor-not-allowed"
      />

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 text-white">
        {/* Play/Pause */}
        <button
          type="button"
          onClick={onTogglePlayback}
          disabled={!canControlPlayback}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/14 backdrop-blur-xl transition hover:bg-white/20 disabled:opacity-40"
        >
          {isPlaying ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
            </svg>
          ) : (
            <svg className="ml-0.5 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Mute */}
        <button
          type="button"
          onClick={onToggleMute}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/16"
        >
          {muted || volume === 0 ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12a4.5 4.5 0 00-1.54-3.39l1.42-1.42A6.46 6.46 0 0118.5 12c0 1.77-.71 3.37-1.86 4.53l-1.42-1.42A4.48 4.48 0 0016.5 12zM5 9v6h4l5 5V4L9 9H5zm13.71 12.29L4.71 7.29l1.41-1.41 14 14z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 4L9 9H5v6h4l5 5V4zm2.5 8a4.5 4.5 0 00-2.12-3.81v7.62A4.5 4.5 0 0016.5 12zm0-8.5v2.06a8 8 0 010 12.88v2.06a10 10 0 000-17z" />
            </svg>
          )}
        </button>

        {/* Volume slider */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => onVolumeChange(e.target.value)}
          className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-white/20 accent-accent"
        />

        {/* Time */}
        <span className="ml-auto text-[12px] text-white/70">
          {formatTime(isSeeking ? seekValue : currentTime)} / {formatTime(duration)}
        </span>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/16"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
