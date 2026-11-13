import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { HOME_FOR } from '../auth/users.js'
import usePageTitle from '../ui/usePageTitle.js'
import LoginForm from '../auth/LoginForm.jsx'
import SignupModal from '../ui/SignupModal.jsx'
<<<<<<< HEAD
=======
import useSettings from '../data/useSettings.js'
import Stars from '../ui/Stars.jsx'
import { rows } from '../data/content.js'
>>>>>>> profile-user
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
<<<<<<< HEAD
=======
  // All texts come from MySQL (admin → Website Content → Login page)
  const s = useSettings() || {}
>>>>>>> profile-user

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
          {s.loginTag && <span className="tag"><i className="bi bi-shield-check"></i> {s.loginTag}</span>}
          <h1><Stars text={s.loginTitle} /></h1>
          <p>{s.loginText}</p>
          <ul className="lg-feats">
            {rows(s.loginPoints).map(([icon, text], i) => (
              <li key={i}><i className={'bi ' + (text ? icon : 'bi-check-lg')}></i> {text || icon}</li>
            ))}
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

          <h2>{s.loginFormTitle || 'Welcome back'}</h2>
          <p className="lead-txt">{s.loginFormText}</p>

          <LoginForm onDone={goOn} />

          <p className="lg-signup">New customer? <button type="button" className="lg-link lg-link-btn" onClick={() => setShowSignup(true)}>Create an account</button></p>
          <Link to="/" className="lg-back"><i className="bi bi-arrow-left"></i> Back to website</Link>
        </div>
      </section>

      <SignupModal
        open={showSignup || !!created}
        created={created}
<<<<<<< HEAD
=======
        texts={s}
>>>>>>> profile-user
        onCreated={setCreated}
        onClose={closeSignup}
        onBook={() => navigate('/booking', { replace: true })}
        onWebsite={() => navigate('/', { replace: true })}
      />
    </div>
  )
}
