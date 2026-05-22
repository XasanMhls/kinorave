import express from "express";
import crypto from "crypto";
import { User } from "../models/index.js";

const router = express.Router();

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}
function generateSalt() {
  return crypto.randomBytes(16).toString("hex");
}
function getSecret() {
  return process.env.JWT_SECRET || "kino-secret";
}

export function createToken(userId, username) {
  const payload = JSON.stringify({ userId, username, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    const [encoded, sig] = token.split(".");
    const expectedSig = crypto.createHmac("sha256", getSecret()).update(encoded).digest("base64url");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAuthUser(req) {
  const cookie = req.cookies?.auth_token;
  if (cookie) return verifyToken(cookie);
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return verifyToken(header.slice(7));
  return null;
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "Все поля обязательны" });
    if (password.length < 6) return res.status(400).json({ error: "Пароль минимум 6 символов" });
    if (username.length < 3) return res.status(400).json({ error: "Имя минимум 3 символа" });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ error: "Пользователь уже существует" });

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const user = await User.create({ username, email, passwordHash, salt });

    const token = createToken(user._id.toString(), user.username);
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch {
    res.status(500).json({ error: "Ошибка регистрации" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email и пароль обязательны" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Неверные данные" });

    const hash = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) return res.status(401).json({ error: "Неверные данные" });

    const token = createToken(user._id.toString(), user.username);
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch {
    res.status(500).json({ error: "Ошибка входа" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token", { path: "/" });
  res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  const user = getAuthUser(req);
  // Also return the raw token so client can use it for socket auth
  const token = req.cookies?.auth_token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
  res.json({ user, token: user ? token : null });
});

export default router;
