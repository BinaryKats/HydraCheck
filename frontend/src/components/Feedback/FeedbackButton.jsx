/**
 * Feedback Button Component
 * "Is this road flooded now?" with [Yes/No] buttons
 *
 * @see design.md Section 4 - Feedback
 */

import { useState } from 'react'
import { submitFeedback } from '../../utils/api'
import { Check, X, Send, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'

function FeedbackButton({ hotspot, onFeedbackSubmitted, variant = 'card' }) {
  const [feedbackState, setFeedbackState] = useState('idle') // idle, submitting, success, error
  const [selectedOption, setSelectedOption] = useState(null) // yes, no

  const handleFeedback = async (isFlooded) => {
    if (feedbackState === 'submitting') return

    setSelectedOption(isFlooded ? 'yes' : 'no')
    setFeedbackState('submitting')

    try {
      const result = await submitFeedback({
        hotspotId: hotspot?.hotspot_id,
        hotspotName: hotspot?.hotspot_name,
        isFlooded,
        timestamp: new Date().toISOString(),
        area: hotspot?.area
      })

      if (result.success) {
        setFeedbackState('success')
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted({
            type: 'success',
            message: isFlooded
              ? 'Thanks! This helps warn other drivers.'
              : 'Thanks for confirming! Road appears clear.',
            hotspot
          })
        }
        // Auto-reset after 3 seconds
        setTimeout(() => {
          setFeedbackState('idle')
          setSelectedOption(null)
        }, 3000)
      } else {
        throw new Error('Feedback submission failed')
      }
    } catch (error) {
      console.error('Feedback error:', error)
      setFeedbackState('error')
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted({
          type: 'error',
          message: 'Could not submit feedback. Please try again.',
          hotspot
        })
      }
      setTimeout(() => {
        setFeedbackState('idle')
        setSelectedOption(null)
      }, 3000)
    }
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleFeedback(true)}
          disabled={feedbackState === 'submitting'}
          className="px-3 py-1.5 bg-green-600/80 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
          aria-label="Confirm road is flooded"
        >
          {feedbackState === 'submitting' && selectedOption === 'yes' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <ThumbsUp className="w-3 h-3" />
          )}
        </button>
        <button
          onClick={() => handleFeedback(false)}
          disabled={feedbackState === 'submitting'}
          className="px-3 py-1.5 bg-gray-600/80 hover:bg-gray-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
          aria-label="Confirm road is clear"
        >
          {feedbackState === 'submitting' && selectedOption === 'no' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <ThumbsDown className="w-3 h-3" />
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-bg-surface rounded-lg p-4 border border-border">
      {feedbackState === 'success' ? (
        <div className="text-center py-2">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-sm font-semibold text-text-primary">
            {selectedOption === 'yes'
              ? 'Thanks for the report!'
              : 'Thanks for confirming!'}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Your feedback helps other drivers stay safe.
          </p>
        </div>
      ) : feedbackState === 'error' ? (
        <div className="text-center py-2">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-sm font-semibold text-text-primary">
            Could not submit feedback
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Please try again in a moment.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4 text-accent" />
            <p className="text-sm font-medium text-text-primary">
              Is this road flooded now?
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleFeedback(true)}
              disabled={feedbackState === 'submitting'}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              aria-label="Yes, this road is flooded"
            >
              {feedbackState === 'submitting' && selectedOption === 'yes' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4" />
                  Yes, flooded
                </>
              )}
            </button>
            <button
              onClick={() => handleFeedback(false)}
              disabled={feedbackState === 'submitting'}
              className="flex-1 px-4 py-2.5 bg-bg-primary hover:bg-border text-text-primary text-sm font-semibold rounded-lg transition-colors border border-border disabled:opacity-50 flex items-center justify-center gap-2"
              aria-label="No, this road is clear"
            >
              {feedbackState === 'submitting' && selectedOption === 'no' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ThumbsDown className="w-4 h-4" />
                  No, clear
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default FeedbackButton