/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 */

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.handleReset
        })
      }

      return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-bg-primary p-6 text-text-primary">
          <div className="max-w-md w-full bg-bg-surface border border-border rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-text-primary">
              Something went wrong
            </h1>

            <p className="text-sm text-text-secondary">
              An unexpected error occurred in the map interface. We've preserved
              your session data.
            </p>

            {this.state.error && (
              <div className="p-3 bg-bg-primary rounded-lg text-left text-xs font-mono text-red-400 overflow-x-auto border border-border max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={this.handleReset}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent text-slate-900 font-semibold text-sm hover:bg-blue-400 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
