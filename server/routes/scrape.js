import { Router } from 'express'
import puppeteer from 'puppeteer'

const router = Router()

// Cache scraped URLs for 30 minutes
const cache = new Map()
const CACHE_TTL = 30 * 60 * 1000

function cacheGet(key) {
  const e = cache.get(key)
  if (!e || Date.now() - e.ts > CACHE_TTL) { cache.delete(key); return null }
  return e.value
}
function cacheSet(key, val) { cache.set(key, { value: val, ts: Date.now() }) }

// Providers to try in order
function getProviderUrls(tmdbId, type, season, episode) {
  if (type === 'tv') {
    return [
      `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,
      `https://vidsrc.pm/embed/tv/${tmdbId}/${season}/${episode}`,
      `https://player.vidsrc.co/embed/tv/${tmdbId}/${season}/${episode}`,
      `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
    ]
  }
  return [
    `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`,
    `https://vidsrc.pm/embed/movie/${tmdbId}`,
    `https://player.vidsrc.co/embed/movie/${tmdbId}`,
    `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
  ]
}

async function scrapeStream(providerUrl, timeoutMs = 20000) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--autoplay-policy=no-user-gesture-required',
    ],
  })

  try {
    const page = await browser.newPage()

    // Block ads/trackers to speed up loading
    await page.setRequestInterception(true)
    const streamUrls = []

    page.on('request', (req) => {
      const url = req.url()
      const resourceType = req.resourceType()

      // Capture m3u8 and mp4 stream URLs
      if (url.includes('.m3u8') || url.includes('.mp4') || url.includes('playlist')) {
        streamUrls.push(url)
      }

      // Block ads to speed up
      if (resourceType === 'image' || url.includes('doubleclick') || url.includes('googletagmanager')) {
        req.abort()
      } else {
        req.continue()
      }
    })

    page.on('response', async (res) => {
      const url = res.url()
      if (url.includes('.m3u8') || (url.includes('playlist') && res.headers()['content-type']?.includes('mpegurl'))) {
        if (!streamUrls.includes(url)) streamUrls.push(url)
      }
    })

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    await Promise.race([
      page.goto(providerUrl, { waitUntil: 'networkidle0', timeout: timeoutMs }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]).catch(() => {})

    // Wait a bit more for lazy-loaded streams
    await new Promise(r => setTimeout(r, 3000))

    // Also check page content for stream URLs
    const pageContent = await page.content()
    const m3u8Matches = pageContent.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/g) || []
    m3u8Matches.forEach(u => { if (!streamUrls.includes(u)) streamUrls.push(u) })

    return streamUrls.filter(u => u && u.startsWith('http'))
  } finally {
    await browser.close()
  }
}

// GET /api/scrape?tmdbId=550&type=movie&season=1&episode=1
router.get('/', async (req, res) => {
  const { tmdbId, type = 'movie', season = '1', episode = '1' } = req.query
  if (!tmdbId) return res.status(400).json({ error: 'tmdbId required' })

  const cacheKey = `${tmdbId}-${type}-${season}-${episode}`
  const cached = cacheGet(cacheKey)
  if (cached) {
    console.log(`[scrape] cache hit for ${cacheKey}`)
    return res.json(cached)
  }

  const providers = getProviderUrls(tmdbId, type, season, episode)
  console.log(`[scrape] starting for tmdb:${tmdbId} type:${type}`)

  for (const providerUrl of providers) {
    try {
      console.log(`[scrape] trying: ${providerUrl}`)
      const streams = await scrapeStream(providerUrl, 25000)
      console.log(`[scrape] found ${streams.length} streams`)

      if (streams.length > 0) {
        const result = {
          sources: streams.map((url, i) => ({
            url,
            quality: i === 0 ? 'auto' : `source${i}`,
            isHLS: url.includes('.m3u8'),
          })),
          provider: providerUrl,
        }
        cacheSet(cacheKey, result)
        return res.json(result)
      }
    } catch (err) {
      console.log(`[scrape] error on ${providerUrl}:`, err.message)
    }
  }

  console.log(`[scrape] all providers failed for ${cacheKey}`)
  res.json({ sources: [] })
})

export default router
