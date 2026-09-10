/**
 * RiskGauge Component - Displays a large risk score with level label
 * Shows risk score (0-100) using JetBrains Mono font and color-coded by risk level
 * Based on design.md Section 2 (Road Overlay Color System) and Section 10 (Iconography)
 */

import { RISK_LEVELS } from '../../utils/constants'
import { formatRiskScore } from '../../utils/formatting'

function RiskGauge({ riskScore, riskLevel, ediValue, ediStatus, recoveryTime }) {
  const riskStyle = RISK_LEVELS[riskLevel] || RISK_LEVELS.normal

  const ediColor =
    ediValue >= 0.6 ? '#10B981' :
    ediValue >= 0.4 ? '#F59E0B' :
    '#EF4444'

  return (
    <div className="flex flex-col items-center p-6 bg-bg-surface rounded-xl border border-border shadow-sm">
      {/* Risk Score Display */}
      <div className="relative">
        <div className="font-mono text-5xl font-bold text-text-primary">
          {formatRiskScore(riskScore)}
        </div>
        <div className="absolute -top-1 -right-2">
          <span
            className="px-2 py-0.5 text-xs font-semibold rounded-full text-white"
            style={{ backgroundColor: riskStyle.color }}
          >
            {riskLevel?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* EDI Badge */}
      <div className="mt-4 flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono font-bold text-sm"
          style={{ borderColor: ediColor, color: ediColor }}
        >
          {ediValue?.toFixed(2)}
        </div>
        <div className="text-xs text-text-secondary">
          EDI: {recoveryTime ? `~${recoveryTime} min recovery` : ''}
        </div>
      </div>

      {/* Recovery Time */}
      {recoveryTime && (
        <div className="mt-2 text-xs text-text-secondary">
          Recovery: ~{recoveryTime} min
        </div>
      )}
    </div>
  )
}

export default RiskGauge