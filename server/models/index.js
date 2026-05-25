import mongoose from "mongoose";

/* ─── User (зеркало схемы из Next.js, только для чтения) ─── */
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  passwordHash: String,
  salt:     String,
  avatar:   { type: String, default: null },
  createdAt:{ type: Date, default: Date.now },
});

/* ─── Friendship ─── */
const friendshipSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});
// уникальная пара — нельзя дублировать запросы
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

/* ─── Lobby Message ─── */
const messageSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  username: { type: String, required: true },
  avatar:   { type: String, default: null },
  text:     { type: String, required: true, maxlength: 500 },
  sentAt:   { type: Date, default: Date.now },
}, { _id: false });

/* ─── Lobby Member ─── */
const memberSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  username: { type: String, required: true },
  avatar:   { type: String, default: null },
  isReady:  { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

/* ─── Sync State ─── */
const syncStateSchema = new mongoose.Schema({
  source:  { type: String, default: "vidlink" },
  season:  { type: Number, default: null },
  episode: { type: Number, default: null },
  // Для защиты от рассинхрона: время на сервере, когда host нажал play
  playedAt:     { type: Number, default: null }, // Date.now() ms
  position:     { type: Number, default: 0 },    // секунды
  isPlaying:    { type: Boolean, default: false },
  isPaused:     { type: Boolean, default: false },
}, { _id: false });

/* ─── Lobby ─── */
const lobbySchema = new mongoose.Schema({
  code:       { type: String, required: true, unique: true, uppercase: true, trim: true },
  isPrivate:  { type: Boolean, default: false },
  hostId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mode:       { type: String, enum: ["movie", "screencast"], default: "movie" },
  movieId:    { type: Number, default: null },
  movieType:  { type: String, enum: ["movie", "tv"], default: "movie" },
  movieTitle: { type: String, default: null },
  moviePoster:{ type: String, default: null },
  members:    { type: [memberSchema], default: [] },
  messages:   { type: [messageSchema], default: [] },
  sync:       { type: syncStateSchema, default: () => ({}) },
  createdAt:  { type: Date, default: Date.now },
  // Лобби живёт 6 часов
  expiresAt:  { type: Date, default: () => new Date(Date.now() + 6 * 60 * 60 * 1000) },
});
lobbySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const User       = mongoose.models.User       || mongoose.model("User", userSchema);
export const Friendship = mongoose.models.Friendship || mongoose.model("Friendship", friendshipSchema);
export const Lobby      = mongoose.models.Lobby      || mongoose.model("Lobby", lobbySchema);
