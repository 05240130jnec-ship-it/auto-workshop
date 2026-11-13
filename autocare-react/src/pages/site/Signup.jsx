import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.js'
import { HOME_FOR } from '../../auth/users.js'
import usePageTitle from '../../ui/usePageTitle.js'
import SignupForm from '../../auth/SignupForm.jsx'
import '../../styles/login.css'

// The sign-up page (/signup). After the account is made, a pop-up says it was created.
export default function Signup() {
  usePageTitle('Create Account')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [created, setCreated] = useState(null)    // the new account → show the "created" pop-up

  // Already logged in (and not just created now)? Go to your own area.
  if (user && !created) return <Navigate to={HOME_FOR[user.role]} replace />

  return (
    <div className="lg">
      {/* ===== LEFT: brand panel ===== */}
      <section className="lg-brand">
        <div className="lg-logo">
          <img src="/media/logo.jpg" alt="AutoCare Pro logo" />
          <div><strong>AutoCare Pro</strong><small>Car care, done right</small></div>
        </div>
        <div className="lg-copy">
          <span className="tag"><i className="bi bi-stars"></i> Free customer account</span>
          <h1>Join AutoCare Pro <span>in one minute.</span></h1>
          <p>One account for all your Toyota services, repairs and parts.</p>
          <ul className="lg-feats">
            <li><i className="bi bi-calendar-check"></i> Book a service online, no phone calls</li>
            <li><i className="bi bi-activity"></i> Follow your repair step by step</li>
            <li><i className="bi bi-clock-history"></i> Keep the history of every visit</li>
          </ul>
        </div>
        <div className="lg-foot">© AutoCare Pro · Bhutan</div>
      </section>

      {/* ===== RIGHT: form ===== */}
      <section className="lg-form-side">
        <div className="lg-card lg-card-wide">
          <div className="lg-mobile-logo">
            <img src="/media/logo.jpg" alt="" />
            <strong>AutoCare Pro</strong>
          </div>
          <h2>Create your account</h2>
          <p className="lead-txt">It's free and only takes a minute.</p>
          <SignupForm onDone={(u) => setCreated(u)} />
          <p className="lg-signup">Already have an account? <Link to="/login" className="lg-link">Sign in</Link></p>
          <Link to="/" className="lg-back"><i className="bi bi-arrow-left"></i> Back to website</Link>
        </div>
      </section>

      {/* ===== "Account created" pop-up ===== */}
      {created && (
        <div className="am-backdrop am-center">
          <div className="am-card am-success" role="dialog" aria-modal="true" aria-label="Account created">
            <span className="am-success-icon"><i className="bi bi-check-lg"></i></span>
            <h3>Account created successfully!</h3>
            <p>Welcome to AutoCare Pro, <strong>{created.name.split(' ')[0]}</strong>. Your account is ready and you are signed in.</p>
            <div className="am-success-btns">
              <button className="lg-btn" onClick={() => navigate('/booking', { replace: true })}>
                <i className="bi bi-calendar-plus"></i> Book a service
              </button>
              <button className="am-btn-ghost" onClick={() => navigate(created.role === 'customer' ? '/' : HOME_FOR[created.role], { replace: true })}>
                Go to the website
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
