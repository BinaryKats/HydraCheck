/**
 * Route Finder Panel
 * Two typeahead inputs (From / To), a "Find Safest Route" button,
 * and a result card that summarizes the computed route.
 * Consumes `findSafestRoute` from routing.js.
 *
 * SIH 2026 — Delhi Hyperlocal Waterlogging Prediction
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Route, MapPin, Navigation } from 'lucide-react'
import { getAllHotspots } from '../../utils/api'
import { findSafestRoute } from '../../utils/routing'

const RISK_COLORS = {
  normal: '#9CA3AF',
  low: '#10B981',
  moderate: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
}

function normalizeH(h) {
  return {
    id: h.hotspot_id,
    name: h.hotspot_name || '',
    area: h.area || '',
    road: h.road_name_osm || '',
    risk_level: h.risk_level || 'normal',
    lat: h.coordinates?.lat,
    lng: h.coordinates?.lng,
    _raw: h,
  }
}

function TypeaheadInput({ label, value, onSelect, placeholder }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const debounceRef = useRef(null)

  const doSearch = useCallback(async (q) => {
    const needle = q.trim().toLowerCase()
    if (needle.length < 2) { setResults([]); setOpen(false); return }
    try {
      const res = await getAllHotspots()
      const list = Array.isArray(res) ? res : res.data || []
      const matches = list
        .map(normalizeH)
        .filter((h) => {
          return (
            h.name.toLowerCase().includes(needle) ||
            h.area.toLowerCase().includes(needle) ||
            h.road.toLowerCase().includes(needle)
          )
        })
        .slice(0, 6)
      setResults(matches)
      setOpen(matches.length > 0)
    } catch {
      setResults([])
      setOpen(false)
    }
  }, [])

  const handleChange = (e) => {
    const v = e.target.value
    setQuery(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(v), 250)
  }

  const handleSelect = (match) => {
    setQuery(match.name)
    setOpen(false)
    setResults([])
    onSelect(match._raw)
  }

  // Keep query in sync when parent clears it
  useEffect(() => {
    if (!value) setQuery('')
  }, [value])

  return (
    <div className="relative">
      <label className="flex items-center gap-1 text-xs font-semibold text-text-secondary tracking-wide mb-1">
        <MapPin className="w-3.5 h-3.5" />
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => { setIsFocused(false); setOpen(false) }, 150)}
          className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
        />
        {query && isFocused && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); onSelect(null) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            aria-label={`Clear ${label}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full mt-1 bg-bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-10"
          >
            {results.map((m) => (
              <button
                key={m.id}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(m) }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-bg-primary transition-colors border-b border-border/40 last:border-0"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: RISK_COLORS[m.risk_level] || '#9CA3AF' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text-primary truncate">{m.name}</div>
                  <div className="text-xs text-text-secondary truncate">{m.area}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RouteFinder({ isOpen, onClose, allHotspots, onRouteFound, onRouteClear }) {
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)

  // Reset summary when either endpoint changes
  useEffect(() => { setSummary(null); setError(null) }, [origin, destination])
  useEffect(() => {
    if (!isOpen) { setSummary(null); setError(null) }
  }, [isOpen])

  const handleFindRoute = () => {
    if (!origin || !destination) return
    const res = findSafestRoute(
      allHotspots || [],
      { lat: origin.coordinates.lat, lng: origin.coordinates.lng },
      { lat: destination.coordinates.lat, lng: destination.coordinates.lng },
    )
    if (!res) {
      setError('No safe route found — points may be disconnected or identical.')
      return
    }
    setSummary(res)
    setError(null)
    onRouteFound?.(res.path, res)
  }

  const handleClear = () => {
    setSummary(null)
    setError(null)
    onRouteClear?.()
  }

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="route-finder"
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="fixed top-20 left-4 z-[1000] w-[300px] bg-bg-surface rounded-xl shadow-xl border border-border p-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
              <Route className="w-4 h-4 text-accent" />
              Safest Route
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full hover:bg-bg-primary flex items-center justify-center text-text-secondary hover:text-text-primary"
              aria-label="Close route finder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <TypeaheadInput
              label="From"
              value={origin}
              onSelect={setOrigin}
              placeholder="Search start location…"
            />
            <TypeaheadInput
              label="To"
              value={destination}
              onSelect={setDestination}
              placeholder="Search destination…"
            />

            <button
              onClick={handleFindRoute}
              disabled={!origin || !destination}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <Navigation className="w-4 h-4" />
              Find Safest Route
            </button>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                {error}
              </div>
            )}

            {summary && (
              <div className="rounded-lg bg-bg-primary border border-border p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>Avoids <strong className="text-text-primary">{summary.criticalRoadsAvoided}</strong> critical road(s)</span>
                  <span>+ <strong className="text-text-primary">{summary.addedMinutes}</strong> min vs direct</span>
                </div>
                <div className="text-xs text-text-secondary">
                  Total: {summary.totalDistanceKm} km · {summary.path.length} segments
                </div>
                <button
                  onClick={handleClear}
                  className="w-full mt-1 text-xs text-text-secondary hover:text-text-primary underline"
                >
                  Clear route
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default RouteFinder
