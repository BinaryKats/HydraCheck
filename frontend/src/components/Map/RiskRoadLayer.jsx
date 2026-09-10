// RiskRoadLayer Component
// SIH 2026 - Renders risk-colored road polylines on the map.
// Zoom-dependent clustering: city zoom shows large aggregated clusters,
// zooming in halves the grid cell so clusters split; only once the
// cell is fine enough do individual road stubs become polylines.

import { useEffect, useMemo, useState, Fragment } from 'react'
import { Polyline, Popup, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { RISK_LEVELS } from '../../utils/constants'
import { computePredictedRisk, getRiskColorForTime } from '../../utils/timeFilter'
import { getAllHotspots } from '../../utils/api'
import { getRoadSegmentForLocation } from '../../data/roadSegments'
import { formatRiskScore } from '../../utils/formatting'
import {
  clusterLocations,
  ORIGINAL_HOTSPOT_IDS,
  cellSizeAtZoom,
} from '../../utils/clustering'

/** Subscribe to Leaflet zoom changes. */
function ZoomTracker({ onZoom }) {
  const map = useMap()
  useMapEvents({
    zoomend() {
      onZoom(map.getZoom())
    },
  })
  // Also initialise once the map exists.
  useEffect(() => {
    onZoom(map.getZoom())
  }, [map, onZoom])
  return null
}

const clusterIconCache = new Map()
function clusterDivIcon(count, level) {
  const key = `${count}:${level}`
  if (clusterIconCache.has(key)) return clusterIconCache.get(key)
  const c = (RISK_LEVELS[level] || RISK_LEVELS.moderate).color
  const size = count >= 30 ? 44 : count >= 12 ? 38 : 32
  const html = `<div class="marker-pop-animation" style="
    width:${size}px;height:${size}px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    background:${c};color:#fff;font-weight:800;font-size:13px;
    border:2px solid rgba(255,255,255,0.92);
    box-shadow:0 2px 10px rgba(0,0,0,0.45);
    font-family:JetBrains Mono,monospace
  ">${count}</div>`
  const icon = L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
  clusterIconCache.set(key, icon)
  return icon
}

/**
 * Adapt a legacy hotspot record (snake_case) into the shape expected by
 * clusterLocations() which is keyed on .id/.latitude/.longitude/.riskLevel.
 * Returns a small plain object that also stashes the original hotspot on
 * `_raw` so we can re-use it without re-creating it.
 */
function toClusteringShape(hotspot) {
  return {
    id: hotspot.hotspot_id,
    latitude: hotspot.coordinates?.lat,
    longitude: hotspot.coordinates?.lng,
    riskLevel: hotspot.risk_level,
    _raw: hotspot,
  }
}

function RiskRoadLayer({ onHotspotClick, onHotspotDoubleClick, onError, selectedId, justReportedId, filterLevels, timeMinutes = 0, densityMultiplier = 1 }) {
  const [legacyHotspots, setLegacyHotspots] = useState([])
  const [zoom, setZoom] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function loadHotspots() {
      try {
        const response = await getAllHotspots()
        if (!isMounted) return
        const list = Array.isArray(response) ? response : response.data || []
        setLegacyHotspots(list)
        setLoading(false)
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to load hotspots for Risk layer:', err)
        setError(err)
        setLoading(false)
        if (onError) onError(err)
      }
    }
    loadHotspots()
    return () => { isMounted = false }
  }, [onError])

  // Pure data — original 7 always render, the rest are grid-clustered.
  const prepared = useMemo(() => {
    if (legacyHotspots.length === 0) return []
    const shapes = legacyHotspots.map(toClusteringShape)
    return clusterLocations(shapes, zoom, ORIGINAL_HOTSPOT_IDS, densityMultiplier)
  }, [legacyHotspots, zoom, densityMultiplier])

  if (loading || error) return null

  return (
    <>
      <ZoomTracker onZoom={setZoom} />

      {/* Singletons: real road polylines (original 7 have their GeoJSON, stubs for generated ones). */}
      {prepared.filter((c) => c.kind === 'singleton').map((bucket) => {
        const hotspot = bucket.items[0]._raw
        if (filterLevels && !filterLevels.has(hotspot.risk_level)) return null
        const segment = getRoadSegmentForLocation(hotspot)
        if (!segment) return null
        const positions = segment.geometry.coordinates.map(([lng, lat]) => [lat, lng])
        const riskStyle = RISK_LEVELS[hotspot.risk_level] || RISK_LEVELS.normal

        // Time scrubber override — when scrubbing, use predicted color/weight
        let effectiveColor = riskStyle.color
        let effectiveWeight = riskStyle.width
        if (timeMinutes > 0) {
          const t = computePredictedRisk(hotspot, timeMinutes)
          effectiveColor = getRiskColorForTime(hotspot, timeMinutes)
          effectiveWeight = t.status === 'at_risk' ? riskStyle.width + 1 : riskStyle.width - 1
        }

        const isCritical = hotspot.risk_level === 'critical'
        const isSelected = selectedId === hotspot.hotspot_id
        const isFlashing = justReportedId === hotspot.hotspot_id
        const isDimmed = selectedId && !isSelected

        let animClass = isCritical ? 'pulse-animation' : ''
        if (isFlashing) animClass = 'segment-flash-animation'

        return (
          <Fragment key={hotspot.hotspot_id}>
            {/* Selection halo — a slightly wider, white-bordered polyline under the real one */}
            {isSelected && (
              <Polyline
                key={`${hotspot.hotspot_id}-halo`}
                positions={positions}
                pathOptions={{
                  color: '#ffffff',
                  weight: riskStyle.width + 4,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}
          <Polyline
            key={`${hotspot.hotspot_id}-detail`}
            positions={positions}
            pathOptions={{
              color: effectiveColor,
              weight: isSelected ? effectiveWeight + 2 : effectiveWeight,
              opacity: isDimmed ? 0.45 : 0.9,
              className: animClass,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            eventHandlers={{
              mouseover(e) {
                const map = e.target._map
                if (map && map.getContainer) map.getContainer().style.cursor = 'pointer'
                e.target.setStyle({ weight: riskStyle.width + 2, opacity: 1 })
              },
              mouseout(e) {
                const map = e.target._map
                if (map && map.getContainer) map.getContainer().style.cursor = ''
                e.target.setStyle({
                  weight: isSelected ? riskStyle.width + 2 : riskStyle.width,
                  opacity: isDimmed ? 0.45 : 0.9,
                })
              },
              click() { if (onHotspotClick) onHotspotClick(hotspot) },
              dblclick(e) {
                if (e.originalEvent) e.originalEvent.stopPropagation()
                if (onHotspotDoubleClick) onHotspotDoubleClick(hotspot)
              },
            }}
          >
            <Popup>
              <div className="font-sans text-sm pb-1">
                <h3 className="font-bold text-base mb-1 text-slate-900">{hotspot.hotspot_name}</h3>
                <p className="text-gray-600 text-xs mb-2">{hotspot.area}</p>
                <div className="space-y-1 text-slate-800 mb-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Risk Score:</span>
                    <span className="font-mono font-bold" style={{ color: riskStyle.color }}>
                      {formatRiskScore(hotspot.risk_score)}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Risk Level:</span>
                    <span className="font-semibold" style={{ color: riskStyle.color }}>{riskStyle.label}</span>
                  </div>
                  {hotspot.onset_minutes != null && (
                    <div className="flex justify-between">
                      <span className="font-medium">Onset:</span>
                      <span>~{hotspot.onset_minutes} min</span>
                    </div>
                  )}
                  {hotspot.duration_minutes != null && (
                    <div className="flex justify-between">
                      <span className="font-medium">Duration:</span>
                      <span>~{hotspot.duration_minutes} min</span>
                    </div>
                  )}
                </div>
                {onHotspotClick && (
                  <button
                    onClick={() => onHotspotClick(hotspot)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 rounded shadow-sm text-xs transition-colors"
                  >
                    View Details & Insights
                  </button>
                )}
              </div>
            </Popup>
          </Polyline>
        </Fragment>
        )
      })}

      {/* Clusters: count badge, colour = worst risk in cell. Hidden when its level is filtered. */}
      {prepared.filter((c) => {
        if (filterLevels && c.worstLevel && !filterLevels.has(c.worstLevel)) return false
        return c.kind === 'cluster'
      }).map((bucket) => (
        <Marker
          key={`cluster-${bucket.lat.toFixed(5)}:${bucket.lng.toFixed(5)}`}
          position={[bucket.lat, bucket.lng]}
          icon={clusterDivIcon(bucket.items.length, bucket.worstLevel)}
          eventHandlers={{
            click(e) {
              const map = e.target._map
              if (!map) return
              const latLngs = bucket.items.map((s) => L.latLng(s.latitude, s.longitude))
              if (latLngs.length >= 2) {
                map.flyToBounds(L.latLngBounds(latLngs), { padding: [40, 40], duration: 0.45 })
              } else {
                const next = Math.min(16, map.getZoom() + 2)
                map.flyTo([bucket.lat, bucket.lng], next, { duration: 0.4 })
              }
            },
          }}
        />
      ))}
    </>
  )
}

export default RiskRoadLayer
