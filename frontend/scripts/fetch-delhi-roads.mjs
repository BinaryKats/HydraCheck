// One-off script: fetch Delhi drivable road geometry from Overpass and save it
// as two split files (part1 + part2) so the mock generator can import it directly.
// Split files stay under GitHub's 100 MB per-file limit.
// Run:  node scripts/fetch-delhi-roads.mjs
// Uses Node 18+ built-in fetch; --dns-result-order=ipv4first helps on some networks.

import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// Overpass endpoints with fallbacks
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

// Drivable highways + living streets/unclassified; excludes footway/path/cycleway/steps etc.
const OVERPASS_QUERY = `
[out:json][timeout:260];
(
  way
    ["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|living_street|road)$"]
    ["area"!~"yes"]
    (28.40,76.85,28.90,77.45);
);
out geom;
` .trim()

async function fetchRoads() {
  let lastError
  for (const endpoint of ENDPOINTS) {
    try {
      console.log('[roads] fetching', endpoint)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'sih26-delhi-waterlogging/1.0 (SIH 2026 mock data road-snap)',
          Accept: 'application/json',
        },
        body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status} ${text.slice(0, 900) || res.statusText}`)
      }
      const json = await res.json()
      if (Array.isArray(json.elements) && json.elements.length >= 500) {
        console.log(`[roads] got ${json.elements.length} ways from ${endpoint}`)
        return json
      }
      throw new Error(`too few ways (${json.elements?.length ?? 0})`)
    } catch (err) {
      lastError = err
      console.warn('[roads] from', endpoint, 'failed:', err.message)
    }
  }
  throw new Error(`all Overpass endpoints failed. Last: ${lastError?.message}`)
}

// Cap each road to MAX_COORDS so the slim file stays small. Long residential
// "urban sprawl" ways are most aggressively truncated — they only need a
// single segment near the candidate to snap against; the full shape is extra.
const MAX_COORDS = { motorway: 600, trunk: 600, primary: 500, secondary: 300, tertiary: 150, unclassified: 100, living_street: 60, residential: 18, service: 10 }

function truncateCoords(coords, max) {
  if (coords.length <= max) return coords
  const stride = Math.ceil(coords.length / max)
  const out = []
  for (let i = 0; i < coords.length; i += stride) out.push(coords[i])
  if (out[out.length - 1] !== coords[coords.length - 1]) out.push(coords[coords.length - 1])
  return out
}

async function buildRoadDataset() {
  console.log('[roads] Delhi bbox: 28.40-28.90 N, 76.85-77.45 E')
  const json = await fetchRoads()

  const roads = []
  for (const el of json.elements ?? []) {
    if (el.type !== 'way' || !Array.isArray(el.geometry) || el.geometry.length < 2) continue
    const coords = el.geometry.map((pt) => [pt.lat, pt.lon])
    const highway = el.tags?.highway || ''
    const cap = MAX_COORDS[highway] ?? 30
    const trimmed = truncateCoords(coords, cap)
    roads.push({
      id: el.id,
      name: el.tags?.name || el.tags?.ref || '',
      highway,
      coords: trimmed,
    })
  }

  if (roads.length < 300) {
    throw new Error(`unexpected tiny dataset: ${roads.length} roads`)
  }

  // Write split files so each stays well under GitHub's 100 MB limit.
  const mid = Math.ceil(roads.length / 2)
  const mkPayload = (slice, part) => ({
    bbox: { minLat: 28.40, minLng: 76.85, maxLat: 28.90, maxLng: 77.45 },
    count: slice.length,
    generatedAt: new Date().toISOString(),
    part,
    totalParts: 2,
    roads: slice,
  })
  const part1Path = path.join(ROOT, 'scripts', 'data', 'delhi-roads.part1.json')
  const part2Path = path.join(ROOT, 'scripts', 'data', 'delhi-roads.part2.json')
  await writeFile(part1Path, JSON.stringify(mkPayload(roads.slice(0, mid), 1), null, 2) + '\n', 'utf8')
  await writeFile(part2Path, JSON.stringify(mkPayload(roads.slice(mid), 2), null, 2) + '\n', 'utf8')
  const byHighway = {}
  for (const r of roads) byHighway[r.highway] = (byHighway[r.highway] || 0) + 1
  console.log(`[roads] wrote ${roads.length} roads -> delhi-roads.part1.json + delhi-roads.part2.json (${path.relative(ROOT, 'scripts/data')})`)
  console.log('[roads] by highway:', Object.entries(byHighway).map(([k, v]) => `${k}:${v}`).join('  '))

  // Slim variant for app import. Major ways kept whole; minor ways sampled
  // and truncated to keep the JSON under ~5 MB. Coordinate precision is
  // 5 decimals (~1m at Delhi) which is enough for road snapping.
  const KEEP_FULL = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary'])
  const KEEP_RATIO = { unclassified: 0.2, residential: 0.005, service: 0.002, living_street: 0 }
  const r5 = (v) => Math.round(v * 100000) / 100000
  const slim = []
  for (let i = 0; i < roads.length; i++) {
    const r = roads[i]
    const keepFull = KEEP_FULL.has(r.highway)
    const ratio = KEEP_RATIO[r.highway] || 0
    if (!keepFull && ratio === 0) continue
    if (!keepFull && (i % Math.max(1, Math.round(1 / ratio)) !== 0)) continue
    slim.push({
      id: r.id,
      highway: r.highway,
      ...(r.name ? { name: r.name } : {}),
      coords: r.coords.map(([lat, lng]) => [r5(lat), r5(lng)]),
    })
  }
  const slimPayload = {
    bbox: payload.bbox,
    count: slim.length,
    roads: slim,
  }
  const slimPath = path.join(ROOT, 'src', 'data', 'delhi-roads-slim.json')
  await writeFile(slimPath, JSON.stringify(slimPayload, null, 2) + '\n', 'utf8')
  const slimByHighway = {}
  for (const r of slim) slimByHighway[r.highway] = (slimByHighway[r.highway] || 0) + 1
  console.log(`[roads] wrote ${slim.length} roads (slim) -> ${path.relative(ROOT, slimPath)}`)
  console.log('[roads] slim by highway:', Object.entries(slimByHighway).map(([k, v]) => `${k}:${v}`).join('  '))
}

buildRoadDataset().catch((err) => {
  console.error('[roads] fatal:', err.stack || err.message)
  process.exit(1)
})
