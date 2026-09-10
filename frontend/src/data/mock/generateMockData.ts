// Mock Data Generator - Deterministic data generation for Delhi/NCR waterlogging prediction
// Generates 500-1000 locations with realistic correlated data

import { createMockRNG, seededRandomIntInRange, MOCK_DATA_SEED, SeededRandom } from '../../utils/seededRNG';
import { WaterloggingLocation, Alert, TrendData } from '../types';

// Helper functions for realistic data generation
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampRiskScore(score: number): number {
  return clamp(score, 0, 100);
}

function determineRiskLevel(score: number): 'normal' | 'low' | 'moderate' | 'high' | 'critical' {
  if (score < 20) return 'normal';
  if (score < 40) return 'low';
  if (score < 60) return 'moderate';
  if (score < 80) return 'high';
  return 'critical';
}

// Delhi regions and localities
const DELHI_REGIONS = [
  { name: 'Ring Road', lat: 28.6280, lng: 77.2197, baseRainfall: 22, variation: 8, roads: ['Ring Road', 'Minto Road'] },
  { name: 'Lodhi Road', lat: 28.5685, lng: 77.2510, baseRainfall: 18, variation: 6, roads: ['Lodhi Road', 'Raj Path'] },
  { name: 'Shahdara', lat: 28.6425, lng: 77.1725, baseRainfall: 20, variation: 7, roads: ['GT Road', 'Laxmi Nagar'] },
  { name: 'Paharganj', lat: 28.6425, lng: 77.1425, baseRainfall: 21, variation: 7, roads: ['Paharganj Road', 'New Rohtak Road'] },
  { name: 'Narela', lat: 28.6825, lng: 77.0925, baseRainfall: 12, variation: 4, roads: ['Narela Road', 'Outer Ring Road'] },
  { name: 'Rohini', lat: 28.6825, lng: 77.0925, baseRainfall: 14, variation: 5, roads: ['Rohini Road', 'Sector 1-15'] },
  { name: 'Dwarka', lat: 28.5925, lng: 77.0425, baseRainfall: 15, variation: 5, roads: ['Dwarka Expressway', 'Sector 10-23'] },
  { name: 'Saket', lat: 28.5225, lng: 77.2025, baseRainfall: 17, variation: 5, roads: ['Saket Road', 'Pushp Vihar'] },
  { name: 'Khan Market', lat: 28.6025, lng: 77.2225, baseRainfall: 19, variation: 6, roads: ['Khan Market Road', 'Rabindra Nagar'] },
  { name: 'Connaught Place', lat: 28.6325, lng: 77.2125, baseRainfall: 22, variation: 7, roads: ['Janpath Road', 'Connaught Circus'] },
  { name: 'Tilak Marg', lat: 28.6125, lng: 77.2325, baseRainfall: 20, variation: 6, roads: ['Tilak Marg', 'Sunder Nagar'] },
  { name: 'Lajpat Nagar', lat: 28.5625, lng: 77.2425, baseRainfall: 18, variation: 6, roads: ['Lajpat Nagar Road', 'Ring Road'] },
  { name: 'Karol Bagh', lat: 28.6525, lng: 77.1825, baseRainfall: 20, variation: 7, roads: ['Karol Bagh Road', 'Pusa Road'] },
  { name: 'Patparganj', lat: 28.6325, lng: 77.3025, baseRainfall: 21, variation: 7, roads: ['Patparganj Road', 'NH-24'] },
  { name: 'Mehrauli', lat: 28.5225, lng: 77.1825, baseRainfall: 16, variation: 5, roads: ['Mehrauli-Gurgaon Road', 'Qutub Minar'] }
];

// Road types and their characteristics
const ROAD_TYPES = [
  { type: 'major', normalSpeed: [40, 70], name: 'Ring Road' },
  { type: 'arterial', normalSpeed: [30, 50], name: 'GT Road' },
  { type: 'secondary', normalSpeed: [20, 40], name: 'Janpath Road' },
  { type: 'local', normalSpeed: [20, 35], name: 'Lajpat Nagar Road' }
];

