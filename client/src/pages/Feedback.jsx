import { useState, useEffect } from 'react'
import api from '../utils/api'
import { Spinner, Field, EmptyState } from '../components/common/UI'
import clsx from 'clsx'

const CATEGORIES = ['General', 'Bug Report', 'Feature Request', 'UI/UX', 'Performance']

const CATEGORY_COLORS = {
  'General':         'bg-primary-400/15 text-primary-300',
  'Bug Report':      'bg-coral-300/15 text-coral-300',
  'Feature Request': 'bg-teal-300/15 text-teal-300',
  'UI/UX':           'bg-amber-300/15 text-amber-300',
  'Performance':     'bg-blue-400/15 text-blue-400',
}

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={clsx(
            'text-2xl transition-all duration-100',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
            star <= (hovered || value)
              ? 'text-amber-300'
              : 'text-white/15'
          )}
        >
          ★
        </button>
      ))}
      {!readonly && value > 0 && (
        <span className="ml-2 text-sm text-white/40">
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][value]}
        </span>
      )}
    </div>
  )
}

function FeedbackCard({ feedback }) {
  return (
    <div className="bg-surface-100 border border-white/[0.07] rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <StarRating value={feedback.rating} readonly />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full', CATEGORY_COLORS[feedback.category])}>
            {feedback.category}
          </span>
          <span className={clsx(
            'text-xs font-medium px-2.5 py-1 rounded-full',
            feedback.status === 'resolved' ? 'bg-teal-300/15 text-teal-300' :
            feedback.status === 'reviewed' ? 'bg-primary-400/15 text-primary-300' :
            'bg-white/10 text-white/40'
          )}>
            {feedback.status}
          </span>
        </div>
      </div>
      <p className="text-sm text-white/70 leading-relaxed">{feedback.message}</p>
      <p className="text-xs text-white/25 mt-3">
        {new Date(feedback.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        })}
      </p>
    </div>
  )
}

export default function Feedback() {
  const [form, setForm]       = useState({ rating: 0, category: 'General', message: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    api.get('/feedback/mine')
      .then(data => setHistory(data.feedbacks || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [success])

  const validate = () => {
    const e = {}
    if (!form.rating)              e.rating  = 'Please select a rating'
    if (form.message.length < 10)  e.message = 'Message must be at least 10 characters'
    if (form.message.length > 1000) e.message = 'Message must be under 1000 characters'
    return e
  }

  const submit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setErrors({})
    setLoading(true)
    try {
      await api.post('/feedback', form)
      setSuccess(true)
      setForm({ rating: 0, category: 'General', message: '' })
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setErrors({ submit: err.data?.message || 'Failed to submit feedback' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Feedback</h1>
        <p className="text-white/40 text-sm">Share your thoughts to help us improve TimeWise</p>
      </div>

      {/* Submit Form */}
      <div className="card mb-8">
        <h2 className="font-semibold text-white mb-5">Submit Feedback</h2>

        {success && (
          <div className="bg-teal-300/10 border border-teal-300/20 rounded-lg px-4 py-3 text-sm text-teal-300 mb-5">
            ✓ Thank you! Your feedback has been submitted successfully.
          </div>
        )}

        {errors.submit && (
          <div className="bg-coral-300/10 border border-coral-300/20 rounded-lg px-4 py-3 text-sm text-coral-300 mb-5">
            {errors.submit}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">

          {/* Star Rating */}
          <Field label="How would you rate your experience?" error={errors.rating}>
            <div className="mt-1">
              <StarRating
                value={form.rating}
                onChange={v => setForm(p => ({ ...p, rating: v }))}
              />
            </div>
          </Field>

          {/* Category */}
          <Field label="Category">
            <div className="flex flex-wrap gap-2 mt-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, category: cat }))}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    form.category === cat
                      ? 'bg-primary-400 text-white'
                      : 'bg-surface-200 text-white/50 hover:text-white hover:bg-surface-300'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Field>

          {/* Message */}
          <Field label="Your Message" error={errors.message}>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder="Tell us what you think, what's working well, or what could be improved..."
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              maxLength={1000}
            />
            <p className="text-xs text-white/25 mt-1 text-right">
              {form.message.length}/1000
            </p>
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? <Spinner size={16} /> : 'Submit Feedback'}
          </button>
        </form>
      </div>

      {/* History */}
      <div>
        <h2 className="font-semibold text-white mb-4">Your Previous Feedback</h2>
        {loadingHistory ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>}
            title="No feedback yet"
            description="Your submitted feedback will appear here"
          />
        ) : (
          <div className="space-y-3">
            {history.map(fb => <FeedbackCard key={fb._id} feedback={fb} />)}
          </div>
        )}
      </div>
    </div>
  )
}
