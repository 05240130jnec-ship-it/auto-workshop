import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { HOME_FOR } from '../auth/users.js'
import LoginForm from '../auth/LoginForm.jsx'
import SignupForm from '../auth/SignupForm.jsx'
import '../styles/login.css'

// The login / create-account pop-up on the website (opened by the person icon in the navbar).
//   tab     'login' | 'signup' (or null = closed)
//   setTab  switches the tab, or closes the pop-up with setTab(null)
// A customer stays on the page they were reading; a mechanic/admin goes to their panel.
export default function AuthModal({ tab, setTab, onWelcome }) {
  const navigate = useNavigate()
  const card = useRef(null)

  // Esc closes the pop-up; the page behind does not scroll while it is open
  useEffect(() => {
    if (!tab) return
    const esc = (e) => { if (e.key === 'Escape') setTab(null) }
    document.addEventListener('keydown', esc)
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = old }
  }, [tab, setTab])

  if (!tab) return null

  function done(user) {
    setTab(null)
    if (user.role !== 'customer') return navigate(HOME_FOR[user.role])
    if (onWelcome) onWelcome(user)
  }

  return (
    <div className="am-backdrop" onMouseDown={(e) => { if (!card.current.contains(e.target)) setTab(null) }}>
      <div className="am-card lg-in-modal" ref={card} role="dialog" aria-modal="true" aria-label={tab === 'login' ? 'Sign in' : 'Create account'}>
        <button className="am-close" onClick={() => setTab(null)} aria-label="Close"><i className="bi bi-x-lg"></i></button>

        <div className="am-head">
          <img src="/media/logo.jpg" alt="" />
          <div>
            <strong>{tab === 'login' ? 'Welcome back' : 'Create your account'}</strong>
            <small>{tab === 'login' ? 'Sign in to book and track your repairs' : "It's free and only takes a minute"}</small>
          </div>
        </div>

        <div className="am-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'on' : ''} onClick={() => setTab('login')}>Sign in</button>
          <button role="tab" aria-selected={tab === 'signup'} className={tab === 'signup' ? 'on' : ''} onClick={() => setTab('signup')}>Create account</button>
        </div>

        <div className="am-body">
          {tab === 'login'
            ? <LoginForm key="login" onDone={done} onLink={() => setTab(null)} />
            : <SignupForm key="signup" onDone={done} />}
        </div>
      </div>
    </div>
  )
}
