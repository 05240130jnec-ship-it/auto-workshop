import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { HOME_FOR } from '../auth/users.js'
import usePageTitle from '../ui/usePageTitle.js'
import { api } from '../api.js'
import '../styles/login.css'

export default function Login() {
  usePageTitle('Log in')
  const { user, login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [wait, setWait] = useState(0)   // seconds left after 5 wrong passwords

  // Count down the 15 seconds, then let them try again
  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => {
      setWait(wait - 1)
      if (wait - 1 === 0) setError('')
      else setError(`Too many wrong attempts. Try again in ${wait - 1} second${wait - 1 > 1 ? 's' : ''}.`)
    }, 1000)
    return () => clearTimeout(t)
  }, [wait])

  // Already logged in? Go straight to your own area.
  if (user) return <Navigate to={HOME_FOR[user.role]} replace />

  // Sends the email + password to the backend (POST /api/auth/login)
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('Please enter your email and password.')

    setLoading(true)
    const res = await login(email, password)   // waits for the backend's answer
    setLoading(false)
    if (res.error) {
      if (res.wait) setWait(res.wait)
      return setError(res.error)
    }
    goOn(res.user)
  }

  // After Google: same as a normal login
  async function handleGoogle(credential) {
    setError('')
    const res = await loginWithGoogle(credential)
    if (res.error) return setError(res.error)
    goOn(res.user)
  }

  function goOn(u) {
    // Go back to the page they tried to open, if their role is allowed there
    const from = location.state?.from
    const allowed = from && (u.role === 'customer'
      ? !from.startsWith('/admin') && !from.startsWith('/mechanic')
      : from.startsWith(HOME_FOR[u.role]))
    navigate(allowed ? from : HOME_FOR[u.role], { replace: true })
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

            <button type="submit" className="lg-btn" disabled={loading || wait > 0}>
              {loading ? <><span className="spinner-border spinner-border-sm"></span> Signing in…</>
                : wait > 0 ? <><i className="bi bi-hourglass-split"></i> Wait {wait}s</>
                : <>Sign in <i className="bi bi-arrow-right"></i></>}
            </button>
          </form>

          <GoogleButton onCredential={handleGoogle} />

          <p className="lg-signup">New customer? <Link to="/signup" className="lg-link">Create an account</Link></p>
          <Link to="/" className="lg-back"><i className="bi bi-arrow-left"></i> Back to website</Link>
        </div>
      </section>
    </div>
  )
}

// ---------- "Continue with Google" button ----------
// Shown only when GOOGLE_CLIENT_ID is set in autocare-backend/.env (GET /api/auth/google-config).
// Google's own script draws the button; when the person picks an account we get a "credential".
function GoogleButton({ onCredential }) {
  const box = useRef(null)
  const [clientId, setClientId] = useState(null)
  const callback = useRef(onCredential)   // always the newest function, without redrawing the button
  callback.current = onCredential

  // 1. Ask the backend if Google login is set up
  useEffect(() => {
    api('/auth/google-config').then((r) => setClientId(r.clientId)).catch(() => {})
  }, [])

  // 2. Load Google's script and draw the button
  useEffect(() => {
    if (!clientId) return
    const draw = () => {
      if (!window.google || !box.current) return
      window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => callback.current(r.credential) })
      window.google.accounts.id.renderButton(box.current, {
        theme: 'outline', size: 'large', shape: 'rectangular', text: 'continue_with', width: box.current.offsetWidth || 360,
      })
    }
    if (window.google && window.google.accounts) return draw()
    let tag = document.getElementById('google-gsi')
    if (!tag) {
      tag = document.createElement('script')
      tag.id = 'google-gsi'
      tag.src = 'https://accounts.google.com/gsi/client'
      tag.async = true
      document.body.appendChild(tag)
    }
    tag.addEventListener('load', draw)
    return () => tag.removeEventListener('load', draw)
  }, [clientId])

  if (!clientId) return null
  return (
    <>
      <div className="lg-or"><span>or</span></div>
      <div ref={box} className="lg-google"></div>
    </>
  )
}
