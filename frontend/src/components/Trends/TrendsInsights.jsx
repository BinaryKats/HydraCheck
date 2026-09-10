/**
 * Trends & Insights Component
 * Historical data visualization dashboard
 *
 * Features:
 * - Area picker (dropdown)
 * - Period selector (24h, 7d, 30d)
 * - Single-graph presentation (Rainfall / Traffic / Waterlogging / Drainage)
 * - Area insight summary
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CloudRain, Car, Droplets, Waves } from 'lucide-react'
import { TrendingUp } from 'lucide-react'
import { NavigationPageView } from '../Navigation/NavPages'
import ForecastTimeline from './ForecastTimeline'

const AREAS = ['Lajpat Nagar', 'Karol Bagh', 'Saket', 'Dwarka', 'Rohini', 'Connaught Place']

const PERIODS = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' }
]

const METRICS = [
  { id: 'rainfall', label: 'Rainfall', icon: CloudRain },
  { id: 'traffic', label: 'Traffic', icon: Car },
  { id: 'waterlogging', label: 'Waterlogging', icon: Droplets },
  { id: 'drainage', label: 'Drainage', icon: Waves }
]

/* ---------- Mock data generators ---------- */
function genSeries(area, period, points) {
  const seed = area.length + period.length
  return Array.from({ length: points }, (_, i) => {
    const base = Math.sin((i / points) * Math.PI * 2 + seed) * 0.5 + 0.5
    return Math.round(base * 40 + 10 + (seed % 15))
  })
}

function genRainfall(area, period, points) {
  const seed = area.length + period.length
  return Array.from({ length: points }, (_, i) => {
    const base = Math.sin(i / 3 + seed) * 0.5 + 0.5
    const spike = (i % 9) < 2 ? 30 : 0
    return Math.round(base * 20 + spike)
  })
}

/* ---------- Area Insight ---------- */
function areaInsight(area, period) {
  const events = period === '24h' ? 3 : period === '7d' ? 11 : 24
  return `${area} has experienced ${events} waterlogging events over the selected period, most during high-intensity rainfall. Traffic typically recovers ~20–30 min after conditions improve, and drainage capacity is weakest near low-lying stretches during monsoon peaks.`
}

/* ---------- Charts ---------- */
function LineChart({ data, color }) {
  const w = 320
  const h = 140
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = (max - min) || 1
  const step = w / (data.length - 1)
  const pts = data.map((v, i) => {
    const x = i * step
    const y = h - ((v - min) / range) * (h - 16) - 8
    return [x, y]
  })
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const areaPath = `${path} L${w},${h} L0,${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img">
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      <path d={areaPath} fill={color} opacity="0.15" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill={color} />
      ))}
    </svg>
  )
}

function BarChart({ data, color }) {
  const w = 320
  const h = 140
  const max = Math.max(...data) || 1
  const bw = (w / data.length) * 0.6

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img">
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      {data.map((v, i) => {
        const x = (i / data.length) * w + bw / 2
        const bh = (v / max) * (h - 16)
        return (
          <rect key={i} x={x} y={h - bh - 8} width={bw} height={bh} rx="2" fill={color} opacity="0.85" />
        )
      })}
    </svg>
  )
}

function DotPlot({ data, color }) {
  const w = 320
  const h = 140
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img">
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      {data.map((v, i) => (
        <circle
          key={i}
          cx={Math.min((i / data.length) * w + 6, w - 6)}
          cy={h - ((v / (Math.max(...data) || 1)) * (h - 16)) - 8}
          r={4 + (v % 4)}
          fill={color}
          opacity="0.8"
        />
      ))}
    </svg>
  )
}

function MetricCard({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-colors border ${
        active ? 'bg-accent/15 border-accent text-accent' : 'bg-bg-primary border-border text-text-secondary hover:bg-bg-tertiary'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

function TrendsInsights({ onClose }) {
  const [area, setArea] = useState(AREAS[0])
  const [period, setPeriod] = useState('7d')
  const [metric, setMetric] = useState('rainfall')
  const [data, setData] = useState([])

  const points = period === '24h' ? 12 : period === '7d' ? 14 : 16

  useEffect(() => {
    if (metric === 'rainfall') {
      setData(genRainfall(area, period, points))
    } else {
      setData(genSeries(area, period, points))
    }
  }, [area, period, metric, points])

  const handleTimelineUpdate = (timeId) => {
    console.log(`Timeline updated to: ${timeId}`)
  }

  const activeMetric = METRICS.find(m => m.id === metric)
  const accentColor = metric === 'rainfall' ? 'var(--accent)' :
                      metric === 'traffic' ? '#8b5cf6' :
                      metric === 'waterlogging' ? '#ef4444' : '#10b981'

  const statValue =
    metric === 'rainfall' ? `${Math.max(...data)} mm/hr` :
    metric === 'traffic' ? `${Math.max(...data)}% slower` :
    metric === 'waterlogging' ? `${data.filter(v => v > 40).length} events` :
    `EDI ${(Math.min(...data) / 100 + 0.55).toFixed(2)}`

  return (
    <NavigationPageView title="Trends & Insights" icon={TrendingUp} onClose={onClose}>
      {/* Forecast Timeline */}
      <div className="mb-6">
        <ForecastTimeline onUpdate={handleTimelineUpdate} />
      </div>

      {/* Area & Period Controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-text-secondary">Area</label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                period === p.id ? 'bg-accent text-slate-900 border-accent' : 'bg-bg-primary border-border text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Tabs */}
      <div className="flex gap-2 mb-6">
        {METRICS.map(m => (
          <MetricCard
            key={m.id}
            active={metric === m.id}
            onClick={() => setMetric(m.id)}
            icon={m.icon}
            label={m.label}
          />
        ))}
      </div>

      {/* Single graph */}
      <motion.div
        key={`${area}-${period}-${metric}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-primary rounded-xl border border-border p-4 mb-6"
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-text-primary">{activeMetric.label} Trend</h3>
          <span className="text-lg font-mono font-bold" style={{ color: accentColor }}>
            {statValue}
          </span>
        </div>
        {metric === 'waterlogging' ? (
          <DotPlot data={data} color={accentColor} />
        ) : metric === 'drainage' ? (
          <BarChart data={data} color={accentColor} />
        ) : (
          <LineChart data={data} color={accentColor} />
        )}
        <div className="text-xs text-text-secondary mt-2 flex justify-between">
          <span>Past</span>
          <span>{period === '24h' ? '24h' : period === '7d' ? '7 days' : '30 days'}</span>
        </div>
      </motion.div>

      {/* Area Insight */}
      <div className="bg-accent/10 border border-accent/30 rounded-xl p-5">
        <h3 className="text-sm font-bold text-accent mb-2">Area Insight</h3>
        <p className="text-sm text-text-primary leading-relaxed">{areaInsight(area, period)}</p>
      </div>
    </NavigationPageView>
  )
}

export default TrendsInsights
