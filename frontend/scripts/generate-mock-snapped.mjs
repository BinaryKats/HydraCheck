// Precompute the full 750+7 snapped mock dataset ONCE.
// Run:  node scripts/generate-mock-snapped.mjs
// Reads the 120 MB Overpass road dataset (scripts/data/delhi-roads.json),
// snaps every generated hotspot to the nearest road, computes bearing,
// and writes a small (~200 KB) locations-snapped.json that the web app
// imports at runtime. The heavy road data never enters the frontend bundle.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildRoadIndex, snapToNearestRoad, computeSegmentBearing,
  roadStubGeometry, haversineKm,
} from '../src/utils/geo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ── Mulberry32 seeded RNG (mirrors src/utils/seededRNG.ts) ──────────────

class SeededRandom {
  constructor(seed) {
    this.state = seed === 0 ? 123456789 : (seed & 0xFFFFFFFF)
  }
  #next() {
    let s = this.state; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; this.state = s; return s >>> 0
  }
  random() { return this.#next() / 0xFFFFFFFF }
}
const MOCK_DATA_SEED = 26026
function createMockRNG() { return new SeededRandom(MOCK_DATA_SEED) }
function seededRandomIntInRange(rng, min, max) { return Math.floor(rng.random() * (max - min)) + min }

// ── Region anchors (mirrors generateMockData.ts) ────────────────────────

const DELHI_REGIONS = [
  { name: 'Ring Road',           lat: 28.6280, lng: 77.2197, baseRainfall: 22, variation: 8 },
  { name: 'Lodhi Road',          lat: 28.5685, lng: 77.2510, baseRainfall: 18, variation: 6 },
  { name: 'Shahdara',            lat: 28.6425, lng: 77.1725, baseRainfall: 20, variation: 7 },
  { name: 'Paharganj',           lat: 28.6425, lng: 77.1425, baseRainfall: 21, variation: 7 },
  { name: 'Narela',              lat: 28.6825, lng: 77.0925, baseRainfall: 12, variation: 4 },
  { name: 'Rohini',              lat: 28.6825, lng: 77.0925, baseRainfall: 14, variation: 5 },
  { name: 'Dwarka',              lat: 28.5925, lng: 77.0425, baseRainfall: 15, variation: 5 },
  { name: 'Saket',               lat: 28.5225, lng: 77.2025, baseRainfall: 17, variation: 5 },
  { name: 'Khan Market',         lat: 28.6025, lng: 77.2225, baseRainfall: 19, variation: 6 },
  { name: 'Connaught Place',     lat: 28.6325, lng: 77.2125, baseRainfall: 22, variation: 7 },
  { name: 'Tilak Marg',          lat: 28.6125, lng: 77.2325, baseRainfall: 20, variation: 6 },
  { name: 'Lajpat Nagar',        lat: 28.5625, lng: 77.2425, baseRainfall: 18, variation: 6 },
  { name: 'Karol Bagh',          lat: 28.6525, lng: 77.1825, baseRainfall: 20, variation: 7 },
  { name: 'Patparganj',          lat: 28.6325, lng: 77.3025, baseRainfall: 21, variation: 7 },
  { name: 'Mehrauli',            lat: 28.5225, lng: 77.1825, baseRainfall: 16, variation: 5 },
  { name: 'Jamia Millia',        lat: 28.5676, lng: 77.2780, baseRainfall: 20, variation: 7 },
  { name: 'Okhla',               lat: 28.5400, lng: 77.2700, baseRainfall: 19, variation: 7 },
]
const ROAD_TYPES = [
  { type: 'major',     normalSpeed: [40, 70], name: 'Ring Road' },
  { type: 'arterial',  normalSpeed: [30, 50], name: 'GT Road' },
  { type: 'secondary', normalSpeed: [20, 40], name: 'Janpath Road' },
  { type: 'local',     normalSpeed: [20, 35], name: 'Lajpat Nagar Road' },
]

const HOTSPOT_ANCHORS = [
  { id: 'minto-bridge',     lat: 28.6280, lng: 77.2197, ediStatus: 'critical' },
  { id: 'pul-prahladpur',   lat: 28.5097, lng: 77.2510, ediStatus: 'degraded' },
  { id: 'ring-road-who',    lat: 28.5685, lng: 77.2510, ediStatus: 'moderate' },
  { id: 'jahangirpuri',     lat: 28.7253, lng: 77.1700, ediStatus: 'good' },
  { id: 'zakhira-flyover',  lat: 28.6612, lng: 77.1534, ediStatus: 'degraded' },
  { id: 'loni-road',        lat: 28.6945, lng: 77.2800, ediStatus: 'critical' },
  { id: 'karala-kanjhawla', lat: 28.7350, lng: 77.0050, ediStatus: 'degraded' },
]
const STATUS_RISK = { critical: 85, degraded: 65, moderate: 45, low: 25 }

