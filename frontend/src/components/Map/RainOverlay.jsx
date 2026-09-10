/**
 * Rain Overlay Component
 * Fetches the latest RainViewer radar frame and renders it as a TileLayer.
 *
 * SIH 2026 — Delhi Hyperlocal Waterlogging Prediction
 */

import { useEffect, useState, useRef } from 'react'
import { TileLayer } from 'react-leaflet'

const META_URL = 'https://api.rainviewer.com/public/weather-maps.json'

function RainOverlay({ visible }) {
  const [frame, setFrame] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!visible) {
      clearInterval(intervalRef.current)
      return
    }

    async function fetchMeta() {
      try {
        const res = await fetch(META_URL)
        const data = await res.json()
        // Prefer the most recent past radar frame; fall back to nowcast
        const past = data?.radar?.past
        const nowcast = data?.radar?.nowcast
        const latest = (past && past.length > 0 ? past[past.length - 1] : null) || (nowcast && nowcast[0]) || null
        if (latest?.path) setFrame(latest.path)
      } catch (err) {
        console.warn('RainOverlay: failed to fetch RainViewer meta', err)
      }
    }

    fetchMeta()
    intervalRef.current = setInterval(fetchMeta, 5 * 60 * 1000) // re-fetch every 5 min

    return () => clearInterval(intervalRef.current)
  }, [visible])

  if (!visible || !frame) return null

  return (
    <TileLayer
      url={`https://tilecache.rainviewer.com${frame}/256/{z}/{x}/{y}/2/1_1.png`}
      opacity={0.5}
      zIndex={400}
      tileSize={256}
      // RainViewer radar tiles only exist for z=3..10; above that they return
      // an error-tile image that says "zoom level not supported". Capping the
      // native zoom makes Leaflet upscale the z=10 tiles instead.
      minNativeZoom={3}
      maxNativeZoom={10}
    />
  )
}

export default RainOverlay
