// Types for mock data implementation
// These should match or extend existing application data models

export interface WaterloggingLocation {
  id: string;
  name: string;
  roadName?: string;
  locality: string;
  district?: string;
  latitude: number;
  longitude: number;
  riskScore: number;
  riskLevel: 'normal' | 'low' | 'moderate' | 'high' | 'critical';
  rainfallIntensity: number;
  accumulatedRainfall: number;
  trafficSpeed: number;
  normalTrafficSpeed: number;
  trafficSlowdownPercent: number;
  waterDepthCm: number;
  drainageCondition: 'good' | 'moderate' | 'poor' | 'very-poor';
  predictedOnsetMinutes: number | null;
  predictedDurationMinutes: number;
  historicalWaterloggingFrequency: number;
  confidenceScore: number;
  lastUpdated: string;
  isChronic: boolean;
  ediValue: number;
  ediStatus: string;
  recoveryTimeMinutes: number;
  drainageTrend: 'worsening' | 'stable' | 'improving';
  alternateRoutes: string[];
  metadata: {
    rainfallIntensityMmhr: string;
    trafficSlowdownPercent: number;
    waterDepthExpected: string;
  };
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  riskLevel: 'critical' | 'high' | 'moderate';
  riskScore: number;
  onsetTime: number;
  area: string;
  timestamp: string;
}

export interface HistoricalPoint {
  timestamp: string;
  value: number;
  category: string;
  isAnomaly: boolean;
}

export interface TrendData {
  area: string;
  period: '24h' | '7d' | '30d';
  metric: 'rainfall' | 'traffic' | 'waterlogging' | 'drainage';
  data: number[];
  color: string;
}

export interface AlertData {
  alerts: Alert[];
  alertCounts: {
    critical: number;
    high: number;
    moderate: number;
  };
  loading: boolean;
  isExpanded: boolean;
}