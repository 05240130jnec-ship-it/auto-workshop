import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.js'
import { HOME_FOR } from '../../auth/users.js'
import usePageTitle from '../../ui/usePageTitle.js'

// Your signup.html — now it really creates a customer account
export default function Signup() {
  usePageTitle('Sign Up')
  const { user, signup } = useAuth()
  const navigate = useNavigate()
  const [f, setF] = useState({ name: '', email: '', phone: '', address: '', password: '', confirm: '', terms: false })
  const [error, setError] = useState('')
  if (user) return <Navigate to={HOME_FOR[user.role]} replace />
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  function submit(e) {
    e.preventDefault()
    setError('')
    if (!f.name || !f.email || !f.phone || !f.address || !f.password) return setError('Please fill in every field.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return setError('Please enter a valid email address.')
    if (f.phone.replace(/\D/g, '').length < 8) return setError('Please enter a valid phone number (8 digits).')
    if (f.password.length < 6) return setError('Password must be at least 6 characters.')
    if (f.password !== f.confirm) return setError('The two passwords do not match.')
    if (!f.terms) return setError('Please agree to the Terms of Service.')
    const res = signup(f)
    if (res.error) return setError(res.error)
    navigate('/my-repairs', { replace: true })
  }

  const field = (key, label, icon, type = 'text', placeholder = '') => (
    <div className="mb-3">
      <label className="form-label small fw-bold" htmlFor={key}>{label}</label>
      <div className="input-group">
        <span className="input-group-text"><i className={'bi ' + icon}></i></span>
        <input id={key} type={type} className="form-control" placeholder={placeholder} value={f[key]} onChange={set(key)} required />
      </div>
    </div>
  )

  return (
    <div className="acp-auth-bg">
      <div className="acp-auth-card">
        <h2 className="text-center">Create Account</h2>
        <p className="subtitle text-center">Sign up to book services and track your repairs</p>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={submit} noValidate>
          {field('name', 'Full Name', 'bi-person', 'text', 'Enter your full name')}
          {field('email', 'Email', 'bi-envelope', 'email', 'Enter your email')}
          {field('phone', 'Phone Number', 'bi-telephone', 'tel', 'e.g. 17XXXXXX')}
          {field('address', 'Home Address', 'bi-house-door', 'text', 'Enter your home address')}
          {field('password', 'Password', 'bi-lock', 'password', 'At least 6 characters')}
          {field('confirm', 'Confirm Password', 'bi-lock', 'password', 'Confirm Password')}
          <div className="form-check mb-3">
            <input className="form-check-input" type="checkbox" id="terms" checked={f.terms} onChange={set('terms')} />
            <label className="form-check-label small text-muted" htmlFor="terms">
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>
          <button type="submit" className="btn btn-brand-primary w-100">Create Account</button>
        </form>

        <p className="small text-muted text-center mt-4 mb-0">
          Already have an account? <Link to="/login" className="text-brand-purple fw-bold">Sign in</Link>
        </p>
        <p className="small text-center mt-2 mb-0"><Link to="/" className="text-muted"><i className="bi bi-arrow-left"></i> Back to website</Link></p>
      </div>
    </div>
  )
}
