/**
 * Loading Screen Component
 * Water-themed loading animation for the hyperlocal waterlogging prediction app.
 *
 * @see design.md Section 10 - Iconography & Animation
 */

import { motion } from 'framer-motion'

function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-bg-primary flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* Subtle radial background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--color-accent) 12%, transparent) 0%, transparent 60%)',
        }}
      />

      {/* Floating background droplets */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-blue-400/40 dark:text-blue-300/30"
            initial={{
              y: -40,
              x: Math.random() * 100,
              opacity: 0,
              rotate: Math.random() * 40 - 20,
            }}
            animate={{
              y: ['0vh', '110vh'],
              opacity: [0, 0.5, 0.5, 0],
              rotate: [0, Math.random() * 60 - 30],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ left: `${Math.random() * 100}%` }}
            aria-hidden="true"
          >
            <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
              <path d="M7 0C7 0 0 8 0 13a7 7 0 0014 0C14 8 7 0 7 0z" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Animated water level container */}
        <motion.div
          className="relative w-32 h-32 mb-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200 }}
        >
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-dashed border-accent/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner pulsing circle */}
          <motion.div
            className="absolute inset-2 rounded-full border border-accent/40"
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Water filling animation */}
          <div className="absolute inset-4 rounded-full overflow-hidden bg-bg-surface border border-border shadow-inner">
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              style={{
                background:
                  'linear-gradient(180deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 70%, transparent) 100%)',
              }}
              initial={{ height: '0%' }}
              animate={{ height: ['0%', '70%', '50%', '85%', '60%'] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Water surface wave */}
              <motion.div
                className="absolute -top-1 left-0 right-0 h-2"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, var(--color-accent), transparent)',
                }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>

            {/* Water droplet icon in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.svg
                className="w-8 h-8 text-text-primary drop-shadow"
                viewBox="0 0 24 24"
                fill="currentColor"
                animate={{ y: [-1, 1, -1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path d="M12 2C12 2 5 9 5 14a7 7 0 0014 0c0-5-7-12-7-12z" />
              </motion.svg>
            </div>
          </div>

          {/* Sparkle effects around */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-accent rounded-full"
              style={{
                top: ['10%', '90%', '20%', '80%'][i],
                left: ['15%', '85%', '85%', '15%'][i],
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>

        {/* Title block */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            hydraCheck
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Delhi Hyperlocal Waterlogging Predictions
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="w-64 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 60%, white))',
                boxShadow: '0 0 10px color-mix(in srgb, var(--color-accent) 50%, transparent)',
              }}
              initial={{ width: '0%' }}
              animate={{ width: ['0%', '70%', '40%', '90%', '60%'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>

        {/* Status messages */}
        <motion.div
          className="space-y-1.5 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          {[
            'Initializing sensor network...',
            'Loading rainfall data...',
            'Computing risk predictions...',
          ].map((label, i) => (
            <motion.div
              key={label}
              className="flex items-center justify-center gap-2 text-xs text-text-secondary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeInOut',
              }}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-accent"
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
              <span>{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer credit */}
      <motion.div
        className="absolute bottom-6 text-[10px] text-text-secondary/60 font-mono tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        SMART INDIA HACKATHON 2026
      </motion.div>
    </motion.div>
  )
}

export default LoadingScreen
