/**
 * Time Scrubber Component
 * A compact scrubber pill that lets the user scrub forward through a
 * 6-hour forecast window and watch road colours change.
 * Rendered inside a collapsible panel below the FloatingSearchBar.
 *
 * Controlled component: { timeMinutes, onTimeChange, isPlaying, onTogglePlay }
 * SIH 2026 — Delhi Hyperlocal Waterlogging Prediction
 */

import { Play, Pause, Clock } from 'lucide-react'

function formatLabel(minutes) {
  if (minutes === 0) return 'Now'
  if (minutes < 60) return `+${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `+${h}h` : `+${h}h ${m}m`
}

/* Compute a CSS gradient so the range track shows filled progress. */
function progressStyle(value, max) {
  const pct = (value / max) * 100
  return {
    background: `linear-gradient(to right, var(--color-accent) ${pct}%, var(--color-border) ${pct}%)`,
  }
}

function TimeScrubber({ timeMinutes = 0, onTimeChange, isPlaying = false, onTogglePlay }) {
  return (
    <div className="flex items-center gap-3 bg-bg-surface/90 backdrop-blur-md rounded-full px-4 py-2.5 shadow-lg border border-border">
      {/* Play / Pause */}
      <button
        onClick={onTogglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all active:scale-90 ${
          isPlaying ? 'bg-accent play-pulse' : 'bg-accent hover:brightness-110'
        }`}
        aria-label={isPlaying ? 'Pause forecast' : 'Play forecast'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Clock icon */}
      <Clock className="w-4 h-4 text-text-secondary flex-shrink-0" />

      {/* Slider */}
      <div className="flex flex-col items-center gap-0.5 min-w-[200px] sm:min-w-[280px]">
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={timeMinutes}
          onChange={(e) => onTimeChange(Number(e.target.value))}
          className="time-scrubber-range w-full"
          style={progressStyle(timeMinutes, 360)}
          aria-label="Forecast time offset"
        />
        <div className="flex justify-between w-full text-[10px] text-text-secondary px-0.5">
          <span>Now</span>
          <span className="font-mono font-semibold text-text-primary text-xs tabular-nums">{formatLabel(timeMinutes)}</span>
          <span>+6h</span>
        </div>
      </div>
    </div>
  )
}

export default TimeScrubber
