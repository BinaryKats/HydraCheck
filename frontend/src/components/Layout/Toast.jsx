/**
 * Toast Notification Component
 * Success/error/info toasts that auto-dismiss after 3-4 seconds
 *
 * @see design.md Section 11 - Toast & Error States
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react'
import { formatISTShort } from '../../utils/dateUtils'

function ToastItem({ toast, onDismiss }) {
  const [hovered, setHovered] = useState(false)

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'neutral':
        return <Loader2 className="w-5 h-5 text-text-secondary animate-spin" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30'
      case 'error':
        return 'bg-red-500/10 border-red-500/30'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30'
      case 'neutral':
        return 'bg-white/80 border-black/10'
      default:
        return 'bg-blue-500/10 border-blue-500/30'
    }
  }

  const getProgressColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      default: return 'bg-blue-500'
    }
  }

  // Default duration for the dismiss progress bar
  const duration = toast.duration ?? 4000

  return (
    <motion.div
      layout
      className={`relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border ${getBgColor(toast.type)} min-w-[320px] max-w-md backdrop-blur-md`}
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex-shrink-0">
        {getIcon(toast.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{toast.message}</p>
        {toast.timestamp && (
          <p className="text-xs text-text-secondary mt-0.5">
            {formatISTShort(toast.timestamp)}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-text-secondary hover:text-text-primary hover:bg-white/10 rounded active:scale-90 transition-all flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
      {/* Dismissible countdown bar — pauses on hover */}
      {duration > 0 && (
        <motion.div
          className={`absolute bottom-0 left-0 h-0.5 ${getProgressColor(toast.type)} opacity-50`}
          initial={{ width: '100%' }}
          animate={{ width: hovered ? '100%' : '0%' }}
          transition={hovered ? { duration: 0.2 } : { duration: duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  )
}

function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[2000] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook to manage toasts
export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = (type, message, duration = 4000) => {
    const id = Date.now()
    const newToast = {
      id,
      type,
      message,
      timestamp: new Date().toISOString()
    }

    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }

    return id
  }

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const toast = {
    success: (msg, duration) => addToast('success', msg, duration),
    error: (msg, duration) => addToast('error', msg, duration),
    warning: (msg, duration) => addToast('warning', msg, duration),
    info: (msg, duration) => addToast('info', msg, duration),
    neutral: (msg, duration) => addToast('neutral', msg, duration)
  }

  return { toast, toasts, dismissToast, addToast }
}

export default Toast