import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext.js'
import GoogleButton from '../ui/GoogleButton.jsx'

// The sign-in form. Used on the /login page AND in the pop-up (AuthModal).
//   onDone(user)  → what to do after a good login (the page or pop-up decides)
//   onLink()      → called when a link inside is clicked (the pop-up closes itself)
export default function LoginForm({ onDone, onLink }) {
  const { login, loginWithGoogle } = useAuth()
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
    onDone(res.user)
  }

  // After Google: same as a normal login
  async function handleGoogle(credential) {
    setError('')
    const res = await loginWithGoogle(credential)
    if (res.error) return setError(res.error)
    onDone(res.user)
  }

  return (
    <>
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
          <Link to="/forgot-password" className="lg-link" onClick={onLink}>Forgot password?</Link>
        </div>

        <button type="submit" className="lg-btn" disabled={loading || wait > 0}>
          {loading ? <><span className="spinner-border spinner-border-sm"></span> Signing in…</>
            : wait > 0 ? <><i className="bi bi-hourglass-split"></i> Wait {wait}s</>
            : <>Sign in <i className="bi bi-arrow-right"></i></>}
        </button>
      </form>

      <GoogleButton onCredential={handleGoogle} />
    </>
  )
}
