// Mock Data Service - Async service layer for mock data
// Mirrors the future backend API contract
// Toggle via VITE_USE_MOCK_DATA=true

// Pre-computed road-snapped dataset (750 synthetic + 7 original hotspots).
// Generated offline by scripts/generate-mock-snapped.mjs which snaps every
// candidate to the nearest OSM road and stores roadBearing + segment metadata.
import precomputedLocations from '../data/mock/locations-snapped.json'
import { WaterloggingLocation, Alert, HistoricalPoint, TrendData } from '../data/types'

// Configuration constants
export const MOCK_LATENCY_MS = 250
export const MOCK_FAILURE_MODE = 'none' // 'none' | 'network' | 'empty'
export const MOCK_EMPTY_MODE = 'none' // 'none' | 'no-locations' | 'no-alerts'

// In-memory cache for the precomputed dataset
let mockDataset: { locations: WaterloggingLocation[]; alerts: Alert[]; seed: number; generatedAt: string } | null = null
let datasetPromise: Promise<typeof mockDataset> | null = null

/**
 * Get the mock dataset (lazily loaded from precomputed snapped JSON, cached).
 * The precomputed file already contains:
 *   - 750 synthetic LOC-XXX hotspots snapped to the nearest OSM road
 *   - 7 original hotspots (minto-bridge, pul-prahladpur, ...) with roadBearing
 * Each location carries roadBearing / snappedToRoad / roadId / roadNameOSM /
 * highwayType so roadSegments.js can render properly oriented segments.
 */
async function getMockDataset() {
  if (mockDataset) return mockDataset
  if (datasetPromise) return datasetPromise

  datasetPromise = (async () => {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

    // Simulate failure mode
    if (MOCK_FAILURE_MODE === 'network') {
      throw new Error('Mock network failure')
    }

    // Load precomputed road-snapped dataset (already deterministic, no RNG at runtime).
    const locations = (precomputedLocations as WaterloggingLocation[]).slice()

    // Synthesize a couple of alerts from the highest-risk locations so the
    // alerts panel still has content to display.
    const top = [...locations]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 3)
    const alerts: Alert[] = top.map((l) => ({
      id: `ALERT-${l.id}`,
      title: `${l.locality} flood risk rising`,
      message: `Predicted water depth ${l.waterDepthCm}cm; risk ${l.riskScore.toFixed(0)}/100.`,
      riskLevel: (l.riskLevel === 'critical' || l.riskLevel === 'high' || l.riskLevel === 'moderate')
        ? l.riskLevel : 'moderate',
      riskScore: l.riskScore,
      onsetTime: l.predictedOnsetMinutes ?? 30,
      area: l.locality,
      timestamp: l.lastUpdated,
    }))

    const dataset = { locations, alerts, seed: 26026, generatedAt: new Date().toISOString() }

    // Simulate empty mode
    if (MOCK_EMPTY_MODE === 'no-locations') {
      return { ...dataset, locations: [] }
    }
    if (MOCK_EMPTY_MODE === 'no-alerts') {
      return { ...dataset, alerts: [] }
    }

    mockDataset = dataset
    return dataset
  })()

  return datasetPromise
}

/**
 * Get all waterlogging locations with optional filtering
 */
export async function getLocations(options: {
  limit?: number
  offset?: number
  riskLevel?: string
  district?: string
  search?: string
} = {}): Promise<WaterloggingLocation[]> {
  const dataset = await getMockDataset()
  let locations = [...dataset.locations]

  // Filter by risk level
  if (options.riskLevel && options.riskLevel !== 'all') {
    locations = locations.filter((l) => l.riskLevel === options.riskLevel)
  }

  // Filter by district
  if (options.district) {
    locations = locations.filter((l) => l.district === options.district)
  }

  // Search by name/locality
  if (options.search) {
    const query = options.search.toLowerCase()
    locations = locations.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        l.locality.toLowerCase().includes(query) ||
        (l.roadName && l.roadName.toLowerCase().includes(query))
    )
  }

  // Apply offset and limit
  const offset = options.offset || 0
  const limit = options.limit || locations.length
  return locations.slice(offset, offset + limit)
}

/**
 * Get a single location by ID
 */
export async function getLocationById(id: string): Promise<WaterloggingLocation | null> {
  const dataset = await getMockDataset()
  return dataset.locations.find((l) => l.id === id) || null
}

/**
 * Get historical data for a location (24-72 hourly observations)
 */
