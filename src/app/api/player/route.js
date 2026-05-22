import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MEDIA_MIME_TYPES = new Set([
  "application/x-mpegurl",
  "application/vnd.apple.mpegurl",
  "video/mp4",
  "video/webm",
  "video/ogg",
]);

const EMBED_PROVIDERS = [
  {
    id: "vidlink",
    label: "VidLink",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv" && season && episode
        ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=B9FF66&secondaryColor=06060a&iconColor=B9FF66&icons=vid&title=true&poster=true`
        : `https://vidlink.pro/movie/${tmdbId}?primaryColor=B9FF66&secondaryColor=06060a&iconColor=B9FF66&icons=vid&title=true&poster=true`,
  },
  {
    id: "vidsrc-icu",
    label: "VidSrc",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv" && season && episode
        ? `https://vidsrc.icu/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.icu/embed/movie/${tmdbId}`,
  },
  {
    id: "embedsu",
    label: "EmbedSu",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv" && season && episode
        ? `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://embed.su/embed/movie/${tmdbId}`,
  },
  {
    id: "2embed",
    label: "2Embed",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv" && season && episode
        ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${tmdbId}`,
  },
  {
    id: "autoembed",
    label: "AutoEmbed",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv" && season && episode
        ? `https://autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://autoembed.cc/embed/movie/${tmdbId}`,
  },
  {
    id: "multiembed",
    label: "MultiEmbed",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv" && season && episode
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
  },
  {
    id: "vidsrc-to",
    label: "VidSrc.to",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv" && season && episode
        ? `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.to/embed/movie/${tmdbId}`,
  },
];

function ensureHttpUrl(value) {
  if (!value || typeof value !== "string") return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function inferMimeType(url, explicitType) {
  const normalized = String(explicitType || "").toLowerCase();
  if (MEDIA_MIME_TYPES.has(normalized)) return normalized;

  if (url.endsWith(".m3u8")) return "application/x-mpegurl";
  if (url.endsWith(".mp4")) return "video/mp4";
  if (url.endsWith(".webm")) return "video/webm";
  if (url.endsWith(".ogv") || url.endsWith(".ogg")) return "video/ogg";

  return normalized || null;
}

function normalizeMediaSource(entry, index) {
  if (!entry) return null;

  const url = ensureHttpUrl(entry.url || entry.src || entry.file || entry.stream || entry.manifest);
  if (!url) return null;

  const mimeType = inferMimeType(url, entry.type || entry.mimeType || entry.mime);
  if (!mimeType || !MEDIA_MIME_TYPES.has(mimeType)) return null;

  return {
    id: String(entry.id || entry.quality || entry.label || `media-${index}`),
    kind: "media",
    label: entry.label || entry.quality || `Source ${index + 1}`,
    quality: entry.quality || null,
    mimeType,
    url,
    headers: entry.headers && typeof entry.headers === "object" ? entry.headers : null,
  };
}

function dedupeById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

async function resolveUpstreamSources({ tmdbId, type, season, episode }) {
  const endpoint = process.env.STREAM_API_URL || process.env.PLAYER_API_URL;
  if (!endpoint) return [];

  const url = new URL(endpoint);
  url.searchParams.set("tmdbId", String(tmdbId));
  url.searchParams.set("type", type);
  if (season) url.searchParams.set("season", String(season));
  if (episode) url.searchParams.set("episode", String(episode));

  const headers = { Accept: "application/json" };
  if (process.env.STREAM_API_KEY) {
    headers.Authorization = `Bearer ${process.env.STREAM_API_KEY}`;
  }

  const response = await fetch(url, {
    headers,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  const rawSources =
    payload.sources ||
    payload.streams ||
    payload.mediaSources ||
    payload.data?.sources ||
    payload.data?.streams ||
    [];

  return dedupeById(rawSources.map(normalizeMediaSource).filter(Boolean));
}

function getFallbackMediaSources() {
  const candidates = [
    {
      id: "fallback-hls",
      label: "Fallback HLS",
      url: process.env.PLAYER_FALLBACK_HLS_URL,
      mimeType: "application/x-mpegurl",
    },
    {
      id: "fallback-mp4",
      label: "Fallback MP4",
      url: process.env.PLAYER_FALLBACK_MP4_URL || process.env.NEXT_PUBLIC_DEMO_STREAM_URL,
      mimeType: "video/mp4",
    },
  ];

  return dedupeById(candidates.map(normalizeMediaSource).filter(Boolean));
}

function buildEmbedSources({ tmdbId, type, season, episode }) {
  return EMBED_PROVIDERS.map((provider) => ({
    id: provider.id,
    kind: "embed",
    label: provider.label,
    url: provider.build({ tmdbId, type, season, episode }),
  })).filter((provider) => provider.url);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tmdbId = Number(searchParams.get("tmdbId"));
  const type = searchParams.get("type") === "tv" ? "tv" : "movie";
  const season = Number(searchParams.get("season")) || null;
  const episode = Number(searchParams.get("episode")) || null;

  if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: "Valid tmdbId is required" }, { status: 400 });
  }

  try {
    const [upstreamSources, fallbackSources] = await Promise.all([
      resolveUpstreamSources({ tmdbId, type, season, episode }),
      Promise.resolve(getFallbackMediaSources()),
    ]);

    const mediaSources = dedupeById([...upstreamSources, ...fallbackSources]);
    const embedSources = buildEmbedSources({ tmdbId, type, season, episode });
    const preferredSourceId = mediaSources[0]?.id || embedSources[0]?.id || null;

    return NextResponse.json({
      mediaSources,
      embedSources,
      preferredSourceId,
      diagnostics: {
        hasUpstreamStreamApi: Boolean(process.env.STREAM_API_URL || process.env.PLAYER_API_URL),
        mediaCount: mediaSources.length,
        embedCount: embedSources.length,
      },
    });
  } catch {
    return NextResponse.json(
      {
        mediaSources: getFallbackMediaSources(),
        embedSources: buildEmbedSources({ tmdbId, type, season, episode }),
        preferredSourceId: null,
        diagnostics: {
          hasUpstreamStreamApi: Boolean(process.env.STREAM_API_URL || process.env.PLAYER_API_URL),
          mediaCount: 0,
          embedCount: EMBED_PROVIDERS.length,
        },
      },
      { status: 200 }
    );
  }
}
