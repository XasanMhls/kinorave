import { Lobby } from "../models/index.js";
import { verifySocketToken } from "../middleware/auth.js";

/**
 * Рассчитывает текущую позицию воспроизведения с учётом времени сервера.
 * Если host нажал play в момент X с позиции P,
 * то сейчас позиция = P + (now - X) / 1000 секунд
 */
function calcCurrentPosition(sync) {
  if (!sync.isPlaying || sync.playedAt == null) return sync.position || 0;
  const elapsed = (Date.now() - sync.playedAt) / 1000;
  return (sync.position || 0) + elapsed;
}

const onlineUsers = new Map();

function markUserOnline(io, userId, username) {
  const current = onlineUsers.get(userId) || { count: 0, username };
  current.count += 1;
  current.username = username;
  onlineUsers.set(userId, current);

  if (current.count === 1) {
    io.to(`presence:${userId}`).emit("presence:update", {
      userId,
      online: true,
      username,
    });
  }
}

function markUserOffline(io, userId) {
  const current = onlineUsers.get(userId);
  if (!current) return;

  current.count -= 1;
  if (current.count > 0) {
    onlineUsers.set(userId, current);
    return;
  }

  onlineUsers.delete(userId);
  io.to(`presence:${userId}`).emit("presence:update", {
    userId,
    online: false,
  });
}

