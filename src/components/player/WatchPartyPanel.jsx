"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export default function WatchPartyPanel({
  lobbyCode,
  isHost,
  copied,
  currentUser,
  authToken,
  tmdbId,
  type,
  title,
  poster,
  onLobbyCreated,
  onLobbyJoined,
  onLeave,
  onCopyInvite,
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [lobbyInput, setLobbyInput] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createLobby() {
    if (!currentUser || !authToken) {
      setError("Log in to start a watch party.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/lobby`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          movieId: tmdbId,
          movieType: type,
          movieTitle: title || `Title ${tmdbId}`,
          moviePoster: poster || null,
          isPrivate,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to create lobby");
      onLobbyCreated(payload.code);
      setShowCreate(false);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to create lobby");
    } finally {
      setLoading(false);
    }
  }

  function joinLobby() {
    const code = lobbyInput.trim().toUpperCase();
    if (code.length !== 6) { setError("Enter a valid 6-character room code."); return; }
    if (!currentUser) { setError("Log in to join a room."); return; }
    onLobbyJoined(code);
    setShowJoin(false);
    setError("");
    setLobbyInput("");
  }

  return (
    <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-4">
      <p className="text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-[0.16em] text-text-muted">
        Watch Party
      </p>

      {!lobbyCode ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="accentSoft"
            size="sm"
            onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}
          >
            Create room
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }}
          >
            Join by code
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onCopyInvite}>
            {copied ? "Copied" : "Copy invite"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onLeave}>
            Leave room
          </Button>
        </div>
      )}

      {showCreate && !lobbyCode && (
        <div className="mt-4 space-y-3 rounded-[18px] border border-white/[0.06] bg-black/20 p-4">
          <label className="flex items-center gap-3 text-[13px] text-text-secondary">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-transparent accent-accent"
            />
            Private room
          </label>
          {error && <p className="text-[12px] text-crimson">{error}</p>}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={createLobby} disabled={loading}>
              {loading ? "Creating…" : "Start"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {showJoin && !lobbyCode && (
        <div className="mt-4 space-y-3 rounded-[18px] border border-white/[0.06] bg-black/20 p-4">
          <input
            value={lobbyInput}
            onChange={(e) => setLobbyInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && joinLobby()}
            maxLength={6}
            placeholder="AB12CD"
            className="input-dark !h-11 !rounded-2xl !px-4 !font-[family-name:var(--font-mono)] !tracking-[0.18em] uppercase"
          />
          {error && <p className="text-[12px] text-crimson">{error}</p>}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={joinLobby}>Join</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowJoin(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
