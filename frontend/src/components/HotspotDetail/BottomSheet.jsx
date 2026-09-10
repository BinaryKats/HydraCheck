/**
 * Hotspot Detail Bottom Sheet - Mobile Component
 * Slide-up panel that shows full details when tapping a road segment.
 * Spring slide-up with drag-to-dismiss and animated risk score.
 *
 * @see design.md Section 5.2 - Road Segment Detail Card
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { formatIST } from '../../utils/dateUtils'

const RISK_COLORS = {
  normal: '#9CA3AF',
  low: '#10B981',
  moderate: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
}
import { formatRiskScore } from '../../utils/formatting'
import { submitFeedback } from '../../utils/api'

// ── Animated risk counter ──────────────────────────────────────────
function AnimatedRiskScore({ value }) {
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { damping: 18, stiffness: 80 })
  const display = useTransform(spring, (v) => formatRiskScore(Math.round(v)))

  useEffect(() => { mv.set(value ?? 0) }, [value, mv])

  return <motion.span className="font-mono font-bold text-text-primary">{display}</motion.span>
}

const BottomSheet = ({ isOpen, onClose, hotspot, onFeedbackSuccess }) => {
  const [feedback, setFeedback] = useState({ state: 'idle', selected: null })
  const sheetRef = useRef(null)

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

  return (
    <AnimatePresence>
      {isOpen && hotspot && (
        <motion.div
          key="hotspot-bottom-sheet"
          className="fixed inset-x-0 bottom-0 z-50 h-[60vh]"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Sheet — draggable to dismiss */}
          <motion.div
            ref={sheetRef}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 && onClose) onClose()
            }}
            className="relative bg-bg-surface rounded-t-2xl shadow-2xl h-[55vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            <div className="px-6 pb-6 space-y-5">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    {hotspot.hotspot_name}
                  </h2>
                  <p className="text-text-secondary text-sm">
                    {hotspot.area}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-primary active:scale-90 transition-all"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Risk Score + EDI Badge */}
              <div className="flex items-center gap-4">
                {/* Risk Score — animated count-up */}
                <div className="bg-bg-surface rounded-lg px-4 py-3 border border-border">
                  <div className="text-3xl">
                    <AnimatedRiskScore value={hotspot.risk_score} />
                  </div>
                  <div className="text-xs text-text-secondary">/ 100</div>
                </div>

                {/* Risk Level Badge */}
                <div className="px-3 py-1.5 rounded-full text-xs font-bold text-white tracking-wide"
                  style={{
                    backgroundColor: RISK_COLORS[hotspot.risk_level] || '#9CA3AF',
                    boxShadow: `0 2px 10px ${RISK_COLORS[hotspot.risk_level] || '#9CA3AF'}44`,
                  }}
                >
                  {hotspot.risk_level?.toUpperCase()}
                </div>
              </div>

              {/* Prediction Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-surface rounded-lg p-3 border border-border">
                  <div className="text-xs text-text-secondary mb-1">Onset Time</div>
                  <div className="font-mono font-bold text-text-primary">
                    {hotspot.onset_minutes ? `${hotspot.onset_minutes} min` : 'N/A'}
                  </div>
                </div>

                <div className="bg-bg-surface rounded-lg p-3 border border-border">
                  <div className="text-xs text-text-secondary mb-1">Duration</div>
                  <div className="font-mono font-bold text-text-primary">
                    {hotspot.duration_minutes ? `${hotspot.duration_minutes} min` : 'N/A'}
                  </div>
                </div>

                <div className="bg-bg-surface rounded-lg p-3 border border-border">
                  <div className="text-xs text-text-secondary mb-1">Rainfall</div>
                  <div className="font-mono font-bold text-text-primary">
                    {hotspot.metadata?.rainfall_intensity_mmhr || 'N/A'} mm/hr
                  </div>
                </div>

                <div className="bg-bg-surface rounded-lg p-3 border border-border">
                  <div className="text-xs text-text-secondary mb-1">Traffic</div>
                  <div className="font-mono font-bold text-text-primary">
                    {hotspot.metadata?.traffic_slowdown_percent || 'N/A'}% slower
                  </div>
                </div>

                <div className="bg-bg-surface rounded-lg p-3 border border-border">
                  <div className="text-xs text-text-secondary mb-1">Water Depth</div>
                  <div className="font-mono font-bold text-text-primary">
                    {hotspot.metadata?.water_depth_expected || 'N/A'}
                  </div>
                </div>

                <div className="bg-bg-surface rounded-lg p-3 border border-border">
                  <div className="text-xs text-text-secondary mb-1">Drainage</div>
                  <div className="font-mono font-bold text-text-primary">
                    {hotspot.drainage_status || 'N/A'}
                  </div>
                </div>
              </div>

              {/* EDI Badge (Section 15.1) */}
              <div className="flex items-center gap-3 bg-bg-surface rounded-lg p-3 border border-border">
                <div
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono font-bold text-sm"
                  style={{
                    borderColor: hotspot.effective_drainage_index >= 0.6 ? '#10B981' :
                                 hotspot.effective_drainage_index >= 0.4 ? '#F59E0B' :
                                 '#EF4444',
                    backgroundColor: hotspot.effective_drainage_index >= 0.6 ? '#10B98112' :
                                     hotspot.effective_drainage_index >= 0.4 ? '#F59E0B12' :
                                     '#EF444412',
                    boxShadow: hotspot.effective_drainage_index >= 0.6 ? '0 0 0 3px #10B98110' :
                               hotspot.effective_drainage_index >= 0.4 ? '0 0 0 3px #F59E0B10' :
                               '0 0 0 3px #EF444410'
                  }}
                >
                  <span style={{
                    color: hotspot.effective_drainage_index >= 0.6 ? '#10B981' :
                           hotspot.effective_drainage_index >= 0.4 ? '#F59E0B' :
                           '#EF4444'
                  }}>
                    {hotspot.effective_drainage_index?.toFixed(2)}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    EDI
                  </div>
                  <div className="text-xs text-text-secondary">
                    Recovery: ~{hotspot.recovery_time_minutes} min
                  </div>
                </div>
              </div>

              {/* Alternate Routes */}
              {hotspot.metadata?.alternate_routes && hotspot.metadata.alternate_routes.length > 0 && (
                <div className="bg-bg-surface rounded-lg p-3 border border-border">
                  <div className="text-xs text-text-secondary mb-2">Alternate Routes</div>
                  <ul className="space-y-1">
                    {hotspot.metadata.alternate_routes.map((route, i) => (
                      <li key={i} className="text-sm text-text-primary flex items-start gap-2">
                        <span className="text-accent">→</span>
                        {route}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Last Updated */}
              <div className="text-xs text-text-secondary text-center">
                Last updated: {formatIST(hotspot.last_updated)}
              </div>

              {/* Feedback Button */}
              <div className="bg-bg-surface rounded-lg p-3 border border-border text-center">
                <div className="text-xs text-text-secondary mb-2">Is this road flooded now?</div>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => handleFeedback(true)}
                    disabled={feedback.state === 'submitting'}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    ✓ Yes, flooded
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    disabled={feedback.state === 'submitting'}
                    className="px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    ✗ No, clear
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BottomSheet
