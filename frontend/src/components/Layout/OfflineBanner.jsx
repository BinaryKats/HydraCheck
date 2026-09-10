/**
 * OfflineBanner Component
 * Renders a discreet, high-contrast banner at the top of the viewport
 * when the user is disconnected from the internet or viewing cached predictions.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, AlertCircle, RefreshCw } from 'lucide-react'

function OfflineBanner({ isOffline, isCached, cachedAge, onRefresh }) {
  const show = isOffline || isCached

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 inset-x-0 z-[1200] pointer-events-none flex justify-center p-3"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto max-w-lg w-full bg-amber-500/90 hover:bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md border border-amber-400/40 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium transition-all">
            <div className="flex items-center gap-2.5 min-w-0">
              {isOffline ? (
                <WifiOff className="w-4 h-4 shrink-0 text-slate-950 animate-pulse" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-slate-950" />
              )}
              <span className="truncate">
                {isOffline ? (
                  <>
                    <strong className="font-semibold">Offline Mode:</strong>{' '}
                    Showing cached predictions {cachedAge ? `(${cachedAge})` : ''}
                  </>
                ) : (
                  <>
                    <strong className="font-semibold">Cached Data:</strong>{' '}
                    Predictions updated {cachedAge || 'recently'}
                  </>
                )}
              </span>
            </div>

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
                title="Retry connecting"
                aria-label="Refresh connection"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Retry</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineBanner
