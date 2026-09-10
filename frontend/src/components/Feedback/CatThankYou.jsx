/**
 * CatThankYou — quick thanks popup shown after submitting "is it flooded?" feedback.
 * Light, snappy, and unobtrusive. Auto-dismisses after ~2s.
 */

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'

const LINES_YES_FLOODED = [
  'meow — i don\'t like getting my paws wet either. thanks for the heads-up! 🐾',
  'eek! that sounds soggy… one paw in and i\'m out. staying dry with your tip!',
  'oh no, a splash zone 😿 i\'ll keep my fur dry — thanks for warning the humans!',
  'waow… i\'d need tiny floaties. reporting from dry ground, thanks!',
]

const LINES_NO_CLEAR = [
  'woo — paws stay dry! you\'ve saved my whiskers 🐾',
  'clear roads? *purrs loudly* nothing better than dry asphalt. thanks!',
  'dry and free — i can chase the sun without wet paws. thank you!',
  'happy tail wiggle — the street is paw-safe again. thanks friend!',
]

function pickLine(pool) {
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function CatThankYou({ open, isFlooded, onClose }) {
  const line = isFlooded ? pickLine(LINES_YES_FLOODED) : pickLine(LINES_NO_CLEAR)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => onClose && onClose(), 2000)
    return () => clearTimeout(t)
  }, [open, onClose])

  if (!open) return null

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2200] pointer-events-auto"
      role="status"
      aria-live="polite"
      initial={{ y: 24, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 12, opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <div
        onClick={onClose}
        className="cursor-pointer text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg"
        style={{
          backgroundImage: 'linear-gradient(135deg, #BAE6FD 0%, #7DD3FC 55%, #38BDF8 100%)',
          boxShadow: '0 8px 20px -6px rgba(56, 189, 248, 0.45), 0 2px 6px -2px rgba(15, 23, 42, 0.15)',
        }}
      >
        <span className="mr-1.5">🐾</span>
        {line}
      </div>
    </motion.div>
  )
}
