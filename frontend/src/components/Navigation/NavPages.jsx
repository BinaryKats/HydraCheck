/**
 * Navigation View Containers
 */

import { motion } from 'framer-motion'
import { ArrowLeft, User, Shield, LogIn } from 'lucide-react'

export { AboutView } from './AboutView'

export function NavigationPageView({ title, icon: Icon, onClose, children }) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      className="fixed inset-0 z-[1200] bg-bg-primary overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto min-h-screen border-l border-r border-border bg-bg-surface">
        <header className="sticky top-0 bg-bg-surface/80 backdrop-blur-md border-b border-border z-10 px-4 py-4 flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-text-primary text-lg font-bold">
            <Icon className="w-5 h-5 text-accent" />
            {title}
          </div>
        </header>
        <div className="p-6">
          {children}
        </div>
      </div>
    </motion.div>
  )
}

export function ProfileView({ onClose }) {
  return (
    <NavigationPageView title="Profile" icon={User} onClose={onClose}>
      <div className="flex flex-col items-center py-8 text-center border-b border-border mb-8">
        <div className="w-24 h-24 rounded-full bg-accent text-white flex items-center justify-center text-3xl font-bold mb-4">
          JD
        </div>
        <h2 className="text-xl font-bold text-text-primary">John Doe</h2>
        <p className="text-text-secondary">user@example.com</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Account Settings</h3>
        <button className="w-full text-left px-4 py-3 bg-bg-primary rounded-lg border border-border border-l-4 border-l-accent hover:bg-bg-tertiary transition-colors">
          Edit Profile
        </button>
        <button className="w-full text-left px-4 py-3 bg-bg-primary rounded-lg border border-border hover:bg-bg-tertiary transition-colors">
          Saved Hotspots
        </button>
        <button className="w-full text-left px-4 py-3 text-red-400 bg-red-400/10 rounded-lg border border-red-500/20 hover:bg-red-400/20 transition-colors mt-8">
          Sign Out
        </button>
      </div>
    </NavigationPageView>
  )
}

export function PolicyView({ onClose }) {
  return (
    <NavigationPageView title="Privacy Policy" icon={Shield} onClose={onClose}>
      <div className="prose prose-invert max-w-none text-text-primary text-sm leading-relaxed">
        <p className="text-text-secondary mb-8">Last updated: Sept 5, 2026</p>

        <h3 className="text-lg font-bold mt-6 mb-3">1. Information Collection</h3>
        <p className="mb-4">We collect location data and user-reported feedback primarily to improve the accuracy of our hyper-local waterlogging predictions.</p>

        <h3 className="text-lg font-bold mt-6 mb-3">2. Location Data</h3>
        <p className="mb-4">Your precise location is used only while the app is active to center the map and alert you to nearby waterlogging incidents. We do not store historical location traces linked to your identity.</p>

        <h3 className="text-lg font-bold mt-6 mb-3">3. Crowdsourced Feedback</h3>
        <p className="mb-4">When you submit "Flooded" or "Clear" feedback, this data points are aggregated anonymously into our ML pipeline. Your individual submissions may be associated with your account for gamification/reputation scoring purposes.</p>
      </div>
    </NavigationPageView>
  )
}

export function LoginView({ onClose }) {
  return (
    <NavigationPageView title="Sign In" icon={LogIn} onClose={onClose}>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-accent/20">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome Back</h2>
        <p className="text-text-secondary text-center mb-10 max-w-xs">
          Sign in to save areas, report incidents, and customize alerts.
        </p>

        <button className="w-full max-w-sm flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold px-4 py-3 rounded-xl transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </NavigationPageView>
  )
}

