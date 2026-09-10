/**
 * useMediaQuery hook - Detect screen size for responsive components
 * Returns true if the screen matches the given media query
 */

import { useState, useEffect } from 'react'

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)

    // Set initial value
    setMatches(mediaQuery.matches)

    // Listen for changes
    const handler = (e) => setMatches(e.matches)
    mediaQuery.addEventListener('change', handler)

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

export default useMediaQuery