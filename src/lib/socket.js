"use client";

import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket = null;
let currentToken = null;

/**
 * Returns a singleton Socket.io client.
 * Reconnects with exponential backoff (10 attempts, max 30s delay).
 * Re-creates the socket if the auth token changed.
 */
export function getSocket(token) {
  // Token changed — force reconnect with new auth
  if (socket && token && token !== currentToken) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }

  if (socket?.connected) return socket;

  if (socket) {
    // Socket exists but disconnected — let it reconnect automatically
    if (!socket.disconnected) return socket;
    socket.connect();
    return socket;
  }

  if (!token) return null;

  currentToken = token;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5,
    timeout: 10000,
  });

  socket.on("connect_error", (err) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Socket] connect error:", err.message);
    }
  });

  socket.on("reconnect", (attempt) => {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[Socket] reconnected after ${attempt} attempt(s)`);
    }
  });

  socket.on("reconnect_failed", () => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[Socket] reconnection failed after all attempts");
    }
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}
