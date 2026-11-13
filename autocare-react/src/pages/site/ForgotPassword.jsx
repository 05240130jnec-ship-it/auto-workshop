import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api.js'
import usePageTitle from '../../ui/usePageTitle.js'
import useSettings from '../../data/useSettings.js'
import '../../styles/login.css'

// Forgot password (/forgot-password) — the same card look as the login page.
//   Step 1: type your email          -> POST /api/auth/forgot  (a 6-digit code is emailed)
//   Step 2: code + new password      -> POST /api/auth/reset
//   Step 3: "Password changed!"      -> go to the login page
// All texts come from MySQL (admin → Website Content → Login & profile).

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function ForgotPassword() {
  usePageTitle('Forgot Password')
  const s = useSettings() || {}
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [show, setShow] = useState(false)
  const [show2, setShow2] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(0)         // seconds before "Send a new code" works again

  // Count down the wait for a new code
  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  // Step 1 (and "Send a new code"): ask for a code
  async function sendCode(e) {
    if (e) e.preventDefault()
    setError(''); setInfo('')
    if (!EMAIL.test(email.trim())) return setError('Please enter a valid email address.')
    setBusy(true)
    try {
      await api('/auth/forgot', { method: 'POST', body: { email: email.trim() } })
      if (step === 2) setInfo('A new code is on its way. Check your email.')
      setStep(2)
      setWait(60)
    } catch (err) {
      if (err.data && err.data.wait) { setWait(err.data.wait); setStep(2) }
      setError(err.message)
    }
    setBusy(false)
  }

  // Step 2: check the code and save the new password
  async function reset(e) {
    e.preventDefault()
    setError(''); setInfo('')
    if (!/^\d{6}$/.test(code.trim())) return setError('Please enter the 6-digit code from the email.')
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return setError('Password: at least 8 characters, with a letter and a number.')
    if (pw !== pw2) return setError('The passwords do not match.')
    setBusy(true)
    try {
      await api('/auth/reset', { method: 'POST', body: { email: email.trim(), code: code.trim(), password: pw } })
      setStep(3)
    } catch (err) { setError(err.message) }
    setBusy(false)
  }

  const eye = (on, toggle) => (
    <button type="button" className="lg-eye" onClick={toggle} aria-label={on ? 'Hide password' : 'Show password'}>
      <i className={on ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
    </button>
  )

  return (
    <div className="lg lg-page">
      {step === 3 ? (
        // ===== Step 3: done =====
        <div className="am-card am-success">
          <span className="am-success-icon"><i className="bi bi-check-lg"></i></span>
          <h3>{s.forgotDoneTitle || 'Password changed!'}</h3>
          <p>{s.forgotDoneText}</p>
          <div className="am-success-btns">
            <button className="lg-btn" onClick={() => navigate('/login', { replace: true })}>
              Sign in <i className="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>
      ) : (
        <div className="am-card su-card lg-solo">
          <div className="am-head">
            <span className="fp-icon"><i className={step === 1 ? 'bi bi-key-fill' : 'bi bi-envelope-check-fill'}></i></span>
            <div>
              <strong>{s.forgotTitle || 'Forgot your password?'}</strong>
              <small>{step === 1 ? s.forgotText : (s.forgotCodeText || '').split('{email}').join(email.trim())}</small>
            </div>
          </div>

          {error && <div className="lg-error"><i className="bi bi-exclamation-circle"></i> {error}</div>}
          {info && <div className="fp-info"><i className="bi bi-info-circle"></i> {info}</div>}

          {step === 1 ? (
            // ===== Step 1: email =====
            <form className="su-form" onSubmit={sendCode} noValidate>
              <div className="lg-field">
                <label htmlFor="fp-email">Email address</label>
                <div className="lg-input">
                  <input id="fp-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <button className="lg-btn" disabled={busy}>
                {busy ? <><span className="spinner-border spinner-border-sm"></span> Sending…</> : <>Send code <i className="bi bi-send"></i></>}
              </button>
            </form>
          ) : (
            // ===== Step 2: code + new password =====
            <form className="su-form" onSubmit={reset} noValidate>
              <div className="lg-field">
                <label htmlFor="fp-code">6-digit code</label>
                <div className="lg-input">
                  <input id="fp-code" className="fp-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>
              <div className="lg-field">
                <label htmlFor="fp-pw">New password</label>
                <div className="lg-input">
                  <input id="fp-pw" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
                  {eye(show, () => setShow(!show))}
                </div>
                <div className="lg-hint">At least 8 characters, with a letter and a number</div>
              </div>
              <div className="lg-field">
                <label htmlFor="fp-pw2">Confirm new password</label>
                <div className="lg-input">
                  <input id="fp-pw2" type={show2 ? 'text' : 'password'} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
                  {eye(show2, () => setShow2(!show2))}
                </div>
              </div>
              <button className="lg-btn" disabled={busy}>
                {busy ? <><span className="spinner-border spinner-border-sm"></span> Saving…</> : <>Save new password <i className="bi bi-check-lg"></i></>}
              </button>
              <p className="su-foot">
                No email?{' '}
                <button type="button" className="su-link" onClick={() => sendCode()} disabled={busy || wait > 0}>
                  {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
                </button>
                {' · '}
                <button type="button" className="su-link" onClick={() => { setStep(1); setCode(''); setError(''); setInfo('') }}>Change email</button>
              </p>
            </form>
          )}

          <Link to="/login" className="lg-back"><i className="bi bi-arrow-left"></i> Back to login</Link>
        </div>
      )}
    </div>
  )
}
