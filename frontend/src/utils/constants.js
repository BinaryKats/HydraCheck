// Delhi Hotspots Configuration
// SIH 2026 - Hyperlocal Waterlogging Prediction

export const HOTSPOTS = [
  {
    id: 'minto-bridge',
    name: 'Minto Bridge Underpass',
    coordinates: { lat: 28.6280, lng: 77.2197 },
    area: 'Ring Road · Central Delhi',
    knownBehavior: 'Chronic — floods every monsoon, underpass traps water',
    ediStatus: 'critical',
    ediValue: 0.85,
    recoveryTimeMinutes: 45,
    isChronic: true
  },
  {
    id: 'pul-prahladpur',
    name: 'Pul Prahladpur Underpass',
    coordinates: { lat: 28.5097, lng: 77.2510 },
    area: 'Near Metro Station · South Delhi',
    knownBehavior: 'Chronic — drainage bottleneck',
    ediStatus: 'degraded',
    ediValue: 0.55,
    recoveryTimeMinutes: 30,
    isChronic: true
  },
  {
    id: 'ring-road-who',
    name: 'Ring Road opp. WHO Building',
    coordinates: { lat: 28.5685, lng: 77.2510 },
    area: 'Near WHO HQ · New Delhi',
    knownBehavior: 'Yearly recurrence during heavy monsoon',
    ediStatus: 'moderate',
    ediValue: 0.62,
    recoveryTimeMinutes: 20,
    isChronic: false
  },
  {
    id: 'jahangirpuri',
    name: 'Jahangirpuri Metro Station Road',
    coordinates: { lat: 28.7253, lng: 77.1700 },
    area: 'Outer Delhi · North',
    knownBehavior: 'Low-lying area, flooding during heavy rainfall',
    ediStatus: 'good',
    ediValue: 0.25,
    recoveryTimeMinutes: 12,
    isChronic: false
  },
  {
    id: 'zakhira-flyover',
    name: 'Zakhira Flyover (under)',
    coordinates: { lat: 28.6612, lng: 77.1534 },
    area: 'Paharganj · Central Delhi',
    knownBehavior: 'Underpass flooding during heavy rain',
    ediStatus: 'degraded',
    ediValue: 0.48,
    recoveryTimeMinutes: 35,
    isChronic: true
  },
  {
    id: 'loni-road',
    name: 'Loni Road Golchakkar',
    coordinates: { lat: 28.6945, lng: 77.2800 },
    area: 'East Delhi · Near UP Border',
    knownBehavior: 'Poor drainage infrastructure, severe flooding',
    ediStatus: 'critical',
    ediValue: 0.78,
    recoveryTimeMinutes: 60,
    isChronic: true
  },
  {
    id: 'karala-kanjhawla',
    name: 'Karala–Kanjhawla Stretch',
    coordinates: { lat: 28.7350, lng: 77.0050 },
    area: 'Outer Delhi · Northwest',
    knownBehavior: 'Chronic waterlogging during monsoon',
    ediStatus: 'degraded',
    ediValue: 0.52,
    recoveryTimeMinutes: 28,
    isChronic: true
  }
]

export const RISK_LEVELS = {
  normal: { color: '#9CA3AF', width: 3, label: 'Normal' },
  low: { color: '#10B981', width: 5, label: 'Low Risk' },
  moderate: { color: '#F59E0B', width: 6, label: 'Moderate Risk' },
  high: { color: '#F97316', width: 7, label: 'High Risk' },
  critical: { color: '#EF4444', width: 8, label: 'Critical' }
}

export const EDI_STATUS = {
  good: { color: '#10B981', label: 'Good', threshold: 0.8 },
  moderate: { color: '#F59E0B', label: 'Moderate', threshold: 0.6 },
  degraded: { color: '#F97316', label: 'Degraded', threshold: 0.4 },
  critical: { color: '#EF4444', label: 'Critical', threshold: 0 }
}

export const MAP_CENTER = [28.6139, 77.2090] // Delhi center
export const DEFAULT_ZOOM = 12
export const MIN_ZOOM = 10
export const MAX_ZOOM = 18