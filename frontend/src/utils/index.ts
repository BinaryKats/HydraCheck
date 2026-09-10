// Data Service Dispatcher
// Selects between mock data and real backend API based on VITE_USE_MOCK_DATA
//
// Usage:
//   import { dataService } from './utils'
//   const locations = await dataService.getLocations()
//
// Toggle: VITE_USE_MOCK_DATA=true (default) or false

import * as mockDataService from './mockDataService'
import { WaterloggingLocation, Alert, HistoricalPoint, TrendData } from '../data/types'

// Determine if mock data should be used
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

console.log(`[DataService] Mock data ${USE_MOCK_DATA ? 'ENABLED' : 'DISABLED'}`)

/**
 * Unified data service interface
 * In mock mode: uses deterministic generated data
 * In real mode: would call backend API endpoints
 */
class DataService {
  private useMock: boolean

  constructor() {
    this.useMock = USE_MOCK_DATA
  }

  /**
   * Get all waterlogging locations with optional filtering
   */
  async getLocations(options: {
    limit?: number
    offset?: number
    riskLevel?: string
    district?: string
    search?: string
  } = {}): Promise<WaterloggingLocation[]> {
    if (this.useMock) {
      return mockDataService.getLocations(options)
    }
    // Real backend would call: GET /api/locations
    throw new Error('Real backend not configured. Set VITE_USE_MOCK_DATA=true.')
  }

  /**
   * Get a single location by ID
   */
  async getLocationById(id: string): Promise<WaterloggingLocation | null> {
    if (this.useMock) {
      return mockDataService.getLocationById(id)
    }
    throw new Error('Real backend not configured. Set VITE_USE_MOCK_DATA=true.')
  }

  /**
   * Get historical data for a location
   */
  async getHistoricalData(locationId: string, hours: number = 24): Promise<HistoricalPoint[]> {
    if (this.useMock) {
      return mockDataService.getHistoricalData(locationId, hours)
    }
    throw new Error('Real backend not configured. Set VITE_USE_MOCK_DATA=true.')
  }

  /**
   * Get trend data for a metric
   */
  async getTrendData(
    area: string,
    period: '24h' | '7d' | '30d',
    metric: 'rainfall' | 'traffic' | 'waterlogging' | 'drainage'
  ): Promise<TrendData> {
    if (this.useMock) {
      return mockDataService.getTrendData(area, period, metric)
    }
    throw new Error('Real backend not configured. Set VITE_USE_MOCK_DATA=true.')
  }

  /**
   * Get active alerts
   */
  async getAlerts(options: {
    severity?: 'critical' | 'high' | 'moderate'
    limit?: number
  } = {}): Promise<Alert[]> {
    if (this.useMock) {
      return mockDataService.getAlerts(options)
    }
    throw new Error('Real backend not configured. Set VITE_USE_MOCK_DATA=true.')
  }

  /**
   * Get risk summary across all locations
   */
  async getRiskSummary() {
    if (this.useMock) {
      return mockDataService.getRiskSummary()
    }
    throw new Error('Real backend not configured. Set VITE_USE_MOCK_DATA=true.')
  }

  /**
   * Submit user feedback
   */
  async submitFeedback(feedback: {
    locationId: string
    rating: number
    comment: string
    observedDepth?: string
  }): Promise<{ success: boolean; message: string; timestamp: string }> {
    if (this.useMock) {
      return mockDataService.submitFeedback(feedback)
    }
    throw new Error('Real backend not configured. Set VITE_USE_MOCK_DATA=true.')
  }

  /**
   * Get mock data statistics
   */
  async getMockStats() {
    if (this.useMock) {
      return mockDataService.getMockStats()
    }
    throw new Error('Mock data not available in real mode')
  }

  /**
   * Reset mock dataset cache
   */
  resetMockCache() {
    if (this.useMock) {
      mockDataService.resetMockDataset()
    }
  }
}

// Export singleton instance
export const dataService = new DataService()

// Export types for consumers
export type { WaterloggingLocation, Alert, HistoricalPoint, TrendData }

// Export constants
export { MOCK_LATENCY_MS, MOCK_FAILURE_MODE, MOCK_EMPTY_MODE } from './mockDataService'