import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import { Sun, Moon, ChevronDown, ChevronUp } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import RiskRoadLayer from './RiskRoadLayer'
import DrainageLayer from './DrainageLayer'
const HotspotDetailBottomSheet = React.lazy(() => import('../HotspotDetail/BottomSheet'))
const HotspotDetailSidebar = React.lazy(() => import('../HotspotDetail/RoadDetailSidebar'))
const CatThankYou = React.lazy(() => import('../Feedback/CatThankYou'))
import FloatingSearchBar from '../Layout/FloatingSearchBar'
import MapControls from '../Layout/MapControls'
const LayerToggle = React.lazy(() => import('../Layout/LayerToggle'))
const AlertDrawer = React.lazy(() => import('../Alerts/AlertDrawer'))
const MainNavigation = React.lazy(() => import('../Navigation/MainNavigation'))
const TimeScrubber = React.lazy(() => import('../Layout/TimeScrubber'))
const RouteFinder = React.lazy(() => import('../Layout/RouteFinder'))
const RainOverlay = React.lazy(() => import('./RainOverlay'))
import { ProfileView, PolicyView, LoginView, AboutView } from '../Navigation/NavPages'
import TrendsInsights from '../Trends/TrendsInsights'
import Toast, { useToast } from '../Layout/Toast'
import LoadingScreen from '../Layout/LoadingScreen'
import useMediaQuery from '../../hooks/useMediaQuery'
import { getAllHotspots } from '../../utils/api'
import 'leaflet/dist/leaflet.css'


const DELHI_CENTER = [28.6139, 77.2090]
const DELHI_BOUNDS = [
  [28.4, 76.8],  // Southwest
  [28.9, 77.4]   // Northeast
]

// CartoDB Dark Matter tiles (dark mode)
const DARK_TILES = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  subdomains: 'abcd',
  maxZoom: 19,
  attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}

// Standard OSM tiles — the colorful, geographically detailed basemap
// (green parks, blue water, buildings, colored roads) used in light mode.
const OSM_TILES = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  subdomains: 'abc',
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}

// Component to update map reference
function MapRefSetter({ mapRef }) {
  const map = useMap()
  useEffect(() => {
    mapRef.current = map
  }, [map, mapRef])
  return null
}

/** Tracks map center for the "Nearby" feature in FloatingSearchBar. */
function MapCenterTracker({ onCenterChange }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    const emit = () => {
      const c = map.getCenter()
      onCenterChange(c.lat, c.lng)
    }
    emit()
    map.on('moveend', emit)
    return () => map.off('moveend', emit)
  }, [map, onCenterChange])
  return null
}

/**
 * CollapsibleTimeScrubber — a fixed-position chevron + panel that aligns
 * vertically with the FloatingSearchBar pill. The chevron sits centered
 * just below the search bar; when expanded the panel occupies the same
 * slot the chevron occupied, so only a single outer wrapper's height
 * animates — the inner chrome (pill + slider) never moves, avoiding the
 * "nested motion double-nudge" that makes height-animate patterns look ugly.
 *
 * Props mirror TimeScrubber: { timeMinutes, onTimeChange, isPlaying, onTogglePlay }
 * Extra: { isExpanded, onToggle } for the collapse/expand state.
 */