// Mock data generation function
function generateMockLocations(seed: number = MOCK_DATA_SEED) {
  const rng = createMockRNG();

  const locations: WaterloggingLocation[] = [];

  // Generate 750 locations
  for (let i = 0; i < 750; i++) {
    // Select random region and road type
    const regionIndex = seededRandomIntInRange(rng, 0, DELHI_REGIONS.length);
    const region = DELHI_REGIONS[regionIndex];
    const roadType = ROAD_TYPES[seededRandomIntInRange(rng, 0, ROAD_TYPES.length)];

    // Generate location with small offsets from anchor
    const offsetLat = (rng.random() - 0.5) * 0.05; // ~2.5km
    const offsetLng = (rng.random() - 0.5) * 0.05;

    const latitude = Math.round((region.lat + offsetLat) * 10000) / 10000;
    const longitude = Math.round((region.lng + offsetLng) * 10000) / 10000;

    // Generate rainfall with spatial correlation (nearby locations have similar rain)
    const rainfallIntensity = clamp(region.baseRainfall + (rng.random() - 0.5) * region.variation * 2, 0, 100);

    // Generate traffic speed based on road type and rainfall
    const normalSpeed = roadType.normalSpeed[0] + rng.random() * (roadType.normalSpeed[1] - roadType.normalSpeed[0]);
    const trafficSlowdown = rainfallIntensity > 15 ? (rng.random() * 30 + 10) : (rng.random() * 15);
    const currentSpeed = normalSpeed * (1 - trafficSlowdown / 100);

    // Generate water depth based on rainfall and drainage
    const drainageCondition = getDrainageCondition(rng);
    const waterDepth = calculateWaterDepth(rng, rainfallIntensity, drainageCondition);

    // Generate risk score from correlated variables
    const historicalVulnerability = 0.2 + rng.random() * 0.8;
    const riskScore = calculateRiskScore(rng, {
      rainfall: rainfallIntensity,
      trafficSlowdown,
      waterDepth,
      drainageCondition,
      historicalVulnerability
    });

    // Generate EDI (Effective Drainage Index)
    const ediValue = calculateEDI(rng, drainageCondition, waterDepth);

    // Generate recovery time
    const recoveryTime = calculateRecoveryTime(rng, ediValue, waterDepth);

    // Generate prediction onset
    const onsetMinutes = riskScore > 60 ? seededRandomIntInRange(rng, 10, 30) : null;

    // Generate duration
    const durationMinutes = calculateDuration(rng, rainfallIntensity, drainageCondition);

    // Create location object
    const location: WaterloggingLocation = {
      id: `LOC-${String(i + 1).padStart(3, '0')}`,
      name: generateLocationName(rng, region.name, roadType.name, i),
      roadName: roadType.name,
      locality: region.name,
      district: 'Delhi',
      latitude,
      longitude,
      riskScore: clampRiskScore(riskScore),
      riskLevel: determineRiskLevel(riskScore),
      rainfallIntensity: Math.round(rainfallIntensity * 10) / 10,
      accumulatedRainfall: Math.round((rainfallIntensity * (2 + rng.random() * 3)) * 10) / 10,
      trafficSpeed: Math.round(currentSpeed * 10) / 10,
      normalTrafficSpeed: Math.round(normalSpeed * 10) / 10,
      trafficSlowdownPercent: Math.round(trafficSlowdown),
      waterDepthCm: Math.round(waterDepth * 10) / 10,
      drainageCondition,
      predictedOnsetMinutes: onsetMinutes,
      predictedDurationMinutes: Math.round(durationMinutes),
      historicalWaterloggingFrequency: seededRandomIntInRange(rng, 0, 10),
      confidenceScore: 60 + seededRandomIntInRange(rng, 30),
      lastUpdated: new Date().toISOString(),
      isChronic: seededRandomIntInRange(rng, 0, 10) > 8,
      ediValue: Math.round(ediValue * 100) / 100,
      ediStatus: getEDIStatus(ediValue),
      recoveryTimeMinutes: Math.round(recoveryTime),
      drainageTrend: getDrainageTrend(rng),
      alternateRoutes: generateAlternateRoutes(rng, region.name),
      metadata: {
        rainfallIntensityMmhr: rainfallIntensity.toFixed(1),
        trafficSlowdownPercent: Math.round(trafficSlowdown),
        waterDepthExpected: getWaterDepthLabel(waterDepth)
      }
    };

    locations.push(location);
  }

  return locations;
}

