import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { HOME_FOR } from '../auth/users.js'
import usePageTitle from '../ui/usePageTitle.js'
import LoginForm from '../auth/LoginForm.jsx'
import SignupModal from '../ui/SignupModal.jsx'
import '../styles/login.css'

// The login page (/login). The person icon in the navbar opens it.
// "Create an account" opens the sign-up form as a pop-up on top of this page.
// /signup shows this same page with the pop-up already open.
export default function Login({ signup = false }) {
  usePageTitle(signup ? 'Create Account' : 'Log in')
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showSignup, setShowSignup] = useState(signup)   // the "Create an account" pop-up
  const [created, setCreated] = useState(null)           // the new account → "created" message

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
    <div className="lg">
      <section className="lg-brand">
        <div className="lg-logo">
          <img src="/media/logo.jpg" alt="AutoCare Pro logo" />
          <div><strong>AutoCare Pro</strong><small>Car care, done right</small></div>
        </div>

        <div className="lg-copy">
          <span className="tag"><i className="bi bi-shield-check"></i> Trusted Toyota service</span>
          <h1>Your car, <span>in good hands.</span></h1>
          <p>Sign in to book a service, follow your repair step by step and order genuine parts.</p>
          <ul className="lg-feats">
            <li><i className="bi bi-calendar-check"></i> Book a service in a few clicks</li>
            <li><i className="bi bi-activity"></i> See your repair status live</li>
            <li><i className="bi bi-bag-check"></i> Order parts and collect them at the workshop</li>
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

          <LoginForm onDone={goOn} />

          <p className="lg-signup">New customer? <button type="button" className="lg-link lg-link-btn" onClick={() => setShowSignup(true)}>Create an account</button></p>
          <Link to="/" className="lg-back"><i className="bi bi-arrow-left"></i> Back to website</Link>
        </div>
      </section>

      <SignupModal
        open={showSignup || !!created}
        created={created}
        onCreated={setCreated}
        onClose={closeSignup}
        onBook={() => navigate('/booking', { replace: true })}
        onWebsite={() => navigate('/', { replace: true })}
      />
    </div>
  )
}
