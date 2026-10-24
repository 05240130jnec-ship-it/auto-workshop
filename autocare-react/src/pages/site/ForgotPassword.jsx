import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api.js'
import usePageTitle from '../../ui/usePageTitle.js'

// Your forgot-password.html. Without an email server, the phone number on the
// account is the proof: email + phone + new password → POST /api/auth/forgot-password
export default function ForgotPassword() {
  usePageTitle('Forgot Password')
  const [f, setF] = useState({ email: '', phone: '', password: '', confirm: '' })
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    if (f.password.length < 6) return setMsg({ ok: false, text: 'Password must be at least 6 characters.' })
    if (f.password !== f.confirm) return setMsg({ ok: false, text: 'The two passwords do not match.' })
    setSaving(true)
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email: f.email.trim().toLowerCase(), phone: f.phone, password: f.password } })
      setMsg({ ok: true, text: 'Password updated. You can log in now.' })
      setF({ email: '', phone: '', password: '', confirm: '' })
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    }
    setSaving(false)
  }

  return (
    <div className="acp-auth-bg">
      <div className="acp-auth-card text-center">
        <h2>Forgot Password?</h2>
        <p className="subtitle">No worries, set a new one below</p>

        {msg && <div className={'alert py-2 small ' + (msg.ok ? 'alert-success' : 'alert-danger')}>{msg.text}</div>}

        <form className="text-start" onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label small fw-bold">Email</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-envelope"></i></span>
              <input type="email" className="form-control" placeholder="Your account email" value={f.email} onChange={set('email')} required />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-bold">Phone number on your account</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-telephone"></i></span>
              <input type="tel" className="form-control" placeholder="e.g. 17394436" value={f.phone} onChange={set('phone')} required />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-bold">New Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock"></i></span>
              <input type="password" className="form-control" placeholder="Enter New Password" value={f.password} onChange={set('password')} required />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-bold">Confirm Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock"></i></span>
              <input type="password" className="form-control" placeholder="Confirm Password" value={f.confirm} onChange={set('confirm')} required />
            </div>
          </div>
          <button type="submit" className="btn w-100 text-white" style={{ background: 'var(--brand-green)' }} disabled={saving}>{saving ? 'Saving…' : 'Reset'}</button>
        </form>

        <p className="small text-muted mt-4 mb-0">
          Remembered your password? <Link to="/login" className="text-brand-purple fw-bold">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
