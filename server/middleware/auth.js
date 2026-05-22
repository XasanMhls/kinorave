import crypto from "crypto";

/**
 * Верифицирует HMAC-токен, созданный Next.js (`src/lib/auth.js`).
 * Формат: base64url(payload) + "." + hmac_sha256(base64url(payload))
 */
function verifyToken(token, secret) {
  if (!token || !secret) return null;
  try {
    const [encoded, sig] = token.split(".");
    const expectedSig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload; // { userId, username, exp }
  } catch {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const secret = process.env.JWT_SECRET;
  // Accept Bearer header or cookie
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ")
    ? header.slice(7)
    : req.cookies?.auth_token || null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = verifyToken(token, secret);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = payload;
  next();
}

/**
 * Для Socket.io — проверяет токен из handshake.auth.token
 */
export function verifySocketToken(token) {
  const secret = process.env.JWT_SECRET;
  return verifyToken(token, secret);
}
