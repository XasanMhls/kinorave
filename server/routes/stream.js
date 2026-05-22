import express from "express";
import { MOVIES } from "@consumet/extensions";

const router = express.Router();

const flixhq = new MOVIES.FlixHQ();

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.value;
}
function cacheSet(key, value) {
  cache.set(key, { value, ts: Date.now() });
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

async function getTmdbTitle(tmdbId, type) {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;
  const url = type === "tv"
    ? `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${key}`
    : `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${key}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const d = await res.json();
    return d.title || d.name || null;
  } catch { return null; }
}

// GET /api/stream?tmdbId=&type=movie|tv&season=&episode=
router.get("/", async (req, res) => {
  const { tmdbId, type = "movie", season = "1", episode = "1" } = req.query;
  if (!tmdbId) return res.status(400).json({ error: "tmdbId required" });

  const cacheKey = `${tmdbId}-${type}-${season}-${episode}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const title = await getTmdbTitle(tmdbId, type);
    if (!title) return res.json({ sources: [], subtitles: [] });

    // Total budget: 8 seconds for the whole scraping process
    const searchResult = await withTimeout(flixhq.search(title), 8000);
    if (!searchResult.results?.length) return res.json({ sources: [], subtitles: [] });

    const targetType = type === "tv" ? "TV Series" : "Movie";
    const titleLow = title.toLowerCase();
    const match =
      searchResult.results.find(r =>
        r.type === targetType &&
        (r.title || "").toLowerCase() === titleLow
      ) ||
      searchResult.results.find(r => r.type === targetType) ||
      searchResult.results[0];

    const info = await withTimeout(flixhq.fetchMediaInfo(match.id), 8000);
    if (!info?.episodes?.length) return res.json({ sources: [], subtitles: [] });

    let ep = info.episodes[0];
    if (type === "tv") {
      const s = parseInt(season, 10) || 1;
      const e = parseInt(episode, 10) || 1;
      const found = info.episodes.find(x => x.season === s && x.number === e);
      if (found) ep = found;
    }

    let streamData;
    try {
      streamData = await withTimeout(flixhq.fetchEpisodeSources(ep.id, match.id, "vidcloud"), 8000);
    } catch {
      streamData = await withTimeout(flixhq.fetchEpisodeSources(ep.id, match.id), 8000);
    }

    const sources = (streamData.sources || []).map(s => ({
      url: s.url,
      quality: s.quality || "auto",
      isHLS: s.isM3U8 ?? Boolean(s.url?.includes(".m3u8")),
    }));

    const result = { sources, subtitles: streamData.subtitles || [] };
    cacheSet(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error("[stream] error:", err.message);
    res.json({ sources: [], subtitles: [] });
  }
});

export default router;
