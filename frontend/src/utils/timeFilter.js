// Time-based risk prediction for the forecast scrubber.
// Given a hotspot's onset_minutes / duration_minutes / risk_score,
// compute the predicted risk at any minute offset into the future.
// Used by TimeScrubber and consumed by RiskRoadLayer / DrainageLayer.

import { RISK_LEVELS } from './constants'

function scoreToLevel(s) {
  if (s >= 75) return 'critical'
  if (s >= 55) return 'high'
  if (s >= 35) return 'moderate'
  if (s >= 15) return 'low'
  return 'normal'
}

/**
 * Compute predicted risk at `timeMinutes` from now.
 * @param {Object} hotspot - legacy shape (onset_minutes, duration_minutes, risk_score, risk_level)
 * @param {number} timeMinutes - offset from now, 0..360
 * @returns {{ status: 'now'|'safe'|'at_risk'|'recovering', adjustedRiskScore:number, adjustedRiskLevel:string }}
 */
export function computePredictedRisk(hotspot, timeMinutes) {
  if (timeMinutes === 0) {
    return {
      status: 'now',
      adjustedRiskScore: hotspot.risk_score,
      adjustedRiskLevel: hotspot.risk_level,
    }
  }
  // No onset -> no future forecast; render as safe
  if (hotspot.onset_minutes == null) {
    return { status: 'safe', adjustedRiskScore: 15, adjustedRiskLevel: 'low' }
  }

  const onset = hotspot.onset_minutes
  const dur = hotspot.duration_minutes || 30
  const peak = hotspot.risk_score

  if (timeMinutes < onset) {
    // Pre-onset: flooding hasn't started yet
    return { status: 'safe', adjustedRiskScore: 15, adjustedRiskLevel: 'low' }
  }

  if (timeMinutes <= onset + dur) {
    // Inside window: triangle wave peaking at mid-window (most intense there)
    const progress = (timeMinutes - onset) / dur // 0..1
    const shape = 1 - Math.abs(2 * progress - 1)  // 0..1..0
    const score = 20 + shape * (peak - 20)
    return { status: 'at_risk', adjustedRiskScore: score, adjustedRiskLevel: scoreToLevel(score) }
  }

  // Post-window: 15-min recovery tail
  const rec = timeMinutes - (onset + dur)
  if (rec > 15) return { status: 'safe', adjustedRiskScore: 15, adjustedRiskLevel: 'low' }
  const score = peak * 0.5 * (1 - rec / 15)
  return { status: 'recovering', adjustedRiskScore: score, adjustedRiskLevel: scoreToLevel(score) }
}

/** Hex color for the predicted level. */
export function getRiskColorForTime(hotspot, timeMinutes) {
  const r = computePredictedRisk(hotspot, timeMinutes)
  return (RISK_LEVELS[r.adjustedRiskLevel] || RISK_LEVELS.normal).color
}
