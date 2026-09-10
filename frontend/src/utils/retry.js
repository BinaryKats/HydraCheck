/**
 * Retry Utility - Exponential backoff for failed requests
 * Used by API layer to retry transient failures
 */

const DEFAULT_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 8000,
  backoffFactor: 2,
  // Add small random jitter to avoid thundering herd
  jitter: true
}

/**
 * Sleep utility
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate delay for next retry attempt
 * @param {number} attempt - 0-indexed attempt count
 * @param {object} config
 * @returns {number} Delay in ms
 */
function getDelay(attempt, config) {
  const baseDelay = config.initialDelayMs * Math.pow(config.backoffFactor, attempt)
  const capped = Math.min(baseDelay, config.maxDelayMs)
  if (config.jitter) {
    // Add ±20% random jitter
    const jitterAmount = capped * 0.2 * (Math.random() * 2 - 1)
    return Math.max(0, Math.floor(capped + jitterAmount))
  }
  return capped
}

/**
 * Retry an async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {object} userConfig - Override default config
 * @returns {Promise<any>} Result of successful attempt
 */
export async function retryWithBackoff(fn, userConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...userConfig }
  let lastError

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn(attempt)
      return result
    } catch (err) {
      lastError = err

      // Don't retry if this is the last attempt
      if (attempt === config.maxRetries) break

      // Don't retry certain error types
      if (err.name === 'AbortError') throw err
      if (err.isOffline) throw err

      const delay = getDelay(attempt, config)
      console.warn(
        `Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms:`,
        err.message
      )
      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Create a timeout promise
 * @param {number} ms
 * @param {string} message
 */
export function timeoutPromise(ms, message = 'Request timed out') {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const err = new Error(message)
      err.name = 'TimeoutError'
      reject(err)
    }, ms)
  })
}

/**
 * Race a promise against a timeout
 * @param {Promise} promise
 * @param {number} ms
 * @param {string} message
 */
export function withTimeout(promise, ms, message) {
  return Promise.race([promise, timeoutPromise(ms, message)])
}