// Helper function to calculate risk score
// Non-linear model: compound risk multipliers, not just weighted sum.
// Target distribution: Normal 5-10%, Low 40-55%, Moderate 25-35%, High 10-20%, Critical 2-8%
function calculateRiskScore(
  rng: SeededRandom,
  {
    rainfall,
    trafficSlowdown,
    waterDepth,
    drainageCondition,
    historicalVulnerability
  }: {
    rainfall: number;
    trafficSlowdown: number;
    waterDepth: number;
    drainageCondition: string;
    historicalVulnerability: number;
  }
): number {
  // Base risk from rainfall (0-30 range)
  // Delhi avg monsoon rainfall: 10-35mm/hr; >50 is extreme
  const rainfallRisk = clamp((rainfall / 50) * 30, 0, 30);

  // Water depth risk (0-25 range)
  const waterRisk = clamp((waterDepth / 60) * 25, 0, 25);

  // Drainage risk (0-20 range, discrete)
  const drainageRisk = drainageCondition === 'good' ? 3 :
    drainageCondition === 'moderate' ? 8 :
    drainageCondition === 'poor' ? 14 : 19;

  // Traffic slowdown risk (0-15 range)
  const trafficRisk = clamp((trafficSlowdown / 80) * 15, 0, 15);

  // Historical vulnerability (0-10 range)
  const historicalRisk = historicalVulnerability * 10;

  // Linear base
  const baseScore = rainfallRisk + waterRisk + drainageRisk + trafficRisk + historicalRisk;

  // Compound multiplier: poor drainage amplifies rainfall+water risk
  const compoundMultiplier = drainageCondition === 'good' ? 1.0 :
    drainageCondition === 'moderate' ? 1.05 :
    drainageCondition === 'poor' ? 1.15 : 1.30;

  // Non-linear boost when multiple factors are high
  const highFactorCount = [rainfallRisk > 12, waterRisk > 10, trafficRisk > 8].filter(Boolean).length;
  const compoundingBoost = highFactorCount >= 2 ? highFactorCount * 5 : 0;

  const rawScore = baseScore * compoundMultiplier + compoundingBoost;

  // Add controlled jitter with slight positive bias (mean +1.5) to nudge tails into High/Critical
  const jitter = (rng.random() - 0.5) * 12 + rng.random() * 3;

  return clampRiskScore(rawScore + jitter);
}

// Helper function to calculate water depth
function calculateWaterDepth(
  rng: SeededRandom,
  rainfall: number,
  drainageCondition: string
): number {
  const drainageFactor =
    drainageCondition === 'good' ? 0.6 :
    drainageCondition === 'moderate' ? 1.0 :
    drainageCondition === 'poor' ? 1.8 : 2.5;

  // Scale rainfall so 22mm rainfall = ~20cm water depth
  const baseDepth = rainfall * 0.9 * drainageFactor;
  const jitter = (rng.random() - 0.5) * 8;

  return clamp(baseDepth + jitter, 0, 80);
}

// Helper function to calculate EDI
function calculateEDI(
  rng: SeededRandom,
  drainageCondition: string,
  waterDepth: number
): number {
  const baseEDI = drainageCondition === 'good' ? 0.85 :
    drainageCondition === 'moderate' ? 0.70 :
    drainageCondition === 'poor' ? 0.45 : 0.20;

  const depthPenalty = clamp((waterDepth / 80) * 0.3, 0, 0.3);
  const jitter = (rng.random() - 0.5) * 0.1;

  return clamp(baseEDI - depthPenalty + jitter, 0.1, 0.95);
}

// Helper function to calculate recovery time
function calculateRecoveryTime(
  rng: SeededRandom,
  ediValue: number,
  waterDepth: number
): number {
  const baseRecovery = 20 + (1 - ediValue) * 40;
  const depthFactor = waterDepth > 20 ? 1.5 : 1.0;
  const jitter = (rng.random() - 0.5) * 10;

  return clamp(baseRecovery * depthFactor + jitter, 5, 90);
}

// Helper function to calculate duration
function calculateDuration(
  rng: SeededRandom,
  rainfall: number,
  drainageCondition: string
): number {
  const drainageFactor =
    drainageCondition === 'poor' ? 1.8 :
    drainageCondition === 'very-poor' ? 2.2 : 1.0;

  const baseDuration = 30 + (rainfall / 100) * 60 * drainageFactor;
  const jitter = (rng.random() - 0.5) * 15;

  return clamp(baseDuration + jitter, 10, 180);
}

