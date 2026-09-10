// Quick validation of mock data generation
import { generateMockDataset } from './src/data/mock/generateMockData.ts'

const dataset = generateMockDataset()

const dist = { critical: 0, high: 0, moderate: 0, low: 0, normal: 0 }
const chronic = { good: 0, moderate: 0, poor: 0, 'very-poor': 0 }
let totalRisk = 0

for (const loc of dataset.locations) {
  dist[loc.riskLevel]++
  chronic[loc.drainageCondition]++
  totalRisk += loc.riskScore
}

console.log('=== Mock Data Validation ===')
console.log('Total locations:', dataset.locations.length)
console.log('Total alerts:', dataset.alerts.length)
console.log('Seed:', dataset.seed)
console.log('Generated at:', dataset.generatedAt)
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
console.log('')

// Verify deterministic: generate again and compare first location
const dataset2 = generateMockDataset()
const match = dataset.locations[0].id === dataset2.locations[0].id &&
  dataset.locations[0].riskScore === dataset2.locations[0].riskScore
console.log('Deterministic check:', match ? 'PASS ✓' : 'FAIL ✗')

// Verify all required fields present
const sample = dataset.locations[0]
const required = ['id', 'name', 'locality', 'latitude', 'longitude', 'riskScore', 'riskLevel',
  'rainfallIntensity', 'accumulatedRainfall', 'trafficSpeed', 'normalTrafficSpeed',
  'trafficSlowdownPercent', 'waterDepthCm', 'drainageCondition', 'predictedOnsetMinutes',
  'predictedDurationMinutes', 'historicalWaterloggingFrequency', 'confidenceScore',
  'lastUpdated', 'isChronic', 'ediValue', 'ediStatus', 'recoveryTimeMinutes',
  'drainageTrend', 'alternateRoutes', 'metadata']
const missing = required.filter(f => !(f in sample))
console.log('Required fields check:', missing.length === 0 ? 'PASS ✓' : `FAIL ✗ missing: ${missing.join(', ')}`)