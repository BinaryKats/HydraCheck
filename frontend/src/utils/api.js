// Mock API Service for Waterlogging Predictions
// SIH 2026 - Delhi Hyperlocal Waterlogging Prediction
//
// DEPRECATED: This file now delegates to the new delegates to the new dataService layer.
// Kept for backward compatibility - all functions proxy to dataService.
//
// Toggle via VITE_USE_MOCK_DATA=true

import { dataService } from './index'
import { getCache, getCacheStale, setCache, formatAge } from './cache'
import { retryWithBackoff, withTimeout } from './retry'

// Re-define NetworkError for backward compatibility (same as before)
export class NetworkError extends Error {
  constructor(message, { cause, isOffline = false, isTimeout = false } = {}) {
    super(message)
    this.name = 'NetworkError'
    this.isOffline = isOffline
    this.isTimeout = isTimeout
    if (cause) this.cause = cause
  }
}

const CACHE_KEYS = {
  HOTSPOTS: 'all_hotspots',
  RISK_SUMMARY: 'risk_summary'
}

const CACHE_TTL_MS = 15 * 60 * 1000 // 15 min
const REQUEST_TIMEOUT_MS = 8000

/**
 * Map a WaterloggingLocation (camelCase) to the legacy hotspot shape (snake_case)
 * that the UI components still expect.
 */
function toLegacyHotspotShape(loc) {
  return {
    hotspot_id: loc.id,
    hotspot_name: loc.name,
    coordinates: { lat: loc.latitude, lng: loc.longitude },
    risk_score: loc.riskScore,
    risk_level: loc.riskLevel,
    probability: loc.riskScore / 100,
    onset_minutes: loc.predictedOnsetMinutes,
    duration_minutes: loc.predictedDurationMinutes,
    effective_drainage_index: loc.ediValue,
    drainage_status: loc.ediStatus,
    recovery_time_minutes: loc.recoveryTimeMinutes,
    drainage_trend: loc.drainageTrend,
    last_updated: loc.lastUpdated,
    data_sources: {
      rainfall_available: true,
      traffic_available: true,
      satellite_available: false
    },
    metadata: {
      rainfall_intensity_mmhr: loc.metadata?.rainfallIntensityMmhr ?? 'N/A',
      traffic_slowdown_percent: loc.metadata?.trafficSlowdownPercent ?? 0,
      water_depth_expected: loc.metadata?.waterDepthExpected ?? 'N/A',
      alternate_routes: loc.alternateRoutes || []
    },
    is_chronic: loc.isChronic,
    area: loc.locality,
    // Road-snap metadata (from the precomputed dataset) so roadSegments.js
    // can render a correctly oriented stub for generated locations.
    road_bearing: loc.roadBearing ?? null,
    snapped_to_road: loc.snappedToRoad ?? false,
    snap_distance_m: loc.snapDistanceM ?? null,
    road_id: loc.roadId ?? null,
    road_name_osm: loc.roadNameOSM ?? null,
    highway_type: loc.highwayType ?? null
  }
}

/**
 * Get predictions for all hotspots.
 * Uses cache-first, falls back to offline cache on network failure.
 *
 * @returns {Promise<{data: Array, fromCache: boolean, cachedAge?: string}>}
 */
export async function getAllHotspots() {
  const fetchHotspots = async () => {
    await withTimeout(
      new Promise((resolve) => setTimeout(resolve, REQUEST_TIMEOUT_MS)),
      REQUEST_TIMEOUT_MS,
      'Request timed out'
    )

    const locations = await dataService.getLocations()

    // Transform to legacy hotspot format for backward compatibility
    const hotspots = locations.map(toLegacyHotspotShape)

    // Save fresh data to cache
    setCache(CACHE_KEYS.HOTSPOTS, hotspots, CACHE_TTL_MS)
    return { data: hotspots, fromCache: false }
  }

  try {
    return await retryWithBackoff(fetchHotspots, { maxRetries: 2 })
  } catch (err) {
    const stale = getCacheStale(CACHE_KEYS.HOTSPOTS)
    if (stale) {
      console.warn('Returning stale cache due to error:', err.message)
      return {
        data: stale.value,
        fromCache: true,
        cachedAge: formatAge(stale.ageMs),
        error: err
      }
    }
    throw err
  }
}

/**
 * Get prediction for a single hotspot.
 */
export async function getHotspotPrediction(hotspotId) {
  const fetchSingle = async () => {
    await withTimeout(
      new Promise((resolve) => setTimeout(resolve, REQUEST_TIMEOUT_MS)),
      REQUEST_TIMEOUT_MS,
      'Request timed out'
    )

    const location = await dataService.getLocationById(hotspotId)
    if (!location) {
      throw new Error(`Hotspot not found: ${hotspotId}`)
    }

    return toLegacyHotspotShape(location)
  }

  return retryWithBackoff(fetchSingle, { maxRetries: 2 })
}

/**
 * Submit user feedback about road conditions.
 */
export async function submitFeedback(feedback) {
  const submit = async () => {
    await withTimeout(
      new Promise((resolve) => setTimeout(resolve, REQUEST_TIMEOUT_MS)),
      REQUEST_TIMEOUT_MS,
      'Request timed out'
    )

    return await dataService.submitFeedback(feedback)
  }

  try {
    return await retryWithBackoff(submit, { maxRetries: 2 })
  } catch (err) {
    if (err instanceof NetworkError && err.isOffline) {
      throw err
    }
    throw err
  }
}

/**
 * Get aggregated risk summary across all hotspots.
 */
export async function getRiskSummary() {
  const { data: hotspots, fromCache, cachedAge, error } = await getAllHotspots()

  const summary = {
    total: hotspots.length,
    critical: hotspots.filter((h) => h.risk_level === 'critical').length,
    high: hotspots.filter((h) => h.risk_level === 'high').length,
    moderate: hotspots.filter((h) => h.risk_level === 'moderate').length,
    low: hotspots.filter((h) => h.risk_level === 'low').length,
    normal: hotspots.filter((h) => h.risk_level === 'normal').length,
    average_risk_score: Math.round(
      hotspots.reduce((sum, h) => sum + h.risk_score, 0) / hotspots.length
    ),
    last_updated: new Date().toISOString()
  }

  if (fromCache) {
    summary.fromCache = true
    summary.cachedAge = cachedAge
    summary.error = error?.message
  }

  setCache(CACHE_KEYS.RISK_SUMMARY, summary, CACHE_TTL_MS)
  return summary
}