// Presentation-boundary formatters
// SIH 2026 - Risk score is stored as a float (e.g. 77.66) for downstream
// math (averages, comparisons, color bucketing). All UI rendering must
// route through these helpers so the user only ever sees an integer
// like "78" — never the float, never 10-decimal coordinates.

/**
 * Format a 0-100 risk score for human display.
 * Rounds to the nearest integer and returns a string.
 * Returns '—' for null/undefined/NaN so the UI never prints "NaN".
 *
 * @param {number|null|undefined} score
 * @returns {string}
 */
export function formatRiskScore(score) {
  if (score == null || Number.isNaN(score)) return '—'
  return String(Math.round(score))
}

/**
 * Format a 0-1 decimal (EDI, confidence, etc.) to a fixed number of places.
 * Returns '—' for null/undefined/NaN.
 */
export function formatDecimal(value, places = 2) {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toFixed(places)
}
