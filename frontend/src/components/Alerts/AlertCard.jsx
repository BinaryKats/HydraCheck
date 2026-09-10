/**
 * Alert Card Component
 * Individual alert card color-coded by risk level
 *
 * @see design.md Section 4 - Alerts
 */

import { useState } from 'react'
import { submitFeedback } from '../../utils/api'
import { X } from 'lucide-react'
import { formatISTShort } from '../../utils/dateUtils'
import { formatRiskScore } from '../../utils/formatting'

function AlertCard({ alert, onDismiss }) {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const riskStyles = {
    critical: { color: '#EF4444', bg: '#EF444420', iconColor: '#EF4444' },
    high: { color: '#F97316', bg: '#F9731620', iconColor: '#F97316' },
    moderate: { color: '#F59E0B', bg: '#F59E0B20', iconColor: '#F59E0B' },
    low: { color: '#10B981', bg: '#10B98120', iconColor: '#10B981' }
  }

  const style = riskStyles[alert.riskLevel] || riskStyles.normal

  const handleSubmitFeedback = async () => {
    setFeedbackLoading(true)
    try {
      await submitFeedback({
        hotspotId: alert.id,
        isFlooded: true, // Assuming alert means flooded
        comment: 'Reported via alerts panel',
        timestamp: new Date().toISOString()
      })
      setFeedbackSubmitted(true)
      // Auto-dismiss feedback state after 2 seconds
      setTimeout(() => setFeedbackSubmitted(false), 2000)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
    setFeedbackLoading(false)
  }

  const formatTime = (timestamp) => {
    return formatISTShort(timestamp)
  }

  return (
    <div
      className={`flex items-center gap-4 p-4 bg-bg-surface rounded-xl border border-border shadow-sm transition-all hover:shadow-lg cursor-pointer`}
      onClick={() => {
        // Clicking card could show detail or focus map
        // For now, just visual feedback
      }}
    >
      {/* Risk Indicator */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: style.bg }}>
        <div
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: style.color }}
        >
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#FFFFFF', fontSize: '0.5rem' }}
          >
            {alert.riskScore >= 80 ? '!' : alert.riskScore >= 60 ? '⚠' : '•'}
          </div>
        </div>
      </div>

      {/* Alert Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-text-primary">{alert.title}</h3>
            <p className="text-xs text-text-secondary">{alert.area}</p>
          </div>
          <div className="text-xs text-text-secondary">
            {formatTime(alert.timestamp)}
          </div>
        </div>
        <p className="text-sm font-medium text-text-primary">{alert.message}</p>

        {/* Risk Details */}
        {alert.riskScore !== undefined && (
          <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: style.color }} />
              <span>Risk: {formatRiskScore(alert.riskScore)}/100</span>
            </div>
            {alert.onsetTime !== null && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#60A5FA' }} />
                <span>Onset: ~{alert.onsetTime} min</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {feedbackSubmitted ? (
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : feedbackLoading ? (
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
            <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l4 4" />
            </svg>
          </div>
        ) : (
          <button
            onClick={handleSubmitFeedback}
            disabled={feedbackLoading}
            className="w-8 h-8 rounded-full bg-bg-surface border border-border flex items-center justify-center hover:bg-bg-primary transition-colors"
          >
            <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2V4m10.4-7.8a4 4 0 11-5.6 5.6" />
              <path d="M16 16a4 4 0 11-5.6-5.6" />
              <path d="M2 12h20" />
            </svg>
          </button>
        )}

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-primary rounded-full"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default AlertCard