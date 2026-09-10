// Quick validation of mock data generation (run with: npx tsx src/validation.test.ts or via vite)
import { generateMockDataset } from './data/mock/generateMockData'

const dataset = generateMockDataset()

const dist: Record<string, number> = { critical: 0, high: 0, moderate: 0, low: 0, normal: 0 }
const chronic: Record<string, number> = { good: 0, moderate: 0, poor: 0, 'very-poor': 0 }
let totalRisk = 0

for (const loc of dataset.locations) {
  dist[loc.riskLevel]++
  chronic[loc.drainageCondition]++
  totalRisk += loc.riskScore
}

console.log('=== Mock Data Validation ===')
console.log('Total locations:', dataset.locations.length)
console.log('Total alerts:', dataset.alerts.length)
console.log('')
console.log('Risk distribution:')
for (const [level, count] of Object.entries(dist)) {
  const pct = ((count / dataset.locations.length) * 100).toFixed(1)
  console.log(`  ${level}: ${count} (${pct}%)`)
}
console.log('')
console.log('Drainage distribution:')
for (const [cond, count] of Object.entries(chronic)) {
  const pct = ((count / dataset.locations.length) * 100).toFixed(1)
  console.log(`  ${cond}: ${count} (${pct}%)`)
}
console.log('')
console.log('Average risk score:', (totalRisk / dataset.locations.length).toFixed(1))

// Deterministic check
const dataset2 = generateMockDataset()
const match = dataset.locations[0].id === dataset2.locations[0].id &&
  dataset.locations[0].riskScore === dataset2.locations[0].riskScore &&
  dataset.locations[0].latitude === dataset2.locations[0].latitude
console.log('')
console.log('Deterministic check:', match ? 'PASS ✓' : 'FAIL ✗')

// Required fields check
const sample = dataset.locations[0]
const required = ['id', 'name', 'locality', 'latitude', 'longitude', 'riskScore', 'riskLevel',
  'rainfallIntensity', 'trafficSpeed', 'waterDepthCm', 'drainageCondition',
  'ediValue', 'ediStatus', 'recoveryTimeMinutes', 'drainageTrend',
  'alternateRoutes', 'metadata']
const missing = required.filter(f => !(f in sample))
console.log('Required fields check:', missing.length === 0 ? 'PASS ✓' : `FAIL ✗ missing: ${missing.join(', ')}`)

// Risk distribution target check
const lowPct = dist.low / dataset.locations.length
const moderatePct = dist.moderate / dataset.locations.length
const highPct = dist.high / dataset.locations.length
const criticalPct = dist.critical / dataset.locations.length
console.log('')
console.log('Distribution targets (Low 40-55%, Moderate 25-35%, High 10-20%, Severe 2-8%):')
console.log(`  Low: ${(lowPct * 100).toFixed(1)}% ${lowPct >= 0.40 && lowPct <= 0.55 ? '✓' : '(outside target)'}`)
console.log(`  Moderate: ${(moderatePct * 100).toFixed(1)}% ${moderatePct >= 0.25 && moderatePct <= 0.35 ? '✓' : '(outside target)'}`)
console.log(`  High: ${(highPct * 100).toFixed(1)}% ${highPct >= 0.10 && highPct <= 0.20 ? '✓' : '(outside target)'}`)
console.log(`  Critical: ${(criticalPct * 100).toFixed(1)}% ${criticalPct >= 0.02 && criticalPct <= 0.08 ? '✓' : '(outside target)'}`)