// ── Helpers (mirrors generateMockData.ts) ───────────────────────────────

function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi) }
function clampRisk(s) { return clamp(s, 0, 100) }
function determineRiskLevel(s) {
  if (s < 20) return 'normal'; if (s < 40) return 'low'; if (s < 60) return 'moderate'; if (s < 80) return 'high'; return 'critical'
}
function riskLevelFromScore(s) { return determineRiskLevel(s) }
function r5(v) { return Math.round(v * 100000) / 100000 }
function r2(v) { return Math.round(v * 100) / 100 }
function r1(v) { return Math.round(v * 10) / 10 }

function calculateRiskScore(rng, { rainfall, trafficSlowdown, waterDepth, drainageCondition, historicalVulnerability }) {
  const rainfallRisk = clamp((rainfall / 50) * 30, 0, 30)
  const waterRisk    = clamp((waterDepth / 60) * 25, 0, 25)
  const drainageRisk = drainageCondition === 'good' ? 3 : drainageCondition === 'moderate' ? 8 : drainageCondition === 'poor' ? 14 : 19
  const trafficRisk  = clamp((trafficSlowdown / 80) * 15, 0, 15)
  const historicalRisk = historicalVulnerability * 10
  const base = rainfallRisk + waterRisk + drainageRisk + trafficRisk + historicalRisk
  const compoundMultiplier = drainageCondition === 'good' ? 1.0 : drainageCondition === 'moderate' ? 1.05 : drainageCondition === 'poor' ? 1.15 : 1.30
  const highFactorCount = [rainfallRisk > 12, waterRisk > 10, trafficRisk > 8].filter(Boolean).length
  const compoundingBoost = highFactorCount >= 2 ? highFactorCount * 5 : 0
  const jitter = (rng.random() - 0.5) * 12 + rng.random() * 3
  return clampRisk(base * compoundMultiplier + compoundingBoost + jitter)
}

