/**
 * Forecast Timeline Component
 * Shows time progression with NOW, +30m, +60m, +90m options
 * Dynamically updates map hotspot risk states based on timeline position
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

const TIME_POINTS = [
  { id: 'now', label: 'NOW', position: 0, duration: 0 },
  { id: '30m', label: '+30m', position: 0.25, duration: 30 },
  { id: '60m', label: '+60m', position: 0.5, duration: 60 },
  { id: '90m', label: '+90m', position: 0.75, duration: 90 }
]

function ForecastTimeline({ onUpdate }) {
  const [activeTime, setActiveTime] = useState('now')
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState(0)

  // Calculate current time based on position
  const calculateTime = (position) => {
    const totalDuration = 90 // max duration in minutes
    const time = Math.round(position * totalDuration)
    return time >= 0 && time <= 90 ? time : 0
  }

  const handleDrag = (e) => {
    const x = e.clientX
    const container = document.querySelector('.timeline-container')
    if (container) {
      const rect = container.getBoundingClientRect()
      const relativeX = x - container.left
      const percentage = Math.max(0, Math.min(1, relativeX / container.clientWidth))
      setDragPosition(percentage)
    }
  }

  const handleRelease = () => {
    setIsDragging(false)
    const position = dragPosition || (activeTime === 'now' ? 0 :
      activeTime === '30m' ? 0.25 :
      activeTime === '60m' ? 0.5 : 0.75)
    const newTime = calculateTime(position)

    const timePoint = TIME_POINTS.find(p =>
      newTime >= p.position * 90 && newTime < (p.position * 90 + 15)
    ) || TIME_POINTS.find(p => p.id === activeTime)

    setActiveTime(timePoint.id)
    if (onUpdate) onUpdate(timePoint.id)
  }

  const timePoint = TIME_POINTS.find(p => p.id === activeTime) || TIME_POINTS[0]
  const position = dragPosition || timePoint.position

  return (
    <div className="relative max-w-6xl mx-auto px-3">
      {/* Timeline Bar */}
      <div className="timeline-container h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full"
          style={{
            width: `${position * 100}%`,
            transition: 'width 0.1s ease-out'
          }}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleRelease}
          onMouseMove={handleDrag}
        />
      </div>

      {/* Timeline Points */}
      <div className="flex justify-between text-xs text-text-secondary mt-2">
        {TIME_POINTS.map((point, i) => {
          const isActive = activeTime === point.id ||
                          (isDragging && position >= point.position && position < (i < TIME_POINTS.length - 1 ? TIME_POINTS[i + 1].position : 1))

          return (
            <button
              key={point.id}
              onClick={() => setActiveTime(point.id)}
              className={`flex items-center gap-2 px-3 py-1 border rounded-lg transition-all duration-300 ${
                isActive ? 'bg-accent/20 border-accent text-accent' : 'bg-bg-primary border-border text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center">
                  <span className="text-xs font-semibold text-accent">{point.label}</span>
                </div>
                <span className="ml-1 text-xs text-gray-400">{point.label}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Time display */}
      <div className="flex items-center justify-between text-sm text-text-secondary mt-2">
        <span className="flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>{timePoint.label}</span>
        </span>
        <span>{calculateTime(position)} min</span>
      </div>
    </div>
  )
}

export default ForecastTimeline