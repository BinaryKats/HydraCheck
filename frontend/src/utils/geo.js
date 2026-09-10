// Geographic helpers for road-based hotspot placement.
// SIH 2026 - All math runs in a local metre approximation around Delhi
// (converting lon to scaled-x), which is accurate enough at city scale and
// keeps the projection logic simple. Units are degrees (lat/lng) in, metres
// where noted, bearing in degrees clockwise from north (0-360).

const RADIUS_KM = 6371.0
const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI
// Degrees of longitude shrink by cos(lat); Delhi ~28.6N.
const BASE_LAT = 28.61

function toRad(deg) { return deg * DEG2RAD }
function toDeg(rad) { return rad * RAD2DEG }
function cosLat(lat) { return Math.cos(toRad(lat)) }

/** Great-circle distance between two [lat, lng] points, in metres. */
export function haversineKm(aLat, aLng, bLat, bLng) {
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * RADIUS_KM * Math.asin(Math.sqrt(a))
}

// Convert a point to local "metres" (x east, y north) around BASE_LAT.
function toMeters(lat, lng) {
  const mPerDegLat = 111320
  const mPerDegLng = 111320 * cosLat(BASE_LAT)
  return {
    x: (lng - 0) * mPerDegLng, // offset arbitrary; only deltas matter
    y: (lat - 0) * mPerDegLat,
    mPerDegLat,
    mPerDegLng,
  }
}
function fromMeters(x, y, mPerDegLat, mPerDegLng) {
  return { lat: y / mPerDegLat, lng: x / mPerDegLng }
}

/**
 * Project point p onto segment (a, b) in local metre space.
 * Returns { point: {lat,lng}, distanceM, t } — distance in metres.
 */
export function projectPointToSegment(pLat, pLng, aLat, aLng, bLat, bLng) {
  const p = toMeters(pLat, pLng)
  const a = toMeters(aLat, aLng)
  const b = toMeters(bLat, bLng)
  const abx = b.x - a.x
  const aby = b.y - a.y
  const len2 = abx * abx + aby * aby
  let t = 0
  if (len2 > 0) {
    t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2
    t = Math.max(0, Math.min(1, t))
  }
  const cx = a.x + t * abx
  const cy = a.y + t * aby
  const { lat, lng } = fromMeters(cx, cy, p.mPerDegLat, p.mPerDegLng)
  const dx = p.x - cx
  const dy = p.y - cy
  return { lat, lng, distanceM: Math.hypot(dx, dy), t }
}

/**
 * Initial bearing (degrees clockwise from north, 0-360) from point A to B.
 */
export function bearingBetween(aLat, aLng, bLat, bLng) {
  const φ1 = toRad(aLat)
  const φ2 = toRad(bLat)
  const Δλ = toRad(bLng - aLng)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/**
 * Road dataset format:
 * { roads: [ { id, name, highway, coords: [[lat,lng],...] } ] }
 * Build a grid spatial index so nearest-road lookups stay cheap for the
 * whole (750) dataset.
 */
export function buildRoadIndex(roads) {
  const grid = new Map() // "col:row" -> array of {road, segIndex, a, b}
  const CELL_DEG = 0.02 // ~2.2 km buckets; each segment indexed once
  const key = (c, r) => `${c}:${r}`
  for (const road of roads) {
    const coords = road.coords
    if (!Array.isArray(coords) || coords.length < 2) continue
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i]
      const b = coords[i + 1]
      // Index the segment in every cell its bounding box touches.
      const c0 = Math.floor(Math.min(a[1], b[1]) / CELL_DEG)
      const c1 = Math.floor(Math.max(a[1], b[1]) / CELL_DEG)
      const r0 = Math.floor(Math.min(a[0], b[0]) / CELL_DEG)
      const r1 = Math.floor(Math.max(a[0], b[0]) / CELL_DEG)
      for (let c = c0; c <= c1; c++) {
        for (let r = r0; r <= r1; r++) {
          const k = key(c, r)
          if (!grid.has(k)) grid.set(k, [])
          grid.get(k).push({ road, segIndex: i, a, b })
        }
      }
    }
  }
  return { roads, grid, CELL_DEG, key }
}

/**
 * Snap a candidate point to the nearest valid road segment.
 *
 * @param {number} lat, lng - candidate (degrees)
 * @param {object} index - result of buildRoadIndex(roads)
 * @param {number} maxM - max snapping distance in metres (default 250)
 * @returns {null | { lat, lng, distanceM, bearing, roadId, roadName, highway }}
 */
export function snapToNearestRoad(lat, lng, index, maxM = 250) {
  if (!index) return null
  const { grid, CELL_DEG, key } = index

  const cells = 1 // neighbourhood radius in cells around the candidate
  const c0 = Math.floor((lng - CELL_DEG) / CELL_DEG) - cells
  const c1 = Math.floor((lng + CELL_DEG) / CELL_DEG) + cells
  const r0 = Math.floor((lat - CELL_DEG) / CELL_DEG) - cells
  const r1 = Math.floor((lat + CELL_DEG) / CELL_DEG) + cells

  let best = null
  let bestDist = maxM
  for (let c = c0; c <= c1; c++) {
    for (let r = r0; r <= r1; r++) {
      const segs = grid.get(key(c, r))
      if (!segs) continue
      for (const s of segs) {
        const proj = projectPointToSegment(lat, lng, s.a[0], s.a[1], s.b[0], s.b[1])
        if (proj.distanceM <= bestDist) {
          bestDist = proj.distanceM
          best = {
            lat: proj.lat,
            lng: proj.lng,
            distanceM: proj.distanceM,
            bearing: bearingBetween(s.a[0], s.a[1], s.b[0], s.b[1]),
            roadId: s.road.id,
            roadName: s.road.name || '',
            highway: s.road.highway || '',
          }
        }
      }
    }
  }
  return best
}

/**
 * Compute a stable road bearing at a point on a road polyline, using the
 * segment the point is closest to (ties broken by longer segment).
 */
export function computeSegmentBearing(coords, lat, lng) {
  if (!Array.isArray(coords) || coords.length < 2) return null
  let bestBearing = null
  let bestDist = Infinity
  let bestLen = -1
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i]
    const b = coords[i + 1]
    const proj = projectPointToSegment(lat, lng, a[0], a[1], b[0], b[1])
    const len = haversineKm(a[0], a[1], b[0], b[1])
    if (proj.distanceM < bestDist - 1 || (Math.abs(proj.distanceM - bestDist) <= 1 && len > bestLen)) {
      bestDist = proj.distanceM
      bestLen = len
      bestBearing = bearingBetween(a[0], a[1], b[0], b[1])
    }
  }
  return bestBearing
}

/**
 * Build the 3-point synthetic stub geometry for a hotspot, oriented along
 * `bearing`. `segLenM` is the total segment length (both halves).
 * Returns null if no valid center exists.
 */
export function roadStubGeometry(lat, lng, bearing, segLenM = 80) {
  if (lat == null || lng == null) return null
  const half = segLenM / 2
  const mPerDegLat = 111320
  const mPerDegLng = 111320 * cosLat(BASE_LAT)
  const rad = toRad(bearing)
  // offset in metres, forward along bearing (x east, y north)
  const ox = Math.sin(rad) * half
  const oy = Math.cos(rad) * half
  const dLat = oy / mPerDegLat
  const dLng = ox / mPerDegLng
  return [
    [lng - dLng, lat - dLat],
    [lng, lat],
    [lng + dLng, lat + dLat],
  ]
}
