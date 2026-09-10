// Proximity-graph builder + Dijkstra shortest-path for the "Safest Route"
// finder.  The 807 road segments are NOT a connected graph — we build one
// on-demand by linking segments whose centres are < 500 m apart.
//
// SIH 2026 - Delhi Hyperlocal Waterlogging Prediction

import { haversineKm } from './geo'

/** Weight multiplier applied to each edge based on the origin segment's risk level. */
export const RiskMultiplier = { critical: 10, high: 5, moderate: 2, low: 1, normal: 1 }

// ── Grid spatial index (0.005° buckets ≈ 500 m) ────────────────────
const CELL = 0.005
const gridKey = (lat, lng) => `${Math.floor(lat / CELL)}:${Math.floor(lng / CELL)}`

function insertIntoGrid(grid, node) {
  const k = gridKey(node.lat, node.lng)
  if (!grid.has(k)) grid.set(k, [])
  grid.get(k).push(node)
}

function neighboursInGrid(grid, lat, lng) {
  const cl = Math.floor(lat / CELL)
  const cn = Math.floor(lng / CELL)
  const result = []
  for (let dl = -1; dl <= 1; dl++) {
    for (let dn = -1; dn <= 1; dn++) {
      const arr = grid.get(`${cl + dl}:${cn + dn}`)
      if (arr) result.push(...arr)
    }
  }
  return result
}

// ── Graph construction ──────────────────────────────────────────────

/**
 * Build an undirected proximity graph from an array of legacy hotspots.
 * Two nodes are connected when haversine distance < 0.5 km.
 *
 * @param {Array} hotspots - legacy hotspot array (has hotspot_id, coordinates, risk_level)
 * @returns {{ nodes: Map<string,object>, adj: Map<string,Array<{to:string,w:number}>> }}
 */
export function buildProximityGraph(hotspots) {
  const nodes = new Map()
  const grid = new Map()

  for (const h of hotspots) {
    const lat = h.coordinates?.lat
    const lng = h.coordinates?.lng
    if (lat == null || lng == null) continue
    const node = { id: h.hotspot_id, lat, lng, riskLevel: h.risk_level || 'normal' }
    nodes.set(h.hotspot_id, node)
    insertIntoGrid(grid, node)
  }

  const adj = new Map()
  for (const id of nodes.keys()) adj.set(id, [])

  const seen = new Set()
  for (const node of nodes.values()) {
    const candidates = neighboursInGrid(grid, node.lat, node.lng)
    for (const other of candidates) {
      if (other.id === node.id) continue
      const pairKey = node.id < other.id ? `${node.id}|${other.id}` : `${other.id}|${node.id}`
      if (seen.has(pairKey)) continue

      const dist = haversineKm(node.lat, node.lng, other.lat, other.lng)
      if (dist >= 0.5) continue

      seen.add(pairKey)
      const w = dist * (RiskMultiplier[node.riskLevel] ?? 1)
      adj.get(node.id).push({ to: other.id, w })
      adj.get(other.id).push({ to: node.id, w: dist * (RiskMultiplier[other.riskLevel] ?? 1) })
    }
  }

  return { nodes, adj }
}

// ── Dijkstra ────────────────────────────────────────────────────────

function dijkstra(nodes, adj, startId, endId) {
  const dist = new Map()
  const prev = new Map()
  const visited = new Set()
  for (const id of nodes.keys()) dist.set(id, Infinity)
  dist.set(startId, 0)

  // Simple sorted-array "priority queue" — fine for 807 nodes.
  const pq = [{ id: startId, d: 0 }]

  while (pq.length > 0) {
    pq.sort((a, b) => a.d - b.d)
    const { id: u } = pq.shift()
    if (visited.has(u)) continue
    visited.add(u)
    if (u === endId) break

    for (const { to: v, w } of adj.get(u) || []) {
      const nd = dist.get(u) + w
      if (nd < dist.get(v)) {
        dist.set(v, nd)
        prev.set(v, u)
        pq.push({ id: v, d: nd })
      }
    }
  }

  if (!prev.has(endId) && startId !== endId) return null
  const path = []
  let cur = endId
  while (cur) {
    path.unshift(cur)
    cur = prev.get(cur)
  }
  return { path, totalDist: dist.get(endId) }
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Find the safest route between two geographic points.
 *
 * @param {Array}  hotspots  - full legacy hotspot array
 * @param {{lat:number,lng:number}} from
 * @param {{lat:number,lng:number}} to
 * @returns {null | { path: Array<{lat,lng}>, totalDistanceKm: number,
 *           criticalRoadsAvoided: number, addedMinutes: number }}
 */
export function findSafestRoute(hotspots, from, to) {
  const { nodes, adj } = buildProximityGraph(hotspots)
  if (nodes.size === 0) return null

  // Find nearest node to from / to
  let nearestFrom = null
  let nearestTo = null
  let bestFromDist = Infinity
  let bestToDist = Infinity
  for (const node of nodes.values()) {
    const df = haversineKm(from.lat, from.lng, node.lat, node.lng)
    if (df < bestFromDist) { bestFromDist = df; nearestFrom = node.id }
    const dt = haversineKm(to.lat, to.lng, node.lat, node.lng)
    if (dt < bestToDist) { bestToDist = dt; nearestTo = node.id }
  }

  if (!nearestFrom || !nearestTo || nearestFrom === nearestTo) return null

  const result = dijkstra(nodes, adj, nearestFrom, nearestTo)
  if (!result) return null

  const path = result.path.map((id) => {
    const n = nodes.get(id)
    return { lat: n.lat, lng: n.lng, riskLevel: n.riskLevel }
  })

  // Critical roads avoided: original-7 criticals NOT on the path
  const originalCriticals = ['minto-bridge', 'loni-road'] // known critical original 7
  const onRoute = new Set(result.path)
  const criticalRoadsAvoided = originalCriticals.filter((id) => !onRoute.has(id)).length

  const directDist = haversineKm(from.lat, from.lng, to.lat, to.lng)
  const addedMinutes = Math.max(0, Math.round(((result.totalDist - directDist) / 25) * 60))

  return {
    path,
    totalDistanceKm: Math.round(result.totalDist * 100) / 100,
    criticalRoadsAvoided,
    addedMinutes,
  }
}
