import { useEffect } from 'react'
import clsx from 'clsx'

/* ── Spinner ──────────────────────────────────────────────── */
export function Spinner({ size = 20, className = '' }) {
  return (
    <div
      className={clsx('spinner', className)}
      style={{ width: size, height: size }}
    />
  )
}

/* ── Page loading ────────────────────────────────────────── */
export function PageLoading({ text = 'Loading…' }) {
  return (
    <div className="page-load">
      <Spinner size={28} />
      <span>{text}</span>
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────── */
export function EmptyState({ icon, message = 'Nothing here yet', action }) {
  return (
    <div className="empty-state">
      {icon && <div className="mb-3 text-4xl">{icon}</div>}
      <p className="text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ── Modal ───────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={clsx('modal-box', maxWidth)}>
        {title && <h2 className="modal-title">{title}</h2>}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded-full bg-surface-200 text-white/50 hover:text-white hover:bg-surface-300 transition-colors"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-3.5 h-3.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}

/* ── Confirm delete ──────────────────────────────────────── */
export function ConfirmDelete({ onConfirm, onClose, title = 'Delete this item?', sub = 'This cannot be undone.' }) {
  return (
    <div className="text-center py-2">
      <div className="w-12 h-12 rounded-full bg-coral-300/10 flex items-center justify-center mx-auto mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="#F06464" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-white/40 mb-5">{sub}</p>
      <div className="flex gap-2.5 justify-center">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  )
}

/* ── Toggle ──────────────────────────────────────────────── */
export function Toggle({ on, onChange }) {
  return (
    <div
      className={clsx('toggle', on && 'on')}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
    />
  )
}

/* ── Progress bar ────────────────────────────────────────── */
export function Progress({ value, variant = 'accent', className = '' }) {
  return (
    <div className={clsx('progress-track', className)}>
      <div
        className={clsx('progress-bar', `progress-${variant}`)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

/* ── Priority dot ────────────────────────────────────────── */
export function PriorityDot({ priority }) {
  const color = priority === 'High' ? 'bg-coral-300' : priority === 'Medium' ? 'bg-amber-300' : 'bg-teal-300'
  return <div className={clsx('w-2 h-2 rounded-full shrink-0', color)} />
}

/* ── Avatar ──────────────────────────────────────────────── */
export function Avatar({ initials, size = 'md', className = '' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-16 h-16 text-xl' }
  return (
    <div className={clsx('rounded-full bg-gradient-to-br from-primary-400 to-[#E870A8] flex items-center justify-center font-semibold shrink-0', sizes[size], className)}>
      {initials || '?'}
    </div>
  )
}

/* ── Section header ──────────────────────────────────────── */
export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="section-title">{title}</h3>
      {action}
    </div>
  )
}

/* ── Form field ──────────────────────────────────────────── */
export function Field({ label, error, children }) {
  return (
    <div className="mb-4">
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
