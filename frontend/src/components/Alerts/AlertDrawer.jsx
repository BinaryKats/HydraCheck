/**
 * Alert Drawer Component
 * Slide-up panel with active alerts sorted by severity
 *
 * @see design.md Section 4 - Alerts
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Bell, X, ChevronDown, ChevronUp } from 'lucide-react'
import { getAllHotspots } from '../../utils/api'
import AlertCard from './AlertCard'

function AlertDrawer({ isOpen, onClose }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadAlerts()
    }
  }, [isOpen])

  const loadAlerts = async () => {
    setLoading(true)
    try {
      const response = await getAllHotspots()
      // Handle both old array and new { data, fromCache } response format
      const hotspots = Array.isArray(response) ? response : response.data || []

      // Convert hotspots to alerts sorted by severity
      const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3, normal: 4 }

      const alertData = hotspots
        .filter(h => h.risk_level !== 'normal' && h.risk_level !== 'low')
        .map(h => ({
          id: h.hotspot_id,
          title: h.hotspot_name,
          message: `${h.risk_level?.toUpperCase()} risk detected`,
          riskLevel: h.risk_level,
          riskScore: h.risk_score,
          onsetTime: h.onset_minutes,
          area: h.area,
          timestamp: h.last_updated
        }))
        .sort((a, b) => severityOrder[a.riskLevel] - severityOrder[b.riskLevel])

      setAlerts(alertData)
    } catch (error) {
      console.error('Failed to load alerts:', error)
    }
    setLoading(false)
  }

  // Count by severity
  const alertCounts = {
    critical: alerts.filter(a => a.riskLevel === 'critical').length,
    high: alerts.filter(a => a.riskLevel === 'high').length,
    moderate: alerts.filter(a => a.riskLevel === 'moderate').length
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1050]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Drawer */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-bg-surface rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Drag handle & Header */}
            <div
              className="flex justify-between items-center p-4 border-b border-border cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Active Alerts</h2>
                  <p className="text-xs text-text-secondary">
                    {alertCounts.critical > 0 && (
                      <span className="text-red-400 font-semibold">{alertCounts.critical} critical</span>
                    )}
                    {alertCounts.critical > 0 && alertCounts.high > 0 && <span> · </span>}
                    {alertCounts.high > 0 && (
                      <span className="text-orange-400 font-semibold">{alertCounts.high} high</span>
                    )}
                    {(alertCounts.critical > 0 || alertCounts.high > 0) && alertCounts.moderate > 0 && (
                      <span> · </span>
                    )}
                    {alertCounts.moderate > 0 && (
                      <span className="text-yellow-400 font-semibold">{alertCounts.moderate} moderate</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-primary rounded-full active:scale-90 transition-all"
                  aria-label="Close alerts"
                >
                  <X className="w-5 h-5" />
                </button>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-text-secondary" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-text-secondary" />
                )}
              </div>
            </div>

            {/* Alert List */}
            {isExpanded && (
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-text-primary font-semibold">All Clear</p>
                    <p className="text-text-secondary text-sm">No active alerts at this time</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onDismiss={() => {
                          setAlerts(prev => prev.filter(a => a.id !== alert.id))
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AlertDrawer