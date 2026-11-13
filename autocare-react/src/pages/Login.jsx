import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { HOME_FOR } from '../auth/users.js'
import usePageTitle from '../ui/usePageTitle.js'
import LoginForm from '../auth/LoginForm.jsx'
import SignupModal from '../ui/SignupModal.jsx'
import useSettings from '../data/useSettings.js'
import '../styles/login.css'

// The login page (/login). The person icon in the navbar opens it.
// It looks like the "Create an account" pop-up: one small card in the middle of the page.
// "Create an account" opens the sign-up pop-up on top of this page.
// /signup shows this same page with the pop-up already open.
export default function Login({ signup = false }) {
  usePageTitle(signup ? 'Create Account' : 'Log in')
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showSignup, setShowSignup] = useState(signup)   // the "Create an account" pop-up
  const [created, setCreated] = useState(null)           // the new account → "created" message
  // The texts come from MySQL (admin → Website Content → Login & profile)
  const s = useSettings() || {}

  // Already logged in (and not just created now)? Go straight to your own area.
  if (user && !created) return <Navigate to={HOME_FOR[user.role]} replace />

  function closeSignup() {
    setShowSignup(false)
    if (location.pathname === '/signup') navigate('/login', { replace: true })
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
    <div className="lg lg-page">
      <div className="am-card su-card lg-solo">
        {/* Logo + title, the same as the sign-up pop-up */}
        <div className="am-head">
          <img src="/media/logo.jpg" alt="AutoCare Pro logo" />
          <div>
            <strong>{s.loginFormTitle || 'Welcome back'}</strong>
            <small>{s.loginFormText}</small>
          </div>
        </div>

        <div className="su-form">
          <LoginForm onDone={goOn} />
        </div>

        <p className="su-foot">New customer? <button type="button" className="su-link" onClick={() => setShowSignup(true)}>Create an account</button></p>
        <Link to="/" className="lg-back"><i className="bi bi-arrow-left"></i> Back to website</Link>
      </div>

      <SignupModal
        open={showSignup || !!created}
        created={created}
        texts={s}
        onCreated={setCreated}
        onClose={closeSignup}
        onBook={() => navigate('/booking', { replace: true })}
        onWebsite={() => navigate('/', { replace: true })}
      />
    </div>
  )
}