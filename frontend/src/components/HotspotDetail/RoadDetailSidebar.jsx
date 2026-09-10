/**
 * Hotspot Detail Sidebar - Desktop Component
 * Fixed right sidebar (25% width) with spring slide-in/out,
 * staggered section reveal, and animated risk-score count-up.
 *
 * @see design.md Section 5.2 - Road Segment Detail Card
 * @see design.md Section 8 - Layout Structure
 * @see design.md Section 15 - Drainage UI
 */

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { formatIST } from '../../utils/dateUtils'
import { formatRiskScore } from '../../utils/formatting'
import { submitFeedback } from '../../utils/api'

const riskColors = {
  normal: '#9CA3AF',
  low: '#10B981',
  moderate: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444'
}

// ── Animated risk counter ──────────────────────────────────────────
function AnimatedRiskScore({ value }) {
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { damping: 18, stiffness: 80 })
  const display = useTransform(spring, (v) => formatRiskScore(Math.round(v)))
  const ref = useRef(null)

  useEffect(() => {
    mv.set(value ?? 0)
  }, [value, mv])

  return <motion.span className="font-mono text-4xl font-bold text-text-primary">{display}</motion.span>
}

// ── Stagger orchestration ──────────────────────────────────────────
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
}

function RoadDetailSidebar({ isOpen = true, onClose, hotspot, onFeedbackSuccess }) {
  const [feedback, setFeedback] = useState({ state: 'idle', selected: null })

  // Guard against null hotspot (e.g. before data loads or when nothing is
  // selected) — the sidebar is always mounted, so the body below must not
  // dereference hotspot.effective_drainage_index when it is null.
  if (!hotspot) return null

  const handleFeedback = async (isFlooded) => {
    if (!hotspot || feedback.state === 'submitting') return
    setFeedback({ state: 'submitting', selected: isFlooded ? 'yes' : 'no' })
    try {
      await submitFeedback({
        hotspotId: hotspot.hotspot_id,
        hotspotName: hotspot.hotspot_name,
        isFlooded,
        timestamp: new Date().toISOString(),
        area: hotspot.area,
      })
    } catch (e) {
      console.warn('Feedback submit failed (showing easter egg anyway):', e)
    }
    setFeedback({ state: 'done', selected: isFlooded ? 'yes' : 'no' })
    if (onClose) onClose()
    if (onFeedbackSuccess) onFeedbackSuccess(isFlooded)
  }

  const ediColor =
    hotspot.effective_drainage_index >= 0.6 ? '#10B981' :
    hotspot.effective_drainage_index >= 0.4 ? '#F59E0B' :
    '#EF4444'

  const recoveryColor =
    (hotspot.recovery_time_minutes || 0) < 10 ? '#10B981' :
    (hotspot.recovery_time_minutes || 0) < 30 ? '#F59E0B' :
    '#EF4444'

  const recoveryWidth = Math.min(100, ((hotspot.recovery_time_minutes || 0) / 60) * 100)

  return (
    <AnimatePresence>
      {isOpen && hotspot && (
        <motion.div
          key="road-detail-sidebar"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-96 lg:w-[28%] min-w-[320px] max-w-[460px] bg-bg-surface border-l border-border overflow-y-auto shadow-2xl z-[1000]"
        >
          {/* Header */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="sticky top-0 bg-bg-surface z-10 flex justify-between items-center p-6 border-b border-border"
          >
            <motion.div variants={fadeUp}>
              <h2 className="text-lg font-bold text-text-primary">
                {hotspot.hotspot_name}
              </h2>
              <p className="text-text-secondary text-xs">
                {hotspot.area}
              </p>
            </motion.div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-primary active:scale-90 transition-all"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>

          <motion.div
            className="p-6 space-y-5"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {/* Risk Score — animated count-up */}
            <motion.div variants={fadeUp} className="bg-bg-surface rounded-lg p-4 border border-border">
              <div className="flex items-baseline gap-2">
                <AnimatedRiskScore value={hotspot.risk_score} />
                <span className="text-text-secondary text-sm">/ 100</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white tracking-wide"
                  style={{
                    backgroundColor: riskColors[hotspot.risk_level] || '#9CA3AF',
                    boxShadow: `0 2px 10px ${riskColors[hotspot.risk_level] || '#9CA3AF'}44`,
                  }}
                >
                  {hotspot.risk_level?.toUpperCase()}
                </span>
              </div>
            </motion.div>

            {/* Prediction Details */}
            <motion.div variants={fadeUp} className="space-y-3">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                Predictions
              </h3>

              {[
                { label: 'Onset Time', value: hotspot.onset_minutes ? `~${hotspot.onset_minutes} min` : 'N/A' },
                { label: 'Duration', value: hotspot.duration_minutes ? `~${hotspot.duration_minutes} min` : 'N/A' },
                { label: 'Rainfall', value: `${hotspot.metadata?.rainfall_intensity_mmhr || 'N/A'} mm/hr` },
                { label: 'Traffic Impact', value: `${hotspot.metadata?.traffic_slowdown_percent || 'N/A'}% slower` },
                { label: 'Water Depth', value: hotspot.metadata?.water_depth_expected || 'N/A' },
                { label: 'Drainage Status', value: hotspot.drainage_status || 'N/A' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-bg-surface rounded-lg p-3 border border-border">
                  <span className="text-xs text-text-secondary">{item.label}</span>
                  <span className="text-sm font-semibold text-text-primary">{item.value}</span>
                </div>
              ))}
            </motion.div>

            {/* Recovery Time */}
            <motion.div variants={fadeUp} className="bg-bg-surface rounded-lg p-4 border border-border">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                🌊 RECOVERY TIME
              </h3>
              <div className="flex items-center gap-4">
                <div className="font-mono text-2xl font-bold" style={{ color: recoveryColor }}>
                  ~{hotspot.recovery_time_minutes} min
                </div>
                <div className="flex-1 h-3 bg-bg-primary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${recoveryWidth}%`, backgroundColor: recoveryColor }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: recoveryColor }} />
                <span className="text-xs text-text-secondary">
                  {hotspot.recovery_time_minutes < 10 ? 'Clearing soon' :
                   hotspot.recovery_time_minutes < 30 ? 'Moderate recovery' :
                   'Slow recovery needed'}
                </span>
              </div>
              {hotspot.drainage_trend && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-text-secondary">Trend:</span>
                  <span className={`text-xs font-semibold ${
                    hotspot.drainage_trend === 'worsening' ? 'text-red-400' :
                    hotspot.drainage_trend === 'improving' ? 'text-green-400' :
                    'text-yellow-400'
                  }`}>
                    {hotspot.drainage_trend === 'worsening' ? '↓' :
                     hotspot.drainage_trend === 'improving' ? '↑' : '→'}
                    {' '}{hotspot.drainage_trend.charAt(0).toUpperCase() + hotspot.drainage_trend.slice(1)}
                  </span>
                </div>
              )}
            </motion.div>

            {/* EDI Badge */}
            <motion.div variants={fadeUp} className="bg-bg-surface rounded-lg p-4 border border-border">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Effective Drainage Index
              </h3>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full border-2 flex items-center justify-center font-mono font-bold text-lg"
                  style={{ borderColor: ediColor, color: ediColor, backgroundColor: `${ediColor}12`, boxShadow: `0 0 0 3px ${ediColor}10` }}
                >
                  {hotspot.effective_drainage_index?.toFixed(2)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    {hotspot.effective_drainage_index >= 0.6 ? 'Good' :
                     hotspot.effective_drainage_index >= 0.4 ? 'Moderate' : 'Poor'}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {hotspot.effective_drainage_index >= 0.6 ? 'Drainage handles rainfall efficiently' :
                     hotspot.effective_drainage_index >= 0.4 ? 'Some water accumulation' :
                     'Significant drainage impairment'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Alternate Routes */}
            {hotspot.metadata?.alternate_routes && hotspot.metadata.alternate_routes.length > 0 && (
              <motion.div variants={fadeUp} className="bg-bg-surface rounded-lg p-4 border border-border">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Alternate Routes
                </h3>
                <ul className="space-y-1">
                  {hotspot.metadata.alternate_routes.map((route, i) => (
                    <li key={i} className="text-sm text-text-primary flex items-start gap-2">
                      <span className="text-accent">→</span>
                      {route}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Last Updated */}
            <motion.div variants={fadeUp} className="text-xs text-text-secondary text-center pb-4">
              Last updated: {formatIST(hotspot.last_updated)}
            </motion.div>

            {/* Feedback */}
            <motion.div variants={fadeUp} className="bg-bg-surface rounded-lg p-4 border border-border text-center">
              <div className="text-xs text-text-secondary mb-2">
                Is this road flooded now?
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => handleFeedback(true)}
                  disabled={feedback.state === 'submitting'}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 active:scale-95 disabled:opacity-50 transition-all"
                  aria-label="Yes, this road is flooded"
                >
                  ✓ Yes, flooded
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  disabled={feedback.state === 'submitting'}
                  className="px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 active:scale-95 disabled:opacity-50 transition-all"
                  aria-label="No, this road is clear"
                >
                  ✗ No, clear
                </button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default RoadDetailSidebar