export function registerSocketHandlers(io) {
  /* ── Middleware: авторизация ── */
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const payload = verifySocketToken(token);
    if (!payload) return next(new Error("Unauthorized"));
    socket.user = payload; // { userId, username }
    next();
  });

  io.on("connection", (socket) => {
    const { userId, username } = socket.user;
    let currentLobbyCode = null;
    const watchedPresenceRooms = new Set();

    markUserOnline(io, userId, username);

    socket.on("presence:watch", ({ userIds = [] }, cb) => {
      const nextIds = Array.from(
        new Set(
          userIds
            .filter((value) => typeof value === "string" && value.trim())
            .map((value) => value.trim())
        )
      );

      for (const room of watchedPresenceRooms) {
        socket.leave(room);
      }
      watchedPresenceRooms.clear();

      for (const watchedUserId of nextIds) {
        const room = `presence:${watchedUserId}`;
        watchedPresenceRooms.add(room);
        socket.join(room);
      }

      cb?.({
        statuses: nextIds.map((watchedUserId) => ({
          userId: watchedUserId,
          online: onlineUsers.has(watchedUserId),
        })),
      });
    });

    /* ════════════════════════════════════
       LOBBY:JOIN
       ════════════════════════════════════ */
    socket.on("lobby:join", async ({ code }, cb) => {
      try {
        const lobby = await Lobby.findOne({ code: code.toUpperCase() });
        if (!lobby) return cb?.({ error: "Lobby not found" });

        // Покинуть предыдущее лобби
        if (currentLobbyCode && currentLobbyCode !== code) {
          await handleLeave(socket, io, currentLobbyCode, userId, username);
        }

        currentLobbyCode = lobby.code;
        socket.join(lobby.code);

        // Добавить участника, если ещё не в списке
        const alreadyIn = lobby.members.some((m) => m.userId.toString() === userId);
        if (!alreadyIn) {
          lobby.members.push({ userId, username, avatar: null, isReady: false });
          await lobby.save();

          // Уведомить остальных
          socket.to(lobby.code).emit("lobby:member-joined", {
            userId, username, avatar: null, isReady: false, joinedAt: new Date(),
          });
        }

        // Отправить полное состояние только что вошедшему
        const currentPosition = calcCurrentPosition(lobby.sync);
        cb?.({
          lobby: {
            code: lobby.code,
            isPrivate: lobby.isPrivate,
            hostId: lobby.hostId.toString(),
            mode: lobby.mode || "movie",
            movieId: lobby.movieId,
            movieType: lobby.movieType,
            movieTitle: lobby.movieTitle,
            moviePoster: lobby.moviePoster,
          },
          members: lobby.members,
          messages: lobby.messages.slice(-50), // последние 50
          sync: {
            ...lobby.sync.toObject(),
            position: currentPosition, // скорректированная позиция
          },
        });
      } catch (err) {
        cb?.({ error: err.message });
      }
    });

    /* ════════════════════════════════════
       LOBBY:LEAVE
       ════════════════════════════════════ */
    socket.on("lobby:leave", async (_, cb) => {
      if (!currentLobbyCode) return;
      await handleLeave(socket, io, currentLobbyCode, userId, username);
      currentLobbyCode = null;
      cb?.({ ok: true });
    });

    /* ════════════════════════════════════
       LOBBY:CHAT
       ════════════════════════════════════ */
    socket.on("lobby:chat", async ({ text }, cb) => {
      if (!currentLobbyCode) return cb?.({ error: "Not in a lobby" });
      if (!text?.trim()) return cb?.({ error: "Empty message" });

      const msg = {
        userId,
        username,
        avatar: null,
        text: text.trim().slice(0, 500),
        sentAt: new Date(),
      };

      try {
        // Сохраняем (только последние 200 сообщений)
        await Lobby.updateOne(
          { code: currentLobbyCode },
          {
            $push: {
              messages: {
                $each: [msg],
                $slice: -200,
              },
            },
          }
        );

        io.to(currentLobbyCode).emit("lobby:chat", msg);
        cb?.({ ok: true });
      } catch (err) {
        cb?.({ error: err.message });
      }
    });

    socket.on("lobby:typing", ({ isTyping }, cb) => {
      if (!currentLobbyCode) return cb?.({ error: "Not in a lobby" });

      socket.to(currentLobbyCode).emit("lobby:typing", {
        userId,
        username,
        isTyping: Boolean(isTyping),
      });
      cb?.({ ok: true });
    });

    /* ════════════════════════════════════
       LOBBY:SYNC — только host может управлять
       ════════════════════════════════════ */
    socket.on("lobby:sync", async ({ action, data }, cb) => {
      if (!currentLobbyCode) return cb?.({ error: "Not in a lobby" });

      try {
        const lobby = await Lobby.findOne({ code: currentLobbyCode });
        if (!lobby) return cb?.({ error: "Lobby not found" });

        const isHost = lobby.hostId.toString() === userId;
        if (!isHost) return cb?.({ error: "Only host can control playback" });

        const serverTimestamp = Date.now();
        let syncUpdate = {};

        switch (action) {
          case "play": {
            // data.position — текущая позиция в секундах (с клиента)
            syncUpdate = {
              isPlaying: true,
              isPaused: false,
              position: data.position ?? lobby.sync.position ?? 0,
              playedAt: serverTimestamp,
            };
            break;
          }
          case "pause": {
            // Фиксируем позицию с учётом прошедшего времени
            const pos = calcCurrentPosition(lobby.sync);
            syncUpdate = {
              isPlaying: false,
              isPaused: true,
              position: pos,
              playedAt: null,
            };
            break;
          }
          case "seek": {
            // data.position — новая позиция в секундах
            const pos = data.position ?? 0;
            syncUpdate = {
              position: pos,
              playedAt: lobby.sync.isPlaying ? serverTimestamp : null,
            };
            break;
          }
          case "source": {
            // data.source, data.season, data.episode
            syncUpdate = {
              source: data.source || lobby.sync.source,
              season: data.season ?? null,
              episode: data.episode ?? null,
              isPlaying: false,
              isPaused: false,
              position: 0,
              playedAt: null,
            };
            break;
          }
          default:
            return cb?.({ error: "Unknown action" });
        }

        // Сохраняем в БД
        const setFields = Object.fromEntries(
          Object.entries(syncUpdate).map(([k, v]) => [`sync.${k}`, v])
        );
        await Lobby.updateOne({ code: currentLobbyCode }, { $set: setFields });

        // Транслируем всем в комнате (включая отправителя для подтверждения)
        io.to(currentLobbyCode).emit("lobby:sync", {
          action,
          data: syncUpdate,
          serverTimestamp,
          fromUserId: userId,
        });

        cb?.({ ok: true, serverTimestamp });
      } catch (err) {
        cb?.({ error: err.message });
      }
    });

    /* ════════════════════════════════════
       LOBBY:REACTION — emoji reaction on message
       ════════════════════════════════════ */
    socket.on("lobby:reaction", async ({ messageId, emoji }, cb) => {
      if (!currentLobbyCode) return cb?.({ error: "Not in a lobby" });
      if (!emoji || typeof emoji !== "string") return cb?.({ error: "Invalid emoji" });

      // Broadcast to everyone in the room (optimistic on sender side already)
      io.to(currentLobbyCode).emit("lobby:reaction", { messageId, emoji, userId });
      cb?.({ ok: true });
    });

    /* ════════════════════════════════════
       LOBBY:READY — участник готов к старту
       ════════════════════════════════════ */
    socket.on("lobby:ready", async ({ isReady }, cb) => {
      if (!currentLobbyCode) return;
      try {
        await Lobby.updateOne(
          { code: currentLobbyCode, "members.userId": userId },
          { $set: { "members.$.isReady": !!isReady } }
        );
        io.to(currentLobbyCode).emit("lobby:ready-update", { userId, isReady: !!isReady });
        cb?.({ ok: true });
      } catch (err) {
        cb?.({ error: err.message });
      }
    });

    /* ════════════════════════════════════
       LOBBY:PING — защита от рассинхрона
       Клиент периодически сообщает свою позицию,
       сервер проверяет и посылает коррекцию если > 3 сек
       ════════════════════════════════════ */
    socket.on("lobby:ping", async ({ clientPosition }) => {
      if (!currentLobbyCode) return;
      try {
        const lobby = await Lobby.findOne(
          { code: currentLobbyCode },
          { sync: 1, hostId: 1 }
        );
        if (!lobby || !lobby.sync.isPlaying) return;

        const expected = calcCurrentPosition(lobby.sync);
        const drift = Math.abs(expected - (clientPosition ?? 0));

        // Если дрейф больше 3 секунд — посылаем коррекцию только этому клиенту
        if (drift > 3) {
          socket.emit("lobby:sync", {
            action: "seek",
            data: { position: expected },
            serverTimestamp: Date.now(),
            fromUserId: "server",
          });
        }
      } catch {
        // non-critical
      }
    });

    /* ════════════════════════════════════
       LOBBY:RTC-SIGNAL — WebRTC signaling for screen share
       Host sends offer to guest, guest sends answer back
       ════════════════════════════════════ */
    socket.on("lobby:rtc-signal", ({ targetUserId, signal }) => {
      if (!currentLobbyCode) return;
      // Find the target socket in the room and forward
      const room = io.sockets.adapter.rooms.get(currentLobbyCode);
      if (!room) return;
      for (const sid of room) {
        const s = io.sockets.sockets.get(sid);
        if (s && s.user?.userId === targetUserId) {
          s.emit("lobby:rtc-signal", { fromUserId: userId, signal });
          break;
        }
      }
    });

    // Host notifies guests that screen sharing started/stopped
    socket.on("lobby:screen-share", async ({ active }) => {
      if (!currentLobbyCode) return;
      io.to(currentLobbyCode).emit("lobby:screen-share", {
        active: !!active,
        hostUserId: userId,
      });
    });

    /* ════════════════════════════════════
       DISCONNECT
       ════════════════════════════════════ */
    socket.on("disconnect", async () => {
      if (currentLobbyCode) {
        await handleLeave(socket, io, currentLobbyCode, userId, username);
      }
      markUserOffline(io, userId);
    });
  });
}

/* ─── Вспомогательная: покинуть лобби ─── */
async function handleLeave(socket, io, code, userId, username) {
  try {
    socket.leave(code);

    const lobby = await Lobby.findOne({ code });
    if (!lobby) return;

    // Удаляем участника
    lobby.members = lobby.members.filter((m) => m.userId.toString() !== userId);

    if (lobby.members.length === 0) {
      // Последний ушёл — удаляем лобби
      await Lobby.deleteOne({ code });
      return;
    }

    // Если ушёл host — передаём хостинг следующему
    if (lobby.hostId.toString() === userId) {
      lobby.hostId = lobby.members[0].userId;
      io.to(code).emit("lobby:host-changed", {
        newHostId: lobby.hostId.toString(),
        newHostUsername: lobby.members[0].username,
      });
    }

    await lobby.save();
    io.to(code).emit("lobby:member-left", { userId, username });
  } catch {
    // non-critical
  }
}
