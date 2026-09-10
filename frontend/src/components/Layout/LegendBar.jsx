/**
 * Legend Bar Component
 * Bottom bar displaying risk counts and drainage status.
 * Risk count pills are now interactive toggles — click to show/hide that level.
 *
 * @see design.md Section 15 - Drainage UI
 */

import { getAllHotspots } from '../../utils/api'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LEVEL_CONFIG = [
  { key: 'critical', color: '#EF4444', label: 'Critical' },
  { key: 'high',     color: '#F97316', label: 'High' },
  { key: 'moderate', color: '#F59E0B', label: 'Moderate' },
  { key: 'normal',   color: '#10B981', label: 'Low/Normal' },
]

function LegendBar({ filterLevels, onToggleFilterLevel, onClearFilters }) {
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({
    critical: 0,
    high: 0,
    moderate: 0,
    normal: 0,
    activeRecovery: 0,
    slowRecovery: 0,
  })

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const response = await getAllHotspots()
        const data = Array.isArray(response) ? response : response.data || []
        if (!isMounted) return

        const riskCounts = data.reduce((acc, h) => {
          acc[h.risk_level] = (acc[h.risk_level] || 0) + 1
          return acc
        }, {})

        const drainageCounts = data.reduce((acc, h) => {
          const t = h.recovery_time_minutes || 0
          if (t < 15) acc.activeRecovery = (acc.activeRecovery || 0) + 1
          else acc.slowRecovery = (acc.slowRecovery || 0) + 1
          return acc
        }, {})

        setCounts({
          critical: riskCounts.critical || 0,
          high: riskCounts.high || 0,
          moderate: riskCounts.moderate || 0,
          normal: (riskCounts.low || 0) + (riskCounts.normal || 0),
          activeRecovery: drainageCounts.activeRecovery || 0,
          slowRecovery: drainageCounts.slowRecovery || 0,
        })
        setLoading(false)
      } catch (error) {
        console.error('Failed to load hotspots for legend:', error)
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => { isMounted = false }
  }, [])

  const filteringActive = filterLevels && filterLevels.size < 4

  if (loading) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[900] flex justify-center space-x-3">
        <div className="bg-bg-surface rounded-full px-3 py-1.5 text-xs text-text-secondary animate-pulse">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[900] flex flex-col items-center gap-2">
      {/* Filter indicator — appears when not all levels are visible */}
      <AnimatePresence>
        {filteringActive && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex items-center gap-2 bg-bg-surface/90 backdrop-blur-sm rounded-full px-3 py-1 text-[11px] text-text-secondary border border-border"
          >
            <span>Filtering: {filterLevels.size} of {LEVEL_CONFIG.length} active</span>
            <button
              onClick={onClearFilters}
              className="text-accent hover:underline font-medium ml-1"
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {/* Risk Counts — interactive toggle buttons */}
        <div className="flex items-center space-x-2">
          {LEVEL_CONFIG.map(({ key, color, label }) => {
            const count = counts[key] || 0
            if (count === 0) return null
            const isActive = !filterLevels || filterLevels.has(key)

            return (
              <motion.button
                key={key}
                layout
                whileTap={{ scale: 0.95 }}
                onClick={() => onToggleFilterLevel && onToggleFilterLevel(key)}
                className={`flex items-center gap-1 bg-bg-surface rounded-full px-3 py-1.5 text-xs font-medium border border-border transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-40'
                }`}
                aria-label={`${isActive ? 'Hide' : 'Show'} ${label} roads`}
                title={`${label}: ${count} roads — click to ${isActive ? 'hide' : 'show'}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full transition-colors"
                  style={{ backgroundColor: isActive ? color : '#9CA3AF' }}
                />
                <span className={isActive ? '' : 'line-through'}>{count}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Drainage recovery — non-interactive (different dimension) */}
        <div className="flex items-center space-x-2">
          {counts.activeRecovery > 0 && (
            <div className="flex items-center gap-1 bg-bg-surface rounded-full px-3 py-1.5 text-xs font-medium border border-border">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
              <span>{counts.activeRecovery}</span>
            </div>
          )}
          {counts.slowRecovery > 0 && (
            <div className="flex items-center gap-1 bg-bg-surface rounded-full px-3 py-1.5 text-xs font-medium border border-border">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#F97316' }} />
              <span>{counts.slowRecovery}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LegendBar