"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getSocket } from "@/lib/socket";
import Button from "./ui/Button";

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function Avatar({ username, avatar, size = 38 }) {
  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={username}
        width={size}
        height={size}
        className="rounded-[12px] object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-accent to-[#8de640] font-bold text-text-inverse"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {username?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export default function FriendsPanel({ onClose, onRequestsChange }) {
  const [tab, setTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendStatus, setSendStatus] = useState("idle");
  const [sendError, setSendError] = useState("");
  const [onlineMap, setOnlineMap] = useState({});

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/friends", { cache: "no-store" });
      if (!response.ok) return;

      const payload = await response.json();
      setFriends(payload.friends || []);
      setRequests(payload.requests || []);
      onRequestsChange?.(payload.requests?.length || 0);
    } finally {
      setLoading(false);
    }
  }, [onRequestsChange]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const friendIds = useMemo(() => friends.map((friend) => friend.id), [friends]);

  useEffect(() => {
    const token = readCookie("auth_token");
    if (!token || friendIds.length === 0) return;

    const socket = getSocket(token);
    if (!socket) return;

    socket.emit("presence:watch", { userIds: friendIds }, (response) => {
      const snapshot = Object.fromEntries((response?.statuses || []).map((status) => [status.userId, Boolean(status.online)]));
      setOnlineMap(snapshot);
    });

    const handlePresenceUpdate = ({ userId, online }) => {
      setOnlineMap((prev) => ({ ...prev, [userId]: Boolean(online) }));
    };

    socket.on("presence:update", handlePresenceUpdate);
    return () => {
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, [friendIds]);

  const sendRequest = useCallback(async () => {
    if (!searchValue.trim()) return;

    setSendStatus("sending");
    setSendError("");

    try {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: searchValue.trim() }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Request failed");
      }

      setSendStatus("success");
      setSearchValue("");
      fetchFriends();
    } catch (error) {
      setSendStatus("error");
      setSendError(error.message || "Request failed");
    }
  }, [fetchFriends, searchValue]);

  const respondToRequest = useCallback(async (requestId, action) => {
    const response = await fetch(`/api/friends/${requestId}?action=${action}`, { method: "POST" });
    if (response.ok) {
      fetchFriends();
    }
  }, [fetchFriends]);

  const removeFriend = useCallback(async (friendId) => {
    const response = await fetch(`/api/friends/${friendId}`, { method: "DELETE" });
    if (response.ok) {
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
        <div>
          <p className="text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-[0.16em] text-accent">
            Social
          </p>
          <h3 className="mt-1 text-[18px] font-[family-name:var(--font-display)] text-text-primary">Friends</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="flex gap-1 px-3 pt-3">
        {[
          { id: "friends", label: "Friends" },
          { id: "add", label: "Add" },
          { id: "requests", label: `Requests${requests.length ? ` (${requests.length})` : ""}` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-xl px-3 py-2 text-[12px] font-semibold transition-colors ${
              tab === item.id
                ? "bg-accent/10 text-accent"
                : "text-text-muted hover:bg-white/[0.04] hover:text-text-primary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {tab === "friends" && (
          <>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="h-14 rounded-2xl bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-[14px] text-text-muted">No friends yet.</p>
                <Button variant="accentSoft" size="sm" className="mt-4" onClick={() => setTab("add")}>
                  Add your first friend
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => {
                  const online = Boolean(onlineMap[friend.id]);
                  return (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
                    >
                      <div className="relative">
                        <Avatar username={friend.username} avatar={friend.avatar} />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0d0d14] ${
                            online ? "bg-success" : "bg-white/18"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-text-primary">{friend.username}</p>
                        <p className="text-[11px] text-text-muted">{online ? "Online now" : "Offline"}</p>
                      </div>
                      <Button variant="danger" size="sm" onClick={() => removeFriend(friend.id)}>
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "add" && (
          <div className="space-y-4 pt-2">
            <p className="text-[13px] leading-6 text-text-secondary">
              Enter the exact username to send a friend request.
            </p>
            <div className="flex gap-2">
              <input
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                  setSendStatus("idle");
                  setSendError("");
                }}
                onKeyDown={(event) => event.key === "Enter" && sendRequest()}
                placeholder="username"
                className="input-dark !h-11 !rounded-2xl !px-4"
              />
              <Button variant="primary" size="sm" onClick={sendRequest} disabled={sendStatus === "sending" || !searchValue.trim()}>
                {sendStatus === "sending" ? "…" : "Send"}
              </Button>
            </div>
            {sendStatus === "success" && <p className="text-[12px] text-success">Request sent.</p>}
            {sendStatus === "error" && <p className="text-[12px] text-crimson">{sendError}</p>}
          </div>
        )}

        {tab === "requests" && (
          <>
            {requests.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[13px] text-text-muted">No incoming requests.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map((request) => (
                  <div
                    key={request.requestId}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
                  >
                    <Avatar username={request.from.username} avatar={request.from.avatar} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-text-primary">{request.from.username}</p>
                      <p className="text-[11px] text-text-muted">Incoming request</p>
                    </div>
                    <Button variant="accentSoft" size="sm" onClick={() => respondToRequest(request.requestId, "accept")}>
                      Accept
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => respondToRequest(request.requestId, "reject")}>
                      Decline
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