function CollapsibleTimeScrubber({
  timeMinutes = 0,
  onTimeChange,
  isPlaying = false,
  onTogglePlay,
  isExpanded = false,
  onToggle,
}) {
  return (
    <div
      className="fixed left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[950]
                 top-[4.75rem] flex flex-col items-center"
    >
      {/* Centered chevron — always visible, never moves */}
      <motion.button
        type="button"
        onClick={onToggle}
        whileTap={{ scale: 0.85 }}
        transition={{ type: 'spring', damping: 20, stiffness: 400 }}
        aria-label={isExpanded ? 'Collapse forecast timeline' : 'Expand forecast timeline'}
        aria-expanded={isExpanded}
        title={isExpanded ? 'Hide forecast timeline' : 'Show forecast timeline'}
        className="w-7 h-7 rounded-full bg-bg-surface/90 backdrop-blur-md border border-border
                   shadow-md flex items-center justify-center text-text-secondary
                   hover:text-text-primary hover:bg-bg-surface transition-colors"
      >
        {isExpanded
          ? <ChevronUp className="w-4 h-4" />
          : <ChevronDown className="w-4 h-4" />}
      </motion.button>

      {/* Height-animated slot. The panel pre-occupies its own space,
          so the scrubber pill is never re-animated separately. */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="overflow-hidden w-auto mt-2"
      >
        {/* inner wrapper pads the overflow:hidden edge so the pill's rounded
            corners aren't clipped mid-animation */}
        <div className="pb-1">
          <TimeScrubber
            timeMinutes={timeMinutes}
            onTimeChange={onTimeChange}
            isPlaying={isPlaying}
            onTogglePlay={onTogglePlay}
          />
        </div>
      </motion.div>
    </div>
  )
}

function MapView() {
  const [selectedHotspot, setSelectedHotspot] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showLayersMenu, setShowLayersMenu] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNav, setShowNav] = useState(false)
  const [activeNavPage, setActiveNavPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [catThanks, setCatThanks] = useState(null) // null | true (flooded) | false (clear)
  const [justReportedId, setJustReportedId] = useState(null) // hotspot that just got feedback
  const [hotspots, setHotspots] = useState([]) // Store all hotspots for auto-selection
  const mapRef = useRef(null)

  // Legend filter state — Set of active risk level keys (never empty)
  const [filterLevels, setFilterLevels] = useState(() => new Set(['critical', 'high', 'moderate', 'normal']))
  const handleToggleFilterLevel = (level) => {
    setFilterLevels(prev => {
      const next = new Set(prev)
      if (next.has(level)) {
        if (next.size === 1) return prev // never empty
        next.delete(level)
      } else {
        next.add(level)
      }
      return next
    })
  }
  const handleClearFilters = () => setFilterLevels(new Set(['critical', 'high', 'moderate', 'normal']))

  // Time scrubber state
  const [timeMinutes, setTimeMinutes] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playIntervalRef = useRef(null)

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setTimeMinutes(prev => {
          if (prev >= 360) {
            setIsPlaying(false)
            return 360
          }
          return prev + 1
        })
      }, 50) // 50ms per minute → 18s for full 6h
    } else {
      clearInterval(playIntervalRef.current)
    }
    return () => clearInterval(playIntervalRef.current)
  }, [isPlaying])

  // Route finder state
  const [showRouteFinder, setShowRouteFinder] = useState(false)
  const [routePath, setRoutePath] = useState(null)
  const [routeSummary, setRouteSummary] = useState(null)

  const handleRouteFound = (path, summary) => {
    setRoutePath(path)
    setRouteSummary(summary)
  }
  const handleRouteClear = () => {
    setRoutePath(null)
    setRouteSummary(null)
  }

  // Rainfall overlay state
  const [showRain, setShowRain] = useState(false)

  // Timeline expand/collapse state for the collapsible timer below the search bar
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false)

  // Map center tracker — used by FloatingSearchBar to compute "Nearby"
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 })
  const handleCenterChange = useCallback((lat, lng) => {
    if (lat == null || lng == null) return
    setMapCenter({ lat, lng })
  }, [])

  // Keep the global UI theme (index.css tokens) in sync with the map tiles.
  // Light is the default; flipping the toggle sets data-theme on <html>.
  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light'
    return () => delete document.documentElement.dataset.theme
  }, [isDarkMode])

  // Layer state
  const [activeLayers, setActiveLayers] = useState(['risk', 'drainage'])
  const [fusionMode, setFusionMode] = useState(false)

  // Toast state
  const { toasts, dismissToast, toast } = useToast()

  // Settings toggles — each is a small local preference.
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(false)

  // Cluster density multiplier — 1 = default; <1 finer (street), >1 coarser (city).
  const [densityMultiplier, setDensityMultiplier] = useState(1)

  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1024px)')

  // Light mode (default) = colorful OSM basemap; dark mode = Dark Matter.
  const tiles = isDarkMode ? DARK_TILES : OSM_TILES

  // Fetch hotspots — the LoadingScreen stays visible until this finishes.
  // Toast notification appears immediately and dismisses when the load completes
  // (or after a 0.5s minimum so it doesn't flash).
  useEffect(() => {
    let cancelled = false

    async function loadInitialHotspots() {
      const start = Date.now()
      const toastId = toast.neutral('Loading hotspots…', 0) // 0 = don't auto-dismiss
      try {
        const { data } = await getAllHotspots()
        if (!cancelled) setHotspots(data || [])
      } catch (error) {
        console.warn('Could not load hotspots for details panel:', error)
      } finally {
        const elapsed = Date.now() - start
        const remaining = Math.max(0, 500 - elapsed)
        if (!cancelled) {
          setTimeout(() => {
            if (!cancelled) {
              setLoading(false)
              dismissToast(toastId)
            }
          }, remaining)
        }
      }
    }

    loadInitialHotspots()
    return () => { cancelled = true }
  }, [])

  const handleHotspotDoubleClick = (hotspot) => {
    setSelectedHotspot(hotspot)
    setShowDetail(true)
  }

  // Handle details icon click — open panel for selected hotspot or auto-select first
  const handleDetailsClick = () => {
    if (showDetail) {
      setShowDetail(false)
      // setSelectedHotspot(null) // Optional: keep selection or not? If we keep, it remembers the last selected.
    } else {
      if (selectedHotspot) {
        setShowDetail(true)
      } else {
        // Auto-select first hotspot so user has something to view
        const firstHotspot = hotspots[0] || null
        setSelectedHotspot(firstHotspot)
        setShowDetail(true)
      }
    }
  }

  const handleHotspotClick = (hotspot) => {
    setSelectedHotspot(hotspot)
    setShowDetail(true)
  }

  const handleClose = () => {
    setShowDetail(false)
    // setSelectedHotspot(null) // Optional: keep selection or not?
  }

  const handleLocate = async () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (mapRef.current) {
              mapRef.current.setView(
                [position.coords.latitude, position.coords.longitude],
                15
              )
            }
            resolve()
          },
          () => resolve()
        )
      } else {
        resolve()
      }
    })
  }

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev)
  }

  const handleToggleLayer = (layerId) => {
    setActiveLayers((prev) => {
      if (prev.includes(layerId)) {
        if (prev.length === 1) return prev
        return prev.filter((l) => l !== layerId)
      }
      return [...prev, layerId]
    })
  }

  const handleToggleFusion = () => {
    setFusionMode(!fusionMode)
  }

  // Search result selected — fly the map to it and open the detail panel.
  const handleSearchSelect = (hotspot) => {
    if (mapRef.current) {
      mapRef.current.flyTo(
        [hotspot.coordinates.lat, hotspot.coordinates.lng],
        16,
        { duration: 0.6, ease: 'easeOut' }
      )
    }
    setSelectedHotspot(hotspot)
    setShowDetail(true)
  }

  // Feedback submitted — flash the road on the map, then pop the cat toast.
  const handleFeedbackSuccess = (isFlooded) => {
    if (selectedHotspot) setJustReportedId(selectedHotspot.hotspot_id)
    setTimeout(() => setJustReportedId(null), 1500)
    setCatThanks(isFlooded)
  }

  const handleFeedbackSubmitted = (feedback) => {
    if (feedback.type === 'success') {
      toast.success(feedback.message)
    } else if (feedback.type === 'error') {
      toast.error(feedback.message)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  const showRiskLayer = activeLayers.includes('risk')
  const showDrainageLayer = activeLayers.includes('drainage')
  const isFusionMode = fusionMode && showRiskLayer && showDrainageLayer

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={DELHI_CENTER}
        zoom={12}
        minZoom={10}
        maxZoom={18}
        maxBounds={DELHI_BOUNDS}
        maxBoundsViscosity={1.0}
        zoomControl={true}
        attributionControl={true}
        className="h-full w-full"
      >
        <MapRefSetter mapRef={mapRef} />
        <MapCenterTracker onCenterChange={handleCenterChange} />
        <TileLayer
          key={tiles.url}
          attribution={tiles.attribution}
          url={tiles.url}
          subdomains={tiles.subdomains}
          maxZoom={tiles.maxZoom}
          errorTileUrl="https://tile.openstreetmap.org/12/1824/1172.png"
        />
        {showRiskLayer && (
          <RiskRoadLayer
            onHotspotClick={handleHotspotClick}
            onHotspotDoubleClick={handleHotspotClick}
            selectedId={showDetail && selectedHotspot ? selectedHotspot.hotspot_id : null}
            justReportedId={justReportedId}
            filterLevels={filterLevels}
            timeMinutes={timeMinutes}
            densityMultiplier={densityMultiplier}
          />
        )}
        {showDrainageLayer && (
          <DrainageLayer
            viewMode={isFusionMode ? 'fusion' : 'drainage'}
            fusionMode={isFusionMode}
            onHotspotClick={handleHotspotClick}
            selectedId={showDetail && selectedHotspot ? selectedHotspot.hotspot_id : null}
            justReportedId={justReportedId}
            filterLevels={filterLevels}
            timeMinutes={timeMinutes}
            densityMultiplier={densityMultiplier}
          />
        )}

        {/* Live rainfall overlay (under the road layers) */}
        <Suspense fallback={null}>
          <RainOverlay visible={showRain} />
        </Suspense>

        {/* Safest route polyline — cyan marching-ants */}
        {routePath && routePath.length > 0 && (
          <Polyline
            positions={routePath.map((p) => [p.lat, p.lng])}
            pathOptions={{
              color: '#06B6D4',
              weight: 5,
              opacity: 0.9,
              dashArray: '10 8',
              className: 'route-polyline-animated',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}
      </MapContainer>

      <FloatingSearchBar
        onMenuClick={() => setShowNav(true)}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        onSettingsClick={() => setShowSettings(true)}
        onSelectResult={handleSearchSelect}
        mapCenter={mapCenter}
      />

      <MapControls
        onLocate={handleLocate}
        onLayersClick={() => setShowLayersMenu(!showLayersMenu)}
        mapRef={mapRef}
        onAlertClick={() => setShowAlerts(true)}
        onRouteClick={() => setShowRouteFinder((prev) => !prev)}
        isRouteOpen={showRouteFinder}
        onRainToggle={() => setShowRain((prev) => !prev)}
        isRainActive={showRain}
      />

      <Suspense fallback={null}>
        <LayerToggle
          isOpen={showLayersMenu}
          onClose={() => setShowLayersMenu(false)}
          activeLayers={activeLayers}
          onToggleLayer={handleToggleLayer}
        />
      </Suspense>

      {isFusionMode && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[950] bg-purple-600/90 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
          Layer Fusion Mode Active
        </div>
      )}

      {/* Route summary pill banner */}
      {routeSummary && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[950] bg-cyan-600/90 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
          <span>Avoids {routeSummary.criticalRoadsAvoided} critical · +{routeSummary.addedMinutes} min vs direct</span>
          <button
            onClick={handleRouteClear}
            className="ml-1 w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            aria-label="Clear route"
          >
            ✕
          </button>
        </div>
      )}

      {/* Route finder panel */}
      <Suspense fallback={null}>
        <RouteFinder
          isOpen={showRouteFinder}
          onClose={() => setShowRouteFinder(false)}
          allHotspots={hotspots}
          onRouteFound={handleRouteFound}
          onRouteClear={handleRouteClear}
        />
      </Suspense>

      {/* ── Settings Sidebar ─────────────────────────────────────────────── */}
      {/* Backdrop — click to close */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1099] bg-black/30 backdrop-blur-[2px]"
            onClick={() => setShowSettings(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.aside
            key="settings-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed left-0 top-0 bottom-0 w-72 z-[1100] bg-bg-surface shadow-xl border-r border-border p-6 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-text-primary">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors"
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">

              {/* ── Display ─────────────────────────────────────────────── */}
              <section>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Display</h3>
                <div className="space-y-1">

                  {/* Theme toggle */}
                  <button
                    onClick={handleToggleDarkMode}
                    className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-bg-primary active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {isDarkMode
                        ? <Moon className="w-4 h-4 text-blue-400" />
                        : <Sun className="w-4 h-4 text-amber-500" />}
                      <span className="text-sm text-text-primary">{isDarkMode ? 'Dark mode' : 'Light mode'}</span>
                    </div>
                    <span
                      className="w-9 h-5 rounded-full relative transition-all duration-200"
                      style={{ backgroundColor: isDarkMode ? '#60A5FA' : '#CBD5E1' }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        style={{ left: isDarkMode ? 'calc(100% - 1.15rem)' : '0.15rem' }}
                      />
                    </span>
                  </button>

                  {/* Fusion mode */}
                  <button
                    onClick={handleToggleFusion}
                    className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-bg-primary active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-primary">Layer fusion</span>
                    </div>
                    <span
                      className="w-9 h-5 rounded-full relative transition-all duration-200"
                      style={{ backgroundColor: fusionMode ? '#9333EA' : '#CBD5E1' }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        style={{ left: fusionMode ? 'calc(100% - 1.15rem)' : '0.15rem' }}
                      />
                    </span>
                  </button>
                </div>
              </section>

              {/* ── Alerts ─────────────────────────────────────────────── */}
              <section className="pt-4 border-t border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Alerts</h3>
                <div className="space-y-1">

                  {/* Notifications */}
                  <button
                    onClick={() => setNotificationsEnabled(v => !v)}
                    className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-bg-primary active:scale-[0.98] transition-all"
                  >
                    <span className="text-sm text-text-primary">Notifications</span>
                    <span
                      className="w-9 h-5 rounded-full relative transition-all duration-200"
                      style={{ backgroundColor: notificationsEnabled ? '#10B981' : '#CBD5E1' }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        style={{ left: notificationsEnabled ? 'calc(100% - 1.15rem)' : '0.15rem' }}
                      />
                    </span>
                  </button>

                  {/* Sound alerts */}
                  <button
                    onClick={() => setSoundAlertsEnabled(v => !v)}
                    className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-bg-primary active:scale-[0.98] transition-all"
                  >
                    <span className="text-sm text-text-primary">Sound alerts</span>
                    <span
                      className="w-9 h-5 rounded-full relative transition-all duration-200"
                      style={{ backgroundColor: soundAlertsEnabled ? '#60A5FA' : '#CBD5E1' }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        style={{ left: soundAlertsEnabled ? 'calc(100% - 1.15rem)' : '0.15rem' }}
                      />
                    </span>
                  </button>

                  {/* Auto-refresh */}
                  <button
                    onClick={() => setAutoRefreshEnabled(v => !v)}
                    className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-bg-primary active:scale-[0.98] transition-all"
                  >
                    <span className="text-sm text-text-primary">Auto-refresh data</span>
                    <span
                      className="w-9 h-5 rounded-full relative transition-all duration-200"
                      style={{ backgroundColor: autoRefreshEnabled ? '#10B981' : '#CBD5E1' }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        style={{ left: autoRefreshEnabled ? 'calc(100% - 1.15rem)' : '0.15rem' }}
                      />
                    </span>
                  </button>
                </div>
              </section>

              {/* ── Map ────────────────────────────────────────────────── */}
              <section className="pt-4 border-t border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Map</h3>
                <div className="space-y-4 px-1">

                  {/* Cluster density */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-text-primary">Cluster density</span>
                      <span className="text-xs font-mono text-text-secondary">
                        {densityMultiplier < 0.8 ? 'Fine' : densityMultiplier > 1.2 ? 'Coarse' : 'Default'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={1.5}
                      step={0.1}
                      value={densityMultiplier}
                      onChange={(e) => setDensityMultiplier(Number(e.target.value))}
                      className="time-scrubber-range w-full"
                      style={{ background: `linear-gradient(to right, var(--color-accent) ${((densityMultiplier - 0.5) / 1) * 100}%, var(--color-border) ${((densityMultiplier - 0.5) / 1) * 100}%)` }}
                      aria-label="Cluster density multiplier"
                    />
                    <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                      <span>Fine</span>
                      <span>Default</span>
                      <span>Coarse</span>
                    </div>
                  </div>

                  {/* Reset clusters to default */}
                  {densityMultiplier !== 1 && (
                    <button
                      onClick={() => setDensityMultiplier(1)}
                      className="w-full text-xs text-accent hover:underline font-medium text-left"
                    >
                      Reset to default density
                    </button>
                  )}
                </div>
              </section>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <CollapsibleTimeScrubber
          timeMinutes={timeMinutes}
          onTimeChange={setTimeMinutes}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(p => !p)}
          isExpanded={isTimelineExpanded}
          onToggle={() => setIsTimelineExpanded(v => !v)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <AlertDrawer isOpen={showAlerts} onClose={() => setShowAlerts(false)} />
      </Suspense>

      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Always-mount the detail panel so AnimatePresence exit animations play */}
      <Suspense fallback={null}>
        {isMobile ? (
          <HotspotDetailBottomSheet
            isOpen={showDetail && !!selectedHotspot}
            hotspot={selectedHotspot}
            onClose={handleClose}
            onFeedbackSuccess={handleFeedbackSuccess}
          />
        ) : (
          <HotspotDetailSidebar
            isOpen={showDetail && !!selectedHotspot}
            hotspot={selectedHotspot}
            onClose={handleClose}
            onFeedbackSuccess={handleFeedbackSuccess}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <CatThankYou
          open={catThanks !== null}
          isFlooded={catThanks === true}
          onClose={() => setCatThanks(null)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MainNavigation
          isOpen={showNav}
          onClose={() => setShowNav(false)}
          onNavigate={setActiveNavPage}
        />
      </Suspense>

      {activeNavPage === 'trends' && <TrendsInsights onClose={() => setActiveNavPage(null)} />}
      {activeNavPage === 'profile' && <ProfileView onClose={() => setActiveNavPage(null)} />}
      {activeNavPage === 'policy' && <PolicyView onClose={() => setActiveNavPage(null)} />}
      {activeNavPage === 'login' && <LoginView onClose={() => setActiveNavPage(null)} />}
      {activeNavPage === 'about' && <AboutView onClose={() => setActiveNavPage(null)} />}
    </div>
  )
}

export default MapView