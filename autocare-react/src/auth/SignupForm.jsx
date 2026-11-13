import { useState } from 'react'
import { useAuth } from './AuthContext.js'
import GoogleButton from '../ui/GoogleButton.jsx'

// The create-account form. Used on the /signup page AND in the pop-up (AuthModal).
// Creates a customer account (POST /api/auth/signup) or signs up with Google (POST /api/auth/google).
// The backend checks every field again.
//   onDone(user) → what to do after the account is made

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^(\+?975)?[1-8]\d{7}$/            // Bhutan: 8 digits, e.g. 17123456 or +975 17123456
const NAME = /^[A-Za-z][A-Za-z .'-]{1,59}$/       // letters, spaces, . ' -

// The 3 password rules (shown as a checklist under the box)
const RULES = [
  ['At least 8 characters', (p) => p.length >= 8],
  ['A letter (a–z)', (p) => /[A-Za-z]/.test(p)],
  ['A number (0–9)', (p) => /\d/.test(p)],
]


export default function SignupForm({ onDone }) {
  const { signup, loginWithGoogle } = useAuth()
  const [f, setF] = useState({ name: '', email: '', phone: '', address: '', password: '', confirm: '', terms: false })
  const [touched, setTouched] = useState({})       // which boxes the person has left (show red only after that)
  const [showPw, setShowPw] = useState(false)      // eye on Password
  const [showPw2, setShowPw2] = useState(false)    // eye on Confirm password
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const leave = (k) => () => setTouched({ ...touched, [k]: true })

  // What is wrong with each box ('' = fine)
  const problems = {
    name: !f.name.trim() ? 'Please enter your full name' : !NAME.test(f.name.trim()) ? 'Letters and spaces only' : '',
    email: !f.email.trim() ? 'Please enter your email' : !EMAIL.test(f.email.trim()) ? 'Please enter a valid email, e.g. you@gmail.com' : '',
    phone: !f.phone.trim() ? 'Please enter your phone number' : !PHONE.test(f.phone.replace(/[\s-]/g, '')) ? 'Bhutan number, 8 digits, e.g. 17123456' : '',
    address: '',                                   // optional
    password: RULES.every(([, ok]) => ok(f.password)) ? '' : 'At least 8 characters, with a letter and a number',
    confirm: !f.confirm ? 'Please type your password again' : f.confirm !== f.password ? 'The passwords do not match' : '',
    terms: f.terms ? '' : 'Please accept the terms',
  }
  const bad = (k) => touched[k] && problems[k]
  const good = (k) => touched[k] && !problems[k] && f[k]

  async function submit(e) {
    e.preventDefault()
    setError('')
    setTouched({ name: true, email: true, phone: true, password: true, confirm: true, terms: true })
    if (Object.values(problems).some(Boolean)) return setError('Please fix the boxes marked in red.')
    setLoading(true)
    const res = await signup({ ...f, phone: f.phone.replace(/[\s-]/g, '') })
    setLoading(false)
    if (res.error) return setError(res.error)          // e.g. "An account with this email already exists."
    onDone(res.user)
  }

  async function handleGoogle(credential) {
    setError('')
    const res = await loginWithGoogle(credential)
    if (res.error) return setError(res.error)
    onDone(res.user)
  }

  // One input box with its red/green border and message (the icon name is not shown any more)
  const box = (k, label, icon, props = {}) => (
    <div className="lg-field">
      <label htmlFor={'su-' + k}>{label}</label>
      <div className={'lg-input' + (bad(k) ? ' is-bad' : good(k) ? ' is-good' : '')}>
        <input id={'su-' + k} value={f[k]} onChange={set(k)} onBlur={leave(k)} {...props} />
        {good(k) && <i className="bi bi-check-circle-fill lg-ok"></i>}
      </div>
      {bad(k) && <div className="lg-hint is-bad">{problems[k]}</div>}
    </div>
  )

  return (
    <>

    {error && <div className="lg-error"><i className="bi bi-exclamation-circle"></i> {error}</div>}

    <form onSubmit={submit} noValidate>
      {box('name', 'Full name', 'bi-person', { autoComplete: 'name', maxLength: 60 })}

      <div className="lg-two">
        {box('email', 'Email', 'bi-envelope', { type: 'email', autoComplete: 'email', maxLength: 100 })}
        {box('phone', 'Phone number', 'bi-telephone', { type: 'tel', autoComplete: 'tel', maxLength: 16 })}
      </div>

      {box('address', <>Address <span className="lg-optional">(optional)</span></>, 'bi-geo-alt',
        { autoComplete: 'street-address', maxLength: 200 })}

      {/* Password + show/hide */}
      <div className="lg-field">
        <label htmlFor="su-password">Password</label>
        <div className={'lg-input' + (bad('password') ? ' is-bad' : '')}>
          <input id="su-password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
            value={f.password} onChange={set('password')} onBlur={leave('password')} />
          <button type="button" className="lg-eye" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'}>
            <i className={showPw ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
          </button>
        </div>
        {bad('password') && <div className="lg-hint is-bad">{problems.password}</div>}
      </div>

      {/* Confirm password + its own show/hide eye */}
      <div className="lg-field">
        <label htmlFor="su-confirm">Confirm password</label>
        <div className={'lg-input' + (bad('confirm') ? ' is-bad' : good('confirm') ? ' is-good' : '')}>
          <input id="su-confirm" type={showPw2 ? 'text' : 'password'} autoComplete="new-password"
            value={f.confirm} onChange={set('confirm')} onBlur={leave('confirm')} />
          <button type="button" className="lg-eye" onClick={() => setShowPw2(!showPw2)} aria-label={showPw2 ? 'Hide password' : 'Show password'}>
            <i className={showPw2 ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
          </button>
        </div>
        {bad('confirm') && <div className="lg-hint is-bad">{problems.confirm}</div>}
      </div>

      <label className={'lg-check lg-terms' + (bad('terms') ? ' is-bad' : '')}>
        <input type="checkbox" checked={f.terms} onChange={set('terms')} />
        <span>I agree to the Terms of Service and Privacy Policy</span>
      </label>

      <button type="submit" className="lg-btn" disabled={loading}>
        {loading ? <><span className="spinner-border spinner-border-sm"></span> Creating account…</> : <>Create account <i className="bi bi-arrow-right"></i></>}
      </button>
    </form>

    <GoogleButton onCredential={handleGoogle} label="Sign up with Google" />
    </>
  )
}
