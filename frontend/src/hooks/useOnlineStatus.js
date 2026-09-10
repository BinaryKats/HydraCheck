/**
 * useOnlineStatus Hook
 * Tracks browser online/offline state with event listeners
 * Persists last known online status in localStorage for faster startup
 */

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'last_online_status'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize from localStorage or default to true (assume online)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          return navigator.onLine
        }
      }
      return navigator.onLine
    }
    return true
  })

  const [lastOnline, setLastOnline] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('last_online_timestamp') || null
    }
    return null
  })

  const handleOnline = useCallback(() => {
    const now = new Date().toISOString()
    setIsOnline(true)
    setLastOnline(now)
    localStorage.setItem(STORAGE_KEY, 'true')
    localStorage.setItem('last_online_timestamp', now)
  }, [])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    localStorage.setItem(STORAGE_KEY, 'false')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Set initial state correctly
    const online = navigator.onLine
    setIsOnline(online)
    localStorage.setItem(STORAGE_KEY, online.toString())

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return { isOnline, lastOnline }
}

export default useOnlineStatus