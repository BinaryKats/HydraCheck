/**
 * Map Controls FAB Component
 * Floating Action Buttons stacked on middle-right side
 *
 * @see design.md Section 8 - Layout Structure
 */

import { MapPin, Layers, Bell, Route, Cloud } from 'lucide-react'
import { useState } from 'react'

function Fab({ icon: Icon, label, onClick, active = false, activeClass = 'bg-accent text-white border-accent', disabled = false, pulse = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-tooltip={label}
      aria-label={label}
      className={`fab-tooltip group relative w-11 h-11 rounded-full bg-bg-surface shadow-lg border border-border flex items-center justify-center text-text-secondary transition-all duration-200 hover:scale-110 hover:shadow-xl hover:text-text-primary active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${
        active ? activeClass : ''
      }`}
    >
      <Icon className={`w-5 h-5 ${pulse ? 'animate-pulse' : ''}`} />
    </button>
  )
}

function MapControls({
  onLocate,
  onLayersClick,
  mapRef,
  onAlertClick,
  onRouteClick,
  isRouteOpen = false,
  onRainToggle,
  isRainActive = false,
}) {
  const [isLocating, setIsLocating] = useState(false)

  const handleLocate = async () => {
    setIsLocating(true)
    if (onLocate) {
      await onLocate()
    }
    setTimeout(() => setIsLocating(false), 1500)
  }

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[900] flex flex-col gap-2">
      <Fab
        icon={MapPin}
        label="Locate me"
        onClick={handleLocate}
        disabled={isLocating}
        pulse={isLocating}
      />
      <Fab
        icon={Layers}
        label="Toggle layers"
        onClick={onLayersClick}
      />
      <Fab
        icon={Cloud}
        label={isRainActive ? 'Hide rainfall' : 'Show rainfall'}
        onClick={onRainToggle}
        active={isRainActive}
        activeClass="bg-blue-500 text-white border-blue-500"
      />
      <Fab
        icon={Bell}
        label="View alerts"
        onClick={onAlertClick}
      />
      <Fab
        icon={Route}
        label="Route finder"
        onClick={onRouteClick}
        active={isRouteOpen}
        activeClass="bg-accent text-white border-accent"
      />
    </div>
  )
}

export default MapControls
