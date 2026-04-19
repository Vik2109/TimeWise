import React, { useState } from 'react'
import { Field } from '../components/common/UI'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '../components/common/UI'

const ForgotPassword = () => {
  const {forgotPassword} = useAuth()
  const navigate = useNavigate()
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({email: ""})
  const [loading, setLoading] = useState(false)

  const set = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); setErrors(p => ({ ...p, [k]: '' })) }

  const validate = () => {
  const e = {}
  if (!form.email) e.email = 'Email is required'
  return e
}

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await forgotPassword(form.email)
      toast.success("Password reset link send to your email !")
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email')
    } finally { setLoading(false) }
  }


  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-5">
      <div className="w-full max-w-[420px]">
        <div className="bg-surface-50 border border-white/[0.07] rounded-3xl p-10 relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-teal-300 flex items-center justify-center mb-3 shadow-glow">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.5"/>
                <path d="M12 8v4l2 2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[11px] text-white/30 tracking-[3px] uppercase font-medium">TimeWise</p>
          </div>

          
          <h1 className="text-xl text-white text-center mb-7 font-semibold">Forgot Password</h1>

          <form onSubmit={handleSubmit} className="space-y-0">
            <Field label="Email" error={errors.email}>
              <input
                className={`input ${errors.email ? 'input-error' : ''}`}
                type="email" placeholder="you@example.com"
                value={form.email} onChange={set('email')}
                autoComplete="email" autoFocus
              />
            </Field>

            <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>
              {loading ? <><Spinner size={16} /> Link sending...</> : 'Send Link'}
            </button>
          </form>

         
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword