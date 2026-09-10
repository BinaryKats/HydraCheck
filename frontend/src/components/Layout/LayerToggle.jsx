/**
 * Layer Toggle Menu Component
 * Mini-menu with checkboxes for toggling map layers
 *
 * @see design.md Section 8 - Layout Structure
 */

import { Layers, X, Droplets, Activity, BarChart3 } from 'lucide-react'

function LayerToggle({ isOpen, onClose, activeLayers, onToggleLayer }) {
  if (!isOpen) return null

  const layers = [
    {
      id: 'risk',
      label: 'Risk View',
      description: 'Waterlogging risk levels',
      icon: BarChart3,
      color: '#EF4444'
    },
    {
      id: 'drainage',
      label: 'Drainage Health',
      description: 'EDI (Effective Drainage Index)',
      icon: Droplets,
      color: '#60A5FA'
    },
    {
      id: 'traffic',
      label: 'Traffic Flow',
      description: 'Real-time traffic conditions',
      icon: Activity,
      color: '#10B981'
    }
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[980]"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[990] bg-bg-surface rounded-xl shadow-2xl border border-border w-64 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-text-secondary" />
            <h3 className="text-sm font-semibold text-text-primary">Map Layers</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-primary rounded-lg active:scale-90 transition-all"
            aria-label="Close layers menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Layer List */}
        <div className="p-2">
          {layers.map((layer) => {
            const isActive = activeLayers.includes(layer.id)
            const Icon = layer.icon

            return (
              <label
                key={layer.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  isActive ? 'bg-bg-primary' : 'hover:bg-bg-primary/50'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => onToggleLayer(layer.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isActive
                        ? 'border-accent bg-accent'
                        : 'border-border bg-transparent'
                    }`}
                  >
                    {isActive && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>

                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: layer.color }} />

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{layer.label}</div>
                  <div className="text-xs text-text-secondary truncate">{layer.description}</div>
                </div>
              </label>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <div className="text-xs text-text-secondary text-center">
            {activeLayers.length} layer{activeLayers.length !== 1 ? 's' : ''} active
          </div>
        </div>
      </div>
    </>
  )
}

export default LayerToggle