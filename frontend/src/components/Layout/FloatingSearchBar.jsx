/**
 * Floating Search Bar Component
 * Rounded pill at top with hamburger, search input, and settings.
 * Debounced search with results dropdown that flies to a selected hotspot.
 * When the input is focused and empty, shows "Recent" (last 3 picks) and
 * "Nearby" (3 closest to the current map center).
 *
 * @see design.md Section 8 - Layout Structure
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, Settings, X, Clock, MapPin } from 'lucide-react'
import { getAllHotspots } from '../../utils/api'
import { haversineKm } from '../../utils/geo'

const RISK_COLORS = {
  normal: '#9CA3AF',
  low: '#10B981',
  moderate: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
}

const HISTORY_KEY = 'dhm_search_history'
const HISTORY_MAX = 3

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.slice(0, HISTORY_MAX) : []
  } catch { return [] }
}
function saveHistory(h) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, HISTORY_MAX)))
  } catch { /* ignore quota / disabled storage */ }
}

function HotspotRow({ h, onSelect, rightLabel }) {
  return (
    <button
      onClick={() => onSelect(h)}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-bg-primary active:bg-accent/5 transition-all border-b border-border/40 last:border-0 group"
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-transparent group-hover:ring-current/10 transition-all"
        style={{ backgroundColor: RISK_COLORS[h.risk_level] || '#9CA3AF' }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">{h.hotspot_name}</div>
        <div className="text-xs text-text-secondary truncate">{h.area}</div>
      </div>
      {rightLabel && (
        <span className="text-xs font-mono text-text-secondary flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">{rightLabel}</span>
      )}
    </button>
  )
}

function SectionHeader({ icon: Icon, label, action }) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5 text-[10px] uppercase tracking-wider text-text-secondary font-semibold">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      {action}
    </div>
  )
}

