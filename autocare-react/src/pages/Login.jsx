import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { HOME_FOR, DEMO_ACCOUNTS } from '../auth/users.js'
import usePageTitle from '../ui/usePageTitle.js'
import '../styles/login.css'

export default function Login() {
  usePageTitle('Log in')
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in? Go straight to your own area.
  if (user) return <Navigate to={HOME_FOR[user.role]} replace />

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('Please enter your email and password.')

    setLoading(true)
    setTimeout(() => {
      const res = login(email, password)
      setLoading(false)
      if (res.error) return setError(res.error)
      const u = res.user

      // Go back to the page they tried to open, if their role is allowed there
      const from = location.state?.from
      const allowed = from && (u.role === 'customer'
        ? !from.startsWith('/admin') && !from.startsWith('/mechanic')
        : from.startsWith(HOME_FOR[u.role]))
      navigate(allowed ? from : HOME_FOR[u.role], { replace: true })
    }, 500)
  }

  function fill(u) {
    setEmail(u.email)
    setPassword(u.password)
    setError('')
  }

  return (
    <div className="lg">
      <section className="lg-brand">
        <div className="lg-logo">
          <img src="/media/logo.jpg" alt="AutoCare Pro logo" />
          <div><strong>AutoCare Pro</strong><small>Car care, done right</small></div>
        </div>

        <div className="lg-copy">
          <span className="tag"><i className="bi bi-shield-lock-fill"></i> One login for everyone</span>
          <h1>Your workshop, <span>all in one place.</span></h1>
          <p>Customers track their repairs, mechanics manage their jobs, and admins run the whole workshop.</p>
          <ul className="lg-feats">
            <li><i className="bi bi-person"></i> Customers: book services and follow repair progress</li>
            <li><i className="bi bi-wrench-adjustable"></i> Mechanics: see assigned jobs and update status</li>
            <li><i className="bi bi-speedometer2"></i> Admins: manage jobs, staff, stock and orders</li>
          </ul>
        </div>

        <div className="lg-foot">© AutoCare Pro · Thimphu, Bhutan</div>
      </section>

      <section className="lg-form-side">
        <div className="lg-card">
          <div className="lg-mobile-logo">
            <img src="/media/logo.jpg" alt="" />
            <strong>AutoCare Pro</strong>
          </div>

          <h2>Welcome back</h2>
          <p className="lead-txt">Sign in and we’ll take you to the right place.</p>

          {error && <div className="lg-error"><i className="bi bi-exclamation-circle"></i> {error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="lg-field">
              <label htmlFor="email">Email address</label>
              <div className="lg-input">
                <input id="email" type="email" placeholder="you@example.com" autoComplete="username"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
                <i className="bi bi-envelope"></i>
              </div>
            </div>

            <div className="lg-field">
              <label htmlFor="password">Password</label>
              <div className="lg-input">
                <input id="password" type={showPw ? 'text' : 'password'} placeholder="Enter your password"
                  autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <i className="bi bi-lock"></i>
                <button type="button" className="lg-eye" onClick={() => setShowPw(!showPw)} aria-label="Show password">
                  <i className={showPw ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                </button>
              </div>
            </div>

            <div className="lg-row">
              <label className="lg-check"><input type="checkbox" defaultChecked /> Remember me</label>
              <Link to="/forgot-password" className="lg-link">Forgot password?</Link>
            </div>

            <button type="submit" className="lg-btn" disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm"></span> Signing in…</> : <>Sign in <i className="bi bi-arrow-right"></i></>}
            </button>
          </form>

          <div className="lg-demo">
            <p><i className="bi bi-info-circle-fill"></i> Demo accounts — click one to fill in:</p>
            <div className="lg-demo-list">
              {DEMO_ACCOUNTS.map((u) => (
                <button key={u.role} type="button" onClick={() => fill(u)}>
                  <b>{u.label}</b>
                  <span>{u.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="lg-signup">New customer? <Link to="/signup" className="lg-link">Create an account</Link></p>
          <Link to="/" className="lg-back"><i className="bi bi-arrow-left"></i> Back to website</Link>
        </div>
      </section>
    </div>
  )
}
