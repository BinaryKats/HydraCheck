// Road Segment GeoJSON Data
// SIH 2026 - Delhi Hyperlocal Waterlogging Prediction
// Each hotspot has a defined road segment (start/end coordinates).
// The synthetic 3-point stub used for generated LOC-XXX entries is now
// oriented along the precomputed roadBearing so it actually follows the
// underlying OSM road rather than pointing in a fixed grid direction.

import { HOTSPOTS } from '../utils/constants'
import { roadStubGeometry, computeSegmentBearing } from '../utils/geo'

/**
 * Road segments as GeoJSON LineStrings
 * These represent the actual road stretches affected by each hotspot
 */
export const ROAD_SEGMENTS = {
  'minto-bridge': {
    type: 'Feature',
    properties: {
      hotspot_id: 'minto-bridge',
      hotspot_name: 'Minto Bridge Underpass',
      road_name: 'Ring Road',
      segment_length_km: 0.8
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.2185, 28.6265],
        [77.2195, 28.6270],
        [77.2197, 28.6280], // hotspot center
        [77.2205, 28.6290],
        [77.2215, 28.6295]
      ]
    }
  },
  'pul-prahladpur': {
    type: 'Feature',
    properties: {
      hotspot_id: 'pul-prahladpur',
      hotspot_name: 'Pul Prahladpur Underpass',
      road_name: 'NH-48 (Mathura Road)',
      segment_length_km: 0.6
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.2490, 28.5085],
        [77.2500, 28.5090],
        [77.2510, 28.5097], // hotspot center
        [77.2520, 28.5105],
        [77.2530, 28.5110]
      ]
    }
  },
  'ring-road-who': {
    type: 'Feature',
    properties: {
      hotspot_id: 'ring-road-who',
      hotspot_name: 'Ring Road opp. WHO Building',
      road_name: 'Ring Road',
      segment_length_km: 0.5
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.2490, 28.5675],
        [77.2500, 28.5680],
        [77.2510, 28.5685], // hotspot center
        [77.2520, 28.5690],
        [77.2530, 28.5695]
      ]
    }
  },
  'jahangirpuri': {
    type: 'Feature',
    properties: {
      hotspot_id: 'jahangirpuri',
      hotspot_name: 'Jahangirpuri Metro Station Road',
      road_name: 'Grand Trunk Road',
      segment_length_km: 0.7
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.1685, 28.7240],
        [77.1695, 28.7245],
        [77.1700, 28.7253], // hotspot center
        [77.1710, 28.7260],
        [77.1720, 28.7265]
      ]
    }
  },
  'zakhira-flyover': {
    type: 'Feature',
    properties: {
      hotspot_id: 'zakhira-flyover',
      hotspot_name: 'Zakhira Flyover (under)',
      road_name: 'Link Road',
      segment_length_km: 0.5
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.1515, 28.6600],
        [77.1525, 28.6605],
        [77.1534, 28.6612], // hotspot center
        [77.1545, 28.6620],
        [77.1555, 28.6625]
      ]
    }
  },
  'loni-road': {
    type: 'Feature',
    properties: {
      hotspot_id: 'loni-road',
      hotspot_name: 'Loni Road Golchakkar',
      road_name: 'Loni Road',
      segment_length_km: 0.9
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.2785, 28.6930],
        [77.2795, 28.6935],
        [77.2800, 28.6945], // hotspot center
        [77.2810, 28.6955],
        [77.2820, 28.6960]
      ]
    }
  },
  'karala-kanjhawla': {
    type: 'Feature',
    properties: {
      hotspot_id: 'karala-kanjhawla',
      hotspot_name: 'Karala–Kanjhawla Stretch',
      road_name: 'Kanjhawla Road',
      segment_length_km: 1.2
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.0025, 28.7320],
        [77.0040, 28.7330],
        [77.0050, 28.7350], // hotspot center
        [77.0065, 28.7370],
        [77.0080, 28.7385]
      ]
    }
  }
}

/**
 * Get road segment for a specific hotspot
 */
export function getRoadSegment(hotspotId) {
  return ROAD_SEGMENTS[hotspotId] || null
}

/**
 * Get all road segments as GeoJSON FeatureCollection
 */
export function getAllRoadSegments() {
  return {
    type: 'FeatureCollection',
    features: Object.values(ROAD_SEGMENTS)
  }
}

/**
 * Calculate segment center point (for hotspot placement)
 */
export function getSegmentCenter(hotspotId) {
  const segment = ROAD_SEGMENTS[hotspotId]
  if (!segment) return null

  const coords = segment.geometry.coordinates
  const n = coords.length

  // Simple average of all coordinates
  const sumLng = coords.reduce((sum, c) => sum + c[0], 0)
  const sumLat = coords.reduce((sum, c) => sum + c[1], 0)

  return {
    lat: sumLat / n,
    lng: sumLng / n
  }
}

/**
 * Get a road segment for any hotspot.
 * Returns the real segment for the original 7 hotspots,
 * or a short synthetic 3-point stub centered on the location's coordinates
 * and oriented along the roadBearing stored on the (pre-snapped) location,
 * so that every generated LOC-XXX entry renders as a road-aligned segment.
 *
 * @param {Object} hotspot - legacy hotspot object with hotspot_id and coordinates: { lat, lng }
 */
export function getRoadSegmentForLocation(hotspot) {
  const real = getRoadSegment(hotspot.hotspot_id)
  if (real) return real

  const { lat, lng } = hotspot.coordinates || {}
  if (lat == null || lng == null) return null

  // Bearing comes from the precomputed snapped dataset (api.js exposes it as
  // road_bearing). Fall back to a segment-bearing derived from the hotspot's
  // own coordinates if unavailable, then to a sane default so we never render
  // a zero-length / null geometry.
  const bearing =
    (typeof hotspot.road_bearing === 'number' && isFinite(hotspot.road_bearing)) ? hotspot.road_bearing
    : (typeof hotspot.roadBearing === 'number' && isFinite(hotspot.roadBearing)) ? hotspot.roadBearing
    : computeSegmentBearing(
        hotspot._segmentCoords ||
          [[lng - 0.0001, lat - 0.00005], [lng, lat], [lng + 0.0001, lat + 0.00005]],
        lat, lng
      ) ?? 45

  // 3-point stub (~80 m long) centered on the snapped point, rotated to the
  // actual road bearing so the segment visually follows the road.
  const coordinates = roadStubGeometry(lat, lng, bearing, 80)

  return {
    type: 'Feature',
    properties: {
      hotspot_id: hotspot.hotspot_id,
      hotspot_name: hotspot.hotspot_name,
      road_name: hotspot.area || hotspot.roadNameOSM || '',
      segment_length_km: 0.08,
      synthetic: true,
      road_bearing: bearing
    },
    geometry: {
      type: 'LineString',
      coordinates
    }
  }
}