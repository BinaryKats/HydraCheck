/**
 * CatThankYou — quick thanks popup shown after submitting "is it flooded?" feedback.
 * Light, snappy, and unobtrusive. Auto-dismisses after ~3.5s.
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const LINES_YES_FLOODED = [
  "meow — i don't like getting my paws wet either. thanks for the heads-up! 🐾",
  "eek! that sounds soggy… one paw in and i'm out. staying dry with your tip!",
  "oh no, a splash zone 😿 i'll keep my fur dry — thanks for warning the humans!",
  "waow… i'd need tiny floaties. reporting from dry ground, thanks!",
]

const LINES_NO_CLEAR = [
  "woo — paws stay dry! you've saved my whiskers 🐾",
  "clear roads? *purrs loudly* nothing better than dry asphalt. thanks!",
  "dry and free — i can chase the sun without wet paws. thank you!",
  "happy tail wiggle — the street is paw-safe again. thanks friend!",
]

function pickLine(pool) {
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function CatThankYou({ open, isFlooded, onClose }) {
  const [selectedMessage, setSelectedMessage] = useState('')
  const onCloseRef = useRef(onClose)

  // Keep latest onClose in a ref so changes in function identity never re-run effects
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Pick message once when `open` becomes true
  useEffect(() => {
    if (!open) {
      setSelectedMessage('')
      return
    }

    const msg = isFlooded ? pickLine(LINES_YES_FLOODED) : pickLine(LINES_NO_CLEAR)
    setSelectedMessage(msg)

    const timer = setTimeout(() => {
      if (onCloseRef.current) {
        onCloseRef.current()
      }
    }, 3500)

    return () => clearTimeout(timer)
  }, [open, isFlooded])

  return (
    <AnimatePresence>
      {open && selectedMessage ? (
        <motion.div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2200] pointer-events-auto max-w-[90vw] sm:max-w-md"
          role="status"
          aria-live="polite"
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 15, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div
            onClick={() => {
              if (onCloseRef.current) onCloseRef.current()
            }}
            className="cursor-pointer flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-bg-surface/95 backdrop-blur-md border border-border shadow-lg shadow-black/5 hover:border-text-secondary/30 transition-all text-text-primary text-xs sm:text-sm font-medium"
          >
            <span className="text-base select-none shrink-0" aria-hidden="true">🐾</span>
            <span className="leading-snug">{selectedMessage}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onCloseRef.current) onCloseRef.current()
              }}
              className="ml-1 p-0.5 text-text-secondary hover:text-text-primary rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