export async function getHistoricalData(
  locationId: string,
  hours: number = 24
): Promise<HistoricalPoint[]> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

  const location = await getLocationById(locationId)
  if (!location) {
    throw new Error(`Location not found: ${locationId}`)
  }

  const points: HistoricalPoint[] = []
  const now = new Date()

  for (let i = hours - 1; i >= 0; i--) {
    const ts = new Date(now.getTime() - i * 60 * 60 * 1000)
    // Simulate gradual changes
    const factor = Math.max(0, 1 - i / hours) // recent values higher
    const rainfall = Math.max(0, location.rainfallIntensity * (0.5 + factor * 0.5))
    const traffic = location.trafficSpeed * (0.7 + factor * 0.3)
    const water = Math.max(0, location.waterDepthCm * (0.3 + factor * 0.7))

    points.push({
      timestamp: ts.toISOString(),
      value: Math.round(rainfall * 10) / 10,
      category: 'rainfall',
      isAnomaly: false
    })
  }

  return points
}

/**
 * Get trend data for a metric
 */
export async function getTrendData(
  area: string,
  period: '24h' | '7d' | '30d',
  metric: 'rainfall' | 'traffic' | 'waterlogging' | 'drainage'
): Promise<TrendData> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

  // Generate deterministic trend data
  const points = period === '24h' ? 24 : period === '7d' ? 28 : 30
  const data: number[] = []

  // Use area name as part of seed for deterministic trends
  const areaSeed = area.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  let value = (areaSeed % 20) + 10

  for (let i = 0; i < points; i++) {
    const delta = (Math.sin(i * 0.5) * 5 + (Math.cos(i * 0.3) * 3))
    value = Math.max(0, Math.min(100, value + delta))
    data.push(Math.round(value * 10) / 10)
  }

  const colors: Record<string, string> = {
    rainfall: '#60A5FA',
    traffic: '#8b5cf6',
    waterlogging: '#ef4444',
    drainage: '#10b981'
  }

  return {
    area,
    period,
    metric,
    data,
    color: colors[metric]
  }
}

/**
 * Get active alerts
 */
export async function getAlerts(options: {
  severity?: 'critical' | 'high' | 'moderate'
  limit?: number
} = {}): Promise<Alert[]> {
  const dataset = await getMockDataset()
  let alerts = [...dataset.alerts]

  if (options.severity) {
    alerts = alerts.filter((a) => a.riskLevel === options.severity)
  }

  if (options.limit) {
    alerts = alerts.slice(0, options.limit)
  }

  return alerts
}

/**
 * Get risk summary across all locations
 */
export async function getRiskSummary() {
  const dataset = await getMockDataset()
  const locations = dataset.locations

  const summary = {
    total: locations.length,
    critical: locations.filter((l) => l.riskLevel === 'critical').length,
    high: locations.filter((l) => l.riskLevel === 'high').length,
    moderate: locations.filter((l) => l.riskLevel === 'moderate').length,
    low: locations.filter((l) => l.riskLevel === 'low').length,
    normal: locations.filter((l) => l.riskLevel === 'normal').length,
    average_risk_score: Math.round(
      locations.reduce((sum, l) => sum + l.riskScore, 0) / locations.length
    ),
    last_updated: new Date().toISOString()
  }

  return summary
}

/**
 * Submit user feedback (mock)
 */
export async function submitFeedback(feedback: {
  locationId: string
  rating: number
  comment: string
  observedDepth?: string
}): Promise<{ success: boolean; message: string; timestamp: string }> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

  if (MOCK_FAILURE_MODE === 'network') {
    throw new Error('Mock network failure')
  }

  return {
    success: true,
    message: 'Thank you for your feedback!',
    timestamp: new Date().toISOString()
  }
}

/**
 * Reset the mock dataset cache (useful for testing)
 */
export function resetMockDataset() {
  mockDataset = null
  datasetPromise = null
}

/**
 * Get mock data statistics
 */
export async function getMockStats() {
  const dataset = await getMockDataset()
  return {
    totalLocations: dataset.locations.length,
    totalAlerts: dataset.alerts.length,
    seed: dataset.seed,
    generatedAt: dataset.generatedAt,
    riskDistribution: {
      critical: dataset.locations.filter((l) => l.riskLevel === 'critical').length,
      high: dataset.locations.filter((l) => l.riskLevel === 'high').length,
      moderate: dataset.locations.filter((l) => l.riskLevel === 'moderate').length,
      low: dataset.locations.filter((l) => l.riskLevel === 'low').length,
      normal: dataset.locations.filter((l) => l.riskLevel === 'normal').length
    }
  }
}