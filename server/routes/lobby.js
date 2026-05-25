import { Router } from "express";
import { nanoid } from "nanoid";
import { Lobby } from "../models/index.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

function generateCode() {
  // 6 символов, только буквы + цифры, заглавные
  return nanoid(6).toUpperCase().replace(/[^A-Z0-9]/g, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
  );
}

/* POST /api/lobby — создать лобби */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { movieId, movieType, movieTitle, moviePoster, isPrivate, mode } = req.body;
    const isScreencast = mode === "screencast";
    if (!isScreencast && (!movieId || !movieTitle)) {
      return res.status(400).json({ error: "movieId and movieTitle required" });
    }

    // Уникальный код, retry при коллизии
    let code, attempts = 0;
    do {
      code = generateCode();
      attempts++;
    } while (attempts < 5 && await Lobby.exists({ code }));

    const lobby = await Lobby.create({
      code,
      isPrivate: !!isPrivate,
      mode: isScreencast ? "screencast" : "movie",
      hostId: req.user.userId,
      movieId: isScreencast ? null : Number(movieId),
      movieType: isScreencast ? "movie" : (movieType || "movie"),
      movieTitle: isScreencast ? "Показ экрана" : movieTitle,
      moviePoster: isScreencast ? null : (moviePoster || null),
      members: [{
        userId: req.user.userId,
        username: req.user.username,
        avatar: null,
        isReady: false,
      }],
    });

    res.status(201).json({
      code: lobby.code,
      lobbyId: lobby._id,
      inviteUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/lobby/${lobby.code}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/lobby/:code — получить информацию о лобби */
router.get("/:code", async (req, res) => {
  try {
    const lobby = await Lobby.findOne({ code: req.params.code.toUpperCase() })
      .select("-messages"); // сообщения грузятся через сокет

    if (!lobby) return res.status(404).json({ error: "Lobby not found" });
    if (lobby.isPrivate) {
      // для приватных — нужна авторизация, проверяем заголовок
      const auth = req.headers.authorization;
      if (!auth) return res.status(403).json({ error: "Private lobby" });
    }
    res.json(lobby);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/lobby — список публичных лобби */
router.get("/", async (req, res) => {
  try {
    const lobbies = await Lobby.find({ isPrivate: false })
      .select("code mode movieTitle moviePoster movieType members hostId createdAt")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(lobbies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
