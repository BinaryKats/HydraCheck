/**
 * Cache Utility - Persistent storage with TTL
 * Stores data in localStorage with automatic expiration
 * Used for offline fallback to last-known predictions
 */

const PREFIX = 'dhm_cache_'
const META_KEY = '_meta'

/**
 * Set cache entry with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON serialized)
 * @param {number} ttlMs - Time to live in milliseconds
 */
export function setCache(key, value, ttlMs = 15 * 60 * 1000) {
  try {
    const item = {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now()
    }
    localStorage.setItem(PREFIX + key, JSON.stringify(item))
    return true
  } catch (err) {
    // Quota exceeded or localStorage disabled
    console.warn('Cache write failed:', err.message)
    return false
  }
}

/**
 * Get cache entry, returns null if expired or missing
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null
 */
export function getCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null

    const item = JSON.parse(raw)

    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      localStorage.removeItem(PREFIX + key)
      return null
    }

    return item.value
  } catch (err) {
    console.warn('Cache read failed:', err.message)
    return null
  }
}

/**
 * Get cache entry even if expired (for offline fallback)
 * @param {string} key - Cache key
 * @returns {any|null} Cached value with metadata, or null
 */
export function getCacheStale(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null

    const item = JSON.parse(raw)
    const isExpired = item.expiresAt && Date.now() > item.expiresAt

    return {
      value: item.value,
      isExpired,
      createdAt: item.createdAt,
      ageMs: Date.now() - item.createdAt
    }
  } catch {
    return null
  }
}

/**
 * Remove a specific cache key
 * @param {string} key
 */
export function removeCache(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // noop
  }
}

/**
 * Clear all app cache (preserves other localStorage data)
 */
export function clearAllCache() {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX))
    keys.forEach((k) => localStorage.removeItem(k))
  } catch {
    // noop
  }
}

/**
 * Format age as human-readable string
 * @param {number} ageMs
 * @returns {string} e.g. "5 min ago"
 */
export function formatAge(ageMs) {
  const seconds = Math.floor(ageMs / 1000)
  if (seconds < 60) return `${seconds} sec ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}
