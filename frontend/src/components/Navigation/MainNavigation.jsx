/**
 * Main Navigation Component
 * Slide-out drawer from the left
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, User, Shield, LogIn, Info } from 'lucide-react'

function MainNavigation({ isOpen, onClose, onNavigate }) {
  const menus = [
    { id: 'trends', label: 'Trends & Insights', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'policy', label: 'Policy', icon: Shield },
    { id: 'login', label: 'Login', icon: LogIn },
    { id: 'about', label: 'About', icon: Info },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[1100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-bg-surface z-[1110] border-r border-border shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold bg-gradient-to-r from-accent to-success bg-clip-text text-transparent">
                Delhi Waterlogging
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <nav className="px-3 space-y-1">
                {menus.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id)
                        onClose()
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-bg-primary transition-colors text-text-primary"
                    >
                      <Icon className="w-5 h-5 text-accent" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-border">
              <div className="text-xs text-text-secondary text-center">
                SIH 2026 • Binary Cats
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default MainNavigation