// Helper function to get drainage condition
function getDrainageCondition(rng: SeededRandom): string {
  const rand = rng.random();
  if (rand < 0.3) return 'good';
  if (rand < 0.75) return 'moderate';
  if (rand < 0.95) return 'poor';
  return 'very-poor';
}

// Helper function to get EDI status label
function getEDIStatus(ediValue: number): string {
  if (ediValue >= 0.8) return 'good';
  if (ediValue >= 0.6) return 'moderate';
  if (ediValue >= 0.4) return 'degraded';
  return 'critical';
}

// Helper function to get drainage trend
function getDrainageTrend(rng: SeededRandom): 'worsening' | 'stable' | 'improving' {
  const rand = rng.random();
  if (rand < 0.3) return 'worsening';
  if (rand < 0.7) return 'stable';
  return 'improving';
}

// Helper function to generate location name
function generateLocationName(
  rng: SeededRandom,
  regionName: string,
  roadType: string,
  index: number
): string {
  const prefixes = ['Near', 'Approach', 'Stretch', 'Segment', 'Crossing', 'Turn'];
  const suffixes = ['North', 'South', 'East', 'West', 'Central'];

  const prefix = prefixes[index % prefixes.length];
  const suffix = suffixes[seededRandomIntInRange(rng, 0, suffixes.length)];

  return `${regionName} – ${prefix} ${suffix}`;
}

// Helper function to generate alternate routes
function generateAlternateRoutes(rng: SeededRandom, regionName: string): string[] {
  const routes = [
    `Via ${regionName} Ring Road (+${seededRandomIntInRange(rng, 5, 20)} min)`,
    `Via ${regionName} Outer Ring Road (+${seededRandomIntInRange(rng, 10, 30)} min)`
  ];

  return routes;
}

// Helper function to get water depth label
function getWaterDepthLabel(depth: number): string {
  if (depth > 40) return 'Waist+';
  if (depth > 20) return 'Knee';
  if (depth > 5) return 'Ankle';
  return 'None';
}

// Mock alert generation
function generateMockAlerts(locations: WaterloggingLocation[]): Alert[] {
  const alerts: Alert[] = [];

  locations
    .filter(loc => loc.riskScore >= 70)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 20)
    .forEach(loc => {
      alerts.push({
        id: `alert-${loc.id}`,
        title: loc.name,
        message: `${loc.riskLevel.toUpperCase()} risk detected`,
        riskLevel: loc.riskLevel as 'critical' | 'high' | 'moderate',
        riskScore: loc.riskScore,
        onsetTime: loc.predictedOnsetMinutes || 0,
        area: loc.locality,
        timestamp: loc.lastUpdated
      });
    });

  return alerts;
}

// Mock trend data generation
function generateMockTrendData(
  area: string,
  period: '24h' | '7d' | '30d',
  metric: 'rainfall' | 'traffic' | 'waterlogging' | 'drainage'
): TrendData {
  const rng = createMockRNG();

  const points = period === '24h' ? 24 : period === '7d' ? 28 : 30;
  const data: number[] = [];

  let value = 20;
  for (let i = 0; i < points; i++) {
    const delta = (rng.random() - 0.5) * 10;
    value = clamp(value + delta, 0, 100);
    data.push(Math.round(value * 10) / 10);
  }

  const colors: Record<string, string> = {
    rainfall: '#60A5FA',
    traffic: '#8b5cf6',
    waterlogging: '#ef4444',
    drainage: '#10b981'
  };

  return {
    area,
    period,
    metric,
    data,
    color: colors[metric]
  };
}

// Main generation function
export function generateMockDataset() {
  console.log(`[Mock Data] Generating dataset using seed ${MOCK_DATA_SEED}...`);

  const locations = generateMockLocations(MOCK_DATA_SEED);
  const alerts = generateMockAlerts(locations);

  console.log(`[Mock Data] Generated ${locations.length} locations, ${alerts.length} alerts`);

  return {
    locations,
    alerts,
    seed: MOCK_DATA_SEED,
    generatedAt: new Date().toISOString()
  };
}

// Export generation functions
export {
  generateMockLocations,
  generateMockAlerts,
  generateMockTrendData
};