function FloatingSearchBar({ onMenuClick, onSearch, searchQuery, onSettingsClick, onSelectResult, mapCenter }) {
  const [localQuery, setLocalQuery] = useState(searchQuery || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [history, setHistory] = useState(() => loadHistory())
  const [allHotspots, setAllHotspots] = useState([])
  const [nearby, setNearby] = useState([])
  const debounceRef = useRef(null)
  const panelRef = useRef(null)

  // Sync incoming searchQuery to local state
  useEffect(() => {
    if (searchQuery === '') {
      setLocalQuery('')
      setResults([])
      setOpen(false)
    }
  }, [searchQuery])

  // Load all hotspots once for nearby + history rendering
  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const res = await getAllHotspots()
        if (!isMounted) return
        setAllHotspots(Array.isArray(res) ? res : res.data || [])
      } catch { /* silently skip */ }
    }
    load()
    return () => { isMounted = false }
  }, [])

  // Compute nearby when focused and center changes
  useEffect(() => {
    if (!isFocused || allHotspots.length === 0 || (mapCenter && (mapCenter.lat == null))) {
      setNearby([])
      return
    }
    const center = mapCenter && mapCenter.lat != null ? mapCenter : { lat: 28.6139, lng: 77.2090 }
    const sorted = allHotspots
      .filter((h) => h.coordinates?.lat != null)
      .map((h) => ({
        ...h,
        _distKm: haversineKm(center.lat, center.lng, h.coordinates.lat, h.coordinates.lng),
      }))
      .sort((a, b) => a._distKm - b._distKm)
      .slice(0, 3)
    setNearby(sorted)
  }, [isFocused, allHotspots, mapCenter])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const doSearch = useCallback(async (query) => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) { setResults([]); setOpen(false); return }

    setLoading(true)
    try {
      const list = allHotspots.length > 0 ? allHotspots : (await getAllHotspots().then(r => Array.isArray(r) ? r : r.data || []))
      const matches = list.filter((h) => {
        const name = (h.hotspot_name || '').toLowerCase()
        const area = (h.area || '').toLowerCase()
        const road = (h.road_name_osm || '').toLowerCase()
        return name.includes(q) || area.includes(q) || road.includes(q)
      }).slice(0, 6)
      setResults(matches)
      setOpen(matches.length > 0)
    } catch {
      setResults([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [allHotspots])

  const handleChange = (value) => {
    setLocalQuery(value)
    onSearch?.(value)
    if (value.trim().length < 2) { setOpen(false); setResults([]); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 250)
  }

  const handleClear = () => {
    setLocalQuery('')
    setResults([])
    setOpen(false)
    onSearch?.('')
  }

  const handleSelect = (hotspot) => {
    setLocalQuery(hotspot.hotspot_name || '')
    setOpen(false)
    setIsFocused(false)
    onSearch?.(hotspot.hotspot_name || '')
    onSelectResult?.(hotspot)

    if (hotspot?.hotspot_id) {
      const entry = {
        hotspot_id: hotspot.hotspot_id,
        hotspot_name: hotspot.hotspot_name,
        area: hotspot.area,
        risk_level: hotspot.risk_level,
        risk_score: hotspot.risk_score,
        coordinates: hotspot.coordinates,
      }
      const next = [entry, ...history.filter((h) => h.hotspot_id !== hotspot.hotspot_id)].slice(0, HISTORY_MAX)
      setHistory(next)
      saveHistory(next)
    }
  }

  const handleClearHistory = () => { setHistory([]); saveHistory([]) }

  const showingEmptyMenu = isFocused && localQuery.trim().length < 2

  return (
    <div className="fixed top-4 left-4 right-4 z-[1000] md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-md" ref={panelRef}>
      <div className={`bg-bg-surface rounded-full shadow-lg border flex items-center px-4 py-2.5 transition-all duration-200 ${
        isFocused ? 'border-accent/40 shadow-xl scale-[1.02] search-focus-glow' : 'border-border'
      }`}>
        <button
          onClick={onMenuClick}
          className="flex-shrink-0 p-1.5 -ml-1 mr-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-bg-primary active:scale-90"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 flex items-center">
          <Search className={`w-4 h-4 mr-2 flex-shrink-0 transition-colors ${isFocused ? 'text-accent' : 'text-text-secondary'}`} />
          <input
            type="text"
            placeholder="Search location or road..."
            value={localQuery}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="w-full bg-transparent text-sm text-text-primary placeholder-text-secondary focus:outline-none"
          />
          {loading && <span className="spinner ml-2 flex-shrink-0" />}
          {localQuery && !loading && (
            <button
              onClick={handleClear}
              className="p-1 text-text-secondary hover:text-text-primary ml-1 rounded-full hover:bg-bg-primary active:scale-90 transition-all"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={onSettingsClick}
          className="flex-shrink-0 p-1.5 ml-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-bg-primary active:scale-90"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Empty-focus dropdown: Recent + Nearby */}
      <AnimatePresence>
        {showingEmptyMenu && (history.length > 0 || nearby.length > 0) && (
          <motion.div
            key="empty-menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="mt-2 bg-bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            {history.length > 0 && (
              <>
                <SectionHeader
                  icon={Clock}
                  label="Recent"
                  action={
                    <button
                      onClick={handleClearHistory}
                      className="text-text-secondary hover:text-text-primary normal-case tracking-normal"
                      aria-label="Clear recent searches"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  }
                />
                {history.map((h) => (
                  <HotspotRow key={h.hotspot_id} h={h} onSelect={handleSelect} />
                ))}
              </>
            )}
            {nearby.length > 0 && (
              <>
                <SectionHeader icon={MapPin} label="Nearby" />
                {nearby.map((h) => (
                  <HotspotRow
                    key={h.hotspot_id}
                    h={h}
                    onSelect={handleSelect}
                    rightLabel={h._distKm < 1 ? `${(h._distKm * 1000).toFixed(0)} m` : `${h._distKm.toFixed(1)} km`}
                  />
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live results dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="search-results"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="mt-2 bg-bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            {results.map((h) => (
              <HotspotRow key={h.hotspot_id} h={h} onSelect={handleSelect} rightLabel={h.risk_score} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-text-secondary">
                <span className="spinner" />
                Searching…
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No-results hint */}
      {localQuery.trim().length >= 2 && !loading && !open && (
        <div className="mt-2 bg-bg-surface/95 backdrop-blur-md border border-border rounded-xl px-4 py-3 text-xs text-text-secondary shadow-xl flex items-center gap-2">
          <Search className="w-3.5 h-3.5 opacity-50" />
          No matches for "<span className="font-medium text-text-primary">{localQuery.trim()}</span>"
        </div>
      )}
    </div>
  )
}

export default FloatingSearchBar
