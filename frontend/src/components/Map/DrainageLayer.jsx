/**
 * Drainage Layer Component
 * Renders road segments coloured by EDI (Effective Drainage Index).
 * Zoom-dependent clustering identical to RiskRoadLayer — at city zoom
 * a grid of cluster dots is shown, splitting as the user zooms in.
 *
 * @see design.md Section 15 - Drainage UI
 * @see design.md Section 2 - Road Overlay Color System
 */

import { useEffect, useMemo, useState } from 'react'
import { Polyline, Popup, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { EDI_STATUS, RISK_LEVELS } from '../../utils/constants'
import { computePredictedRisk, getRiskColorForTime } from '../../utils/timeFilter'
import { getAllHotspots } from '../../utils/api'
import { getRoadSegmentForLocation } from '../../data/roadSegments'
import { formatRiskScore } from '../../utils/formatting'
import {
  clusterLocations,
  ORIGINAL_HOTSPOT_IDS,
} from '../../utils/clustering'

/* ── helpers ─────────────────────────────────────────────────────────── */

function getEdiColor(ediValue) {
  if (ediValue >= 0.8) return EDI_STATUS.good.color
  if (ediValue >= 0.6) return EDI_STATUS.moderate.color
  if (ediValue >= 0.4) return EDI_STATUS.degraded.color
  return EDI_STATUS.critical.color
}

function getEdiWidth(ediValue) {
  if (ediValue >= 0.8) return 8
  if (ediValue >= 0.6) return 7
  if (ediValue >= 0.4) return 6
  return 5
}

function shouldPulse(ediValue, previousEdi) {
  if (previousEdi == null) return false
  return [0.8, 0.6, 0.4].some(
    (t) => (previousEdi >= t && ediValue < t) || (previousEdi < t && ediValue >= t),
  )
}

/** Subscribe to Leaflet zoom changes. */
function ZoomTracker({ onZoom }) {
  const map = useMap()
  useMapEvents({ zoomend() { onZoom(map.getZoom()) } })
  useEffect(() => { onZoom(map.getZoom()) }, [map, onZoom])
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

function toClusteringShape(hotspot) {
  return {
    id: hotspot.hotspot_id,
    latitude: hotspot.coordinates?.lat,
    longitude: hotspot.coordinates?.lng,
    riskLevel: hotspot.risk_level,
    _raw: hotspot,
  }
}

/* ── main component ──────────────────────────────────────────────────── */

function DrainageLayer({ viewMode = 'drainage', fusionMode = false, onHotspotClick, onError, selectedId, justReportedId, filterLevels, timeMinutes = 0, densityMultiplier = 1 }) {
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [zoom, setZoom] = useState(12)
  const [previousEdiValues, setPreviousEdiValues] = useState({})
  const [pulsingRoads, setPulsingRoads] = useState(new Set())

  useEffect(() => {
    let isMounted = true

    async function loadHotspots() {
      try {
        const response = await getAllHotspots()
        if (!isMounted) return
        const data = Array.isArray(response) ? response : response.data || []

        const newPulsing = new Set()
        data.forEach((h) => {
          const prevEdi = previousEdiValues[h.hotspot_id]
          if (shouldPulse(h.effective_drainage_index, prevEdi)) newPulsing.add(h.hotspot_id)
        })

        setPulsingRoads(newPulsing)
        setHotspots(data)
        setLoading(false)

        const ediMap = {}
        data.forEach((h) => { ediMap[h.hotspot_id] = h.effective_drainage_index })
        setPreviousEdiValues(ediMap)

        if (newPulsing.size > 0) {
          setTimeout(() => { if (isMounted) setPulsingRoads(new Set()) }, 2000)
        }
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to load hotspots for drainage layer:', err)
        setError(err)
        setLoading(false)
        if (onError) onError(err)
      }
    }

    loadHotspots()
    return () => { isMounted = false }
  }, [onError])

  const prepared = useMemo(() => {
    if (hotspots.length === 0) return []
    const shapes = hotspots.map(toClusteringShape)
    return clusterLocations(shapes, zoom, ORIGINAL_HOTSPOT_IDS, densityMultiplier)
  }, [hotspots, zoom, densityMultiplier])

  if (loading || error) return null

  return (
    <>
      <ZoomTracker onZoom={setZoom} />

      {/* Singletons */}
      {prepared.filter((c) => c.kind === 'singleton').map((bucket) => {
        const hotspot = bucket.items[0]._raw
        if (filterLevels && hotspot.risk_level && !filterLevels.has(hotspot.risk_level)) return null
        const segment = getRoadSegmentForLocation(hotspot)
        if (!segment) return null
        const positions = segment.geometry.coordinates.map(([lng, lat]) => [lat, lng])
        const ediColor = getEdiColor(hotspot.effective_drainage_index)
        const ediWidth = getEdiWidth(hotspot.effective_drainage_index)

        // Time scrubber override — when scrubbing, overlay predicted risk color
        let effectiveColor = ediColor
        let effectiveWeight = ediWidth
        if (timeMinutes > 0) {
          const t = computePredictedRisk(hotspot, timeMinutes)
          effectiveColor = getRiskColorForTime(hotspot, timeMinutes)
          effectiveWeight = t.status === 'at_risk' ? ediWidth + 1 : ediWidth - 1
        }
        const isPulsing = pulsingRoads.has(hotspot.hotspot_id)
        const isSelected = selectedId === hotspot.hotspot_id
        const isFlashing = justReportedId === hotspot.hotspot_id
        const isDimmed = selectedId && !isSelected

        let animClass = isPulsing ? 'edi-pulse-animation' : ''
        if (isFlashing) animClass = 'segment-flash-animation'

        return (
          <>
            {isSelected && (
              <Polyline
                key={`drainage-${hotspot.hotspot_id}-halo`}
                positions={positions}
                pathOptions={{
                  color: '#ffffff',
                  weight: ediWidth + 4,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}
          <Polyline
            key={`drainage-${hotspot.hotspot_id}`}
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
                e.target.setStyle({ weight: ediWidth + 2, opacity: 1 })
              },
              mouseout(e) {
                const map = e.target._map
                if (map && map.getContainer) map.getContainer().style.cursor = ''
                e.target.setStyle({
                  weight: isSelected ? ediWidth + 2 : ediWidth,
                  opacity: isDimmed ? 0.45 : 0.9,
                })
              },
              click() { if (onHotspotClick) onHotspotClick(hotspot) },
            }}
          >
            <Popup>
              <div className="font-sans text-sm pb-1">
                <h3 className="font-bold text-base mb-1 text-slate-900">{hotspot.hotspot_name}</h3>
                <p className="text-gray-600 text-xs mb-2">{hotspot.area}</p>
                <div className="space-y-1 text-slate-800 mb-3">
                  <div className="flex justify-between">
                    <span className="font-medium">EDI:</span>
                    <span className="font-mono font-bold" style={{ color: ediColor }}>
                      {hotspot.effective_drainage_index?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className="font-semibold" style={{ color: ediColor }}>
                      {(hotspot.drainage_status || hotspot.ediStatus)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Recovery:</span>
                    <span>~{hotspot.recovery_time_minutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Monitoring:</span>
                    <span>{hotspot.monitoring_points || '3'} points</span>
                  </div>
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
          </>
        )
      })}

      {/* Clusters */}
      {prepared.filter((c) => {
        if (filterLevels && c.worstLevel && !filterLevels.has(c.worstLevel)) return false
        return c.kind === 'cluster'
      }).map((bucket) => (
        <Marker
          key={`drainage-cluster-${bucket.lat.toFixed(5)}:${bucket.lng.toFixed(5)}`}
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
                map.flyTo([bucket.lat, bucket.lng], Math.min(16, map.getZoom() + 2), { duration: 0.4 })
              }
            },
          }}
        />
      ))}

      </>
  )
}

export default DrainageLayer
