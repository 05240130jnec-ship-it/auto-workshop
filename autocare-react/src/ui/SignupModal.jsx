import { useEffect, useRef } from 'react'
import SignupForm from '../auth/SignupForm.jsx'
import '../styles/login.css'

// "Create an account" pop-up (opened from the login page).
//   open        show it or not
//   created     the new account → the pop-up shows "Account created successfully!"
//   onCreated   called with the new account
//   onClose     close the pop-up (✕, Esc, or a click outside)
//   onBook / onWebsite  the two buttons after the account is made
export default function SignupModal({ open, created, onCreated, onClose, onBook, onWebsite }) {
  const card = useRef(null)

  // Esc closes it (not after the account is made); the page behind does not scroll
  useEffect(() => {
    if (!open) return
    const esc = (e) => { if (e.key === 'Escape' && !created) onClose() }
    document.addEventListener('keydown', esc)
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = old }
  }, [open, created, onClose])

  if (!open) return null

  // After the account is made: the success message
  if (created) {
    return (
      <div className="am-backdrop am-center">
        <div className="am-card am-success" role="dialog" aria-modal="true" aria-label="Account created">
          <span className="am-success-icon"><i className="bi bi-check-lg"></i></span>
          <h3>Account created successfully!</h3>
          <p>Welcome to AutoCare Pro, <strong>{created.name.split(' ')[0]}</strong>. Your account is ready and you are signed in.</p>
          <div className="am-success-btns">
            <button className="lg-btn" onClick={onBook}><i className="bi bi-calendar-plus"></i> Book a service</button>
            <button className="am-btn-ghost" onClick={onWebsite}>Go to the website</button>
          </div>
        </div>
      </div>
    )
  }

  // The form
  return (
    <div className="am-backdrop" onMouseDown={(e) => { if (!card.current.contains(e.target)) onClose() }}>
      <div className="am-card su-card" ref={card} role="dialog" aria-modal="true" aria-label="Create account">
        <button className="am-close" onClick={onClose} aria-label="Close"><i className="bi bi-x-lg"></i></button>
        <div className="am-head">
          <img src="/media/logo.jpg" alt="" />
          <div>
            <strong>Create your account</strong>
            <small>It's free and only takes a minute</small>
          </div>
        </div>
        <div className="su-form">
          <SignupForm onDone={onCreated} />
        </div>
        <p className="su-foot">Already have an account? <button type="button" className="su-link" onClick={onClose}>Sign in</button></p>
      </div>
    </div>
  )
}