function calculateWaterDepth(rng, rainfall, dc) {
  const f = dc === 'good' ? 0.6 : dc === 'moderate' ? 1.0 : dc === 'poor' ? 1.8 : 2.5
  return clamp(rainfall * 0.9 * f + (rng.random() - 0.5) * 8, 0, 80)
}
function calculateEDI(rng, dc, depth) {
  const base = dc === 'good' ? 0.85 : dc === 'moderate' ? 0.70 : dc === 'poor' ? 0.45 : 0.20
  return clamp(base - clamp((depth / 80) * 0.3, 0, 0.3) + (rng.random() - 0.5) * 0.1, 0.1, 0.95)
}
function calculateRecoveryTime(rng, edi, depth) {
  return clamp((20 + (1 - edi) * 40) * (depth > 20 ? 1.5 : 1) + (rng.random() - 0.5) * 10, 5, 90)
}
function calculateDuration(rng, rainfall, dc) {
  const f = dc === 'poor' ? 1.8 : dc === 'very-poor' ? 2.2 : 1
  return clamp(30 + (rainfall / 100) * 60 * f + (rng.random() - 0.5) * 15, 10, 180)
}
function getDrainageCondition(rng) {
  const r = rng.random()
  return r < 0.3 ? 'good' : r < 0.75 ? 'moderate' : r < 0.95 ? 'poor' : 'very-poor'
}
function getEDIStatus(edi) {
  if (edi >= 0.8) return 'good'; if (edi >= 0.6) return 'moderate'; if (edi >= 0.4) return 'degraded'; return 'critical'
}
function getDrainageTrend(rng) {
  const r = rng.random(); return r < 0.3 ? 'worsening' : r < 0.7 ? 'stable' : 'improving'
}
function generateLocationName(rng, region, road, idx) {
  const prefixes = ['Near', 'Approach', 'Stretch', 'Segment', 'Crossing', 'Turn']
  const suffixes = ['North', 'South', 'East', 'West', 'Central']
  return `${region} – ${prefixes[idx % prefixes.length]} ${suffixes[seededRandomIntInRange(rng, 0, suffixes.length)]}`
}
function generateAlternateRoutes(rng, region) {
  return [`Via ${region} Ring Road (+${seededRandomIntInRange(rng, 5, 20)} min)`,
          `Via ${region} Outer Ring Road (+${seededRandomIntInRange(rng, 10, 30)} min)`]
}
function getWaterDepthLabel(d) { return d > 40 ? 'Waist+' : d > 20 ? 'Knee' : d > 5 ? 'Ankle' : 'None' }

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[mock] Generating snapped dataset (seed ${MOCK_DATA_SEED})...`)

  // Load road dataset (split into two parts to stay under GitHub's 100 MB file limit)
  const part1Path = path.join(ROOT, 'scripts', 'data', 'delhi-roads.part1.json')
  const part2Path = path.join(ROOT, 'scripts', 'data', 'delhi-roads.part2.json')
  console.log('[mock] Loading roads from delhi-roads.part1.json + delhi-roads.part2.json...')
  const [raw1, raw2] = await Promise.all([readFile(part1Path, 'utf8'), readFile(part2Path, 'utf8')])
  const roadData = {
    ...JSON.parse(raw1),
    roads: [...JSON.parse(raw1).roads, ...JSON.parse(raw2).roads],
  }
  console.log(`[mock] Loaded ${roadData.roads.length} roads, building spatial index...`)
  const index = buildRoadIndex(roadData.roads)
  console.log(`[mock] Spatial index built (${index.grid.size} cells).`)

  const rng = createMockRNG()
  const locations = []

  // ── Generate 800 synthetic locations (same logic as generateMockData.ts) ──
  let unsnapped = 0
  for (let i = 0; i < 800; i++) {
    const regionIndex = seededRandomIntInRange(rng, 0, DELHI_REGIONS.length)
    const region = DELHI_REGIONS[regionIndex]
    const roadType = ROAD_TYPES[seededRandomIntInRange(rng, 0, ROAD_TYPES.length)]

    // Random candidate, then snap to nearest road
    const candidateLat = region.lat + (rng.random() - 0.5) * 0.05
    const candidateLng = region.lng + (rng.random() - 0.5) * 0.05
    // Snap to nearest road; widen the radius generously so almost every
    // hotspot lands on a road rather than being dropped arbitrarily.
    const snap = snapToNearestRoad(candidateLat, candidateLng, index, 600)

    const lat = snap ? snap.lat : candidateLat
    const lng = snap ? snap.lng : candidateLng
    const bearing = snap ? snap.bearing : null
    if (!snap) unsnapped++

    const rainfallIntensity = clamp(region.baseRainfall + (rng.random() - 0.5) * region.variation * 2, 0, 100)
    const normalSpeed = roadType.normalSpeed[0] + rng.random() * (roadType.normalSpeed[1] - roadType.normalSpeed[0])
    const trafficSlowdown = rainfallIntensity > 15 ? (rng.random() * 30 + 10) : (rng.random() * 15)
    const currentSpeed = normalSpeed * (1 - trafficSlowdown / 100)
    const drainageCondition = getDrainageCondition(rng)
    const waterDepth = calculateWaterDepth(rng, rainfallIntensity, drainageCondition)
    const historicalVulnerability = 0.2 + rng.random() * 0.8
    const riskScore = calculateRiskScore(rng, { rainfall: rainfallIntensity, trafficSlowdown, waterDepth, drainageCondition, historicalVulnerability })
    const ediValue = calculateEDI(rng, drainageCondition, waterDepth)
    const recoveryTime = calculateRecoveryTime(rng, ediValue, waterDepth)
    const onsetMinutes = riskScore > 60 ? seededRandomIntInRange(rng, 10, 30) : null
    const durationMinutes = calculateDuration(rng, rainfallIntensity, drainageCondition)

    locations.push({
      id: `LOC-${String(i + 1).padStart(3, '0')}`,
      name: generateLocationName(rng, region.name, roadType.name, i),
      roadName: roadType.name,
      locality: region.name,
      district: 'Delhi',
      latitude: r5(lat),
      longitude: r5(lng),
      riskScore: clampRisk(riskScore),
      riskLevel: determineRiskLevel(riskScore),
      rainfallIntensity: r1(rainfallIntensity),
      accumulatedRainfall: r1(rainfallIntensity * (2 + rng.random() * 3)),
      trafficSpeed: r1(currentSpeed),
      normalTrafficSpeed: r1(normalSpeed),
      trafficSlowdownPercent: Math.round(trafficSlowdown),
      waterDepthCm: r1(waterDepth),
      drainageCondition,
      predictedOnsetMinutes: onsetMinutes,
      predictedDurationMinutes: Math.round(durationMinutes),
      historicalWaterloggingFrequency: seededRandomIntInRange(rng, 0, 10),
      confidenceScore: 60 + seededRandomIntInRange(rng, 30),
      lastUpdated: new Date().toISOString(),
      isChronic: seededRandomIntInRange(rng, 0, 10) > 8,
      ediValue: r2(ediValue),
      ediStatus: getEDIStatus(ediValue),
      recoveryTimeMinutes: Math.round(recoveryTime),
      drainageTrend: getDrainageTrend(rng),
      alternateRoutes: generateAlternateRoutes(rng, region.name),
      metadata: {
        rainfallIntensityMmhr: rainfallIntensity.toFixed(1),
        trafficSlowdownPercent: Math.round(trafficSlowdown),
        waterDepthExpected: getWaterDepthLabel(waterDepth),
      },
      // Road-snap metadata
      roadBearing: bearing != null ? r2(bearing) : null,
      snappedToRoad: snap != null,
      snapDistanceM: snap ? Math.round(snap.distanceM) : null,
      roadId: snap?.roadId ?? null,
      roadNameOSM: snap?.roadName ?? null,
      highwayType: snap?.highway ?? null,
    })
  }

  // ── Original 7 hotspots (always use real road-segment geometry) ──
  for (const h of HOTSPOT_ANCHORS) {
    const riskScore = STATUS_RISK[h.ediStatus]
    // Compute bearing from nearby road
    const snap = snapToNearestRoad(h.lat, h.lng, index, 500)
    locations.push({
      id: h.id,
      name: h.id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
      roadName: '',
      locality: h.id,
      district: 'Delhi',
      latitude: h.lat,
      longitude: h.lng,
      riskScore,
      riskLevel: riskLevelFromScore(riskScore),
      rainfallIntensity: 22,
      accumulatedRainfall: 45,
      trafficSpeed: 35,
      normalTrafficSpeed: 55,
      trafficSlowdownPercent: 36,
      waterDepthCm: 20,
      drainageCondition: h.ediStatus === 'critical' ? 'very-poor' : h.ediStatus === 'degraded' ? 'poor' : h.ediStatus === 'moderate' ? 'moderate' : 'good',
      predictedOnsetMinutes: h.ediStatus === 'critical' ? 10 : h.ediStatus === 'degraded' ? 15 : null,
      predictedDurationMinutes: h.ediStatus === 'critical' ? 90 : 45,
      historicalWaterloggingFrequency: 5,
      confidenceScore: 92,
      lastUpdated: new Date().toISOString(),
      isChronic: true,
      ediValue: 0.85,
      ediStatus: h.ediStatus,
      recoveryTimeMinutes: 45,
      drainageTrend: 'worsening',
      alternateRoutes: [],
      metadata: { rainfallIntensityMmhr: '22.0', trafficSlowdownPercent: 36, waterDepthExpected: 'Knee' },
      roadBearing: snap ? r2(snap.bearing) : null,
      snappedToRoad: snap != null,
      snapDistanceM: snap ? Math.round(snap.distanceM) : null,
      roadId: snap?.roadId ?? null,
      roadNameOSM: snap?.roadName ?? null,
      highwayType: snap?.highway ?? null,
    })
  }

  console.log(`[mock] ${locations.length} locations (${unsnapped} unsnapped, ${locations.length - unsnapped} snapped)`)

  // ── Write output ──
  const outDir = path.join(ROOT, 'src', 'data', 'mock')
  await mkdir(outDir, { recursive: true })
  const outPath = path.join(outDir, 'locations-snapped.json')
  await writeFile(outPath, JSON.stringify(locations, null, 2) + '\n', 'utf8')
  const sizeKB = Math.round((await readFile(outPath, 'utf8')).length / 1024)
  console.log(`[mock] Wrote ${outPath.replace(ROOT + '/', '')} (${sizeKB} KB)`)

  // Distribution
  const dist = { normal: 0, low: 0, moderate: 0, high: 0, critical: 0 }
  for (const l of locations) dist[l.riskLevel]++
  console.log('[mock] Distribution:', Object.entries(dist).map(([k, v]) => `${k}: ${v}`).join('  '))
}

main().catch(err => { console.error('[mock] FATAL:', err); process.exit(1) })
