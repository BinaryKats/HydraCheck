// Zoom-dependent grid clustering for hundreds of waterlogging locations.
// SIH 2026 - At city zoom the map shows aggregated clusters; zooming in
// halves the cell size so clusters split until each individual road
// segment becomes visible. Original 7 hotspots are always rendered
// directly (they have real GeoJSON polylines).

/**
 * Cell size at zoom level 11 ~ 0.08 deg lat/lng (~9 km at Delhi).
 * Each +1 zoom halves the cell. Cell is in degrees because locations
 * are stored as lat/lng; Leaflet's projection is handled at draw time.
 */
export const BASE_CELL = 0.08
export const REFERENCE_ZOOM = 11
export const ORIGINAL_HOTSPOT_IDS = new Set([
  'minto-bridge',
  'pul-prahladpur',
  'ring-road-who',
  'jahangirpuri',
  'zakhira-flyover',
  'loni-road',
  'karala-kanjhawla',
])

/**
 * Cell size in degrees for a given Leaflet zoom level.
 * Clamped to a sane floor/ceiling so the math never explodes.
 */
/**
 * Cell size in degrees for a given Leaflet zoom level.
 * `densityMultiplier` shifts the cell size without changing the algorithm:
 *   >1 → cells bigger → fewer, larger clusters (city-level aggregation)
 *   <1 → cells smaller → more, smaller clusters (street-level detail)
 * Clamped to a sane floor/ceiling so the math never explodes.
 */
export function cellSizeAtZoom(zoom, densityMultiplier = 1) {
  if (zoom == null || Number.isNaN(zoom)) return BASE_CELL * densityMultiplier
  const safe = Math.max(8, Math.min(18, zoom))
  return BASE_CELL / Math.pow(2, safe - REFERENCE_ZOOM) * densityMultiplier
}

// Risk level ordinal used to pick "worst" in a cluster (higher = worse).
const RISK_RANK = { normal: 0, low: 1, moderate: 2, high: 3, critical: 4 }
function rankOf(level) {
  return RISK_RANK[level] ?? 0
}

/**
 * Cluster an array of location records into a flat list of
 * { kind: 'singleton' | 'cluster', items: [...], lat, lng, worstLevel }.
 *
 * - Locations whose id is in `alwaysSingletons` (the original 7) bypass
 *   clustering entirely; they always render as individuals.
 * - Others are bucketed by (floor(lat/cellSize), floor(lng/cellSize)).
 * - Singletons within a bucket are emitted as-is so the per-item road
 *   segment is still drawn (preserves the "individual road" behaviour
 *   at any zoom, only the count badge is suppressed).
 * - Buckets with 2+ members become a cluster record carrying the
 *   centroid, worst risk level, and the list of member locations
 *   (needed so a click can focus/zoom into the bucket).
 *
 * The result is pure data — the caller renders Polylines for
 * singletons and a Leaflet `Marker` with a `divIcon` for clusters.
 *
 * @param {Array} locations - records with .id, .latitude, .longitude, .riskLevel
 * @param {number} zoom - current Leaflet zoom level
 * @param {Set<string>} [alwaysSingletons] - ids that bypass clustering
 * @param {number} [densityMultiplier=1] - scale cell size (see cellSizeAtZoom)
 * @returns {Array<{kind: 'singleton'|'cluster', items: Array, lat: number, lng: number, worstLevel: string}>}
 */
export function clusterLocations(locations, zoom, alwaysSingletons = ORIGINAL_HOTSPOT_IDS, densityMultiplier = 1) {
  if (!Array.isArray(locations) || locations.length === 0) return []

  const cell = cellSizeAtZoom(zoom, densityMultiplier)

  // 1) Singletons always go through untouched.
  const singletons = []
  const bucketed = []
  for (const loc of locations) {
    if (alwaysSingletons.has(loc.id)) {
      singletons.push({
        kind: 'singleton',
        items: [loc],
        lat: loc.latitude,
        lng: loc.longitude,
        worstLevel: loc.riskLevel,
      })
    } else {
      bucketed.push(loc)
    }
  }

  // 2) Grid bucket the rest.
  const buckets = new Map() // key -> Array<loc>
  for (const loc of bucketed) {
    const key = `${Math.floor(loc.latitude / cell)}:${Math.floor(loc.longitude / cell)}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(loc)
  }

  const clusters = []
  for (const members of buckets.values()) {
    if (members.length === 1) {
      const loc = members[0]
      clusters.push({
        kind: 'singleton',
        items: [loc],
        lat: loc.latitude,
        lng: loc.longitude,
        worstLevel: loc.riskLevel,
      })
    } else {
      // Centroid by simple average; worst risk wins.
      let sumLat = 0
      let sumLng = 0
      let worst = members[0]
      for (const m of members) {
        sumLat += m.latitude
        sumLng += m.longitude
        if (rankOf(m.riskLevel) > rankOf(worst.riskLevel)) worst = m
      }
      const n = members.length
      clusters.push({
        kind: 'cluster',
        items: members,
        lat: sumLat / n,
        lng: sumLng / n,
        worstLevel: worst.riskLevel,
      })
    }
  }

  return [...singletons, ...clusters]
}
