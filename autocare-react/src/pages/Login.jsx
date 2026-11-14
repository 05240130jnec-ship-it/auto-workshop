import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { HOME_FOR } from '../auth/users.js'
import usePageTitle from '../ui/usePageTitle.js'
import LoginForm from '../auth/LoginForm.jsx'
import SignupModal from '../ui/SignupModal.jsx'
import useSettings from '../data/useSettings.js'
import '../styles/login.css'

// The login page. One small card in the middle of the page.
//   /login        → customers: "Create an account" + "Continue with Google"
//   /signup       → the same page with the sign-up pop-up already open
//   /staff-login  → mechanics and the admin: NO sign-up and NO Google
//                   (staff accounts are made only by the admin, Admin → Mechanics)
export default function Login({ signup = false, staff = false }) {
  usePageTitle(staff ? 'Staff Login' : signup ? 'Create Account' : 'Log in')
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showSignup, setShowSignup] = useState(signup && !staff)   // the "Create an account" pop-up
  const [created, setCreated] = useState(null)           // the new account → "created" message
  const [notStaff, setNotStaff] = useState(false)        // a customer tried the staff page
  // The texts come from MySQL (admin → Website Content → Login & profile, and admin → Mechanic Portal)
  const s = useSettings() || {}

  // Already logged in (and not just created now)? Go straight to your own area.
  if (user && !created) return <Navigate to={HOME_FOR[user.role]} replace />

  function closeSignup() {
    setShowSignup(false)
    if (location.pathname === '/signup') navigate('/login', { replace: true })
  }

  function goOn(u) {
    // The staff page is only for mechanics and the admin
    if (staff && u.role === 'customer') {
      logout()
      setNotStaff(true)
      return
    }
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
            <strong>{staff ? (s.staffLoginTitle || 'Staff login') : (s.loginFormTitle || 'Welcome back')}</strong>
            <small>{staff ? s.staffLoginText : s.loginFormText}</small>
          </div>
        </div>

        {notStaff && (
          <div className="lg-error"><i className="bi bi-exclamation-circle"></i> This page is only for workshop staff. Customers, please use the <Link to="/login" className="lg-link">customer login</Link>.</div>
        )}

        <div className="su-form">
          <LoginForm onDone={goOn} google={!staff} />
        </div>

        {staff ? (
          <p className="su-foot"><i className="bi bi-shield-lock"></i> {s.staffLoginNote || 'No account? Ask the workshop admin to add you.'}</p>
        ) : (
          <>
            <p className="su-foot">New customer? <button type="button" className="su-link" onClick={() => setShowSignup(true)}>Create an account</button></p>
            <p className="su-foot lg-staff-link"><Link to="/staff-login" className="su-link">Workshop staff? Log in here</Link></p>
          </>
        )}
        <Link to="/" className="lg-back"><i className="bi bi-arrow-left"></i> Back to website</Link>
      </div>

      {!staff && (
        <SignupModal
          open={showSignup || !!created}
          created={created}
          texts={s}
          onCreated={setCreated}
          onClose={closeSignup}
          onBook={() => navigate('/booking', { replace: true })}
          onWebsite={() => navigate('/', { replace: true })}
        />
      )}
    </div>
  )
}
