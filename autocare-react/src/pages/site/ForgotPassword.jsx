import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'

// Without an email server we can't prove who you are online,
// so a password reset is done by the workshop staff.
export default function ForgotPassword() {
  usePageTitle('Forgot Password')

  return (
    <div className="acp-auth-bg">
      <div className="acp-auth-card text-center">
        <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
          style={{ width: 64, height: 64, background: 'var(--brand-yellow)', color: '#fff', fontSize: '1.8rem' }}>
          <i className="bi bi-key"></i>
        </div>
        <h2>Forgot Password?</h2>
        <p className="subtitle">No worries — we'll help you get back in.</p>

        <div className="text-start small bg-light rounded-3 p-3 mb-4">
          <p className="fw-bold mb-2">To reset your password:</p>
          <ol className="mb-0 ps-3">
            <li className="mb-1">Call or visit the workshop.</li>
            <li className="mb-1">Our staff will check your name and phone number.</li>
            <li>They will set a temporary password that you can change after logging in.</li>
          </ol>
        </div>

        <Link to="/contact" className="btn btn-brand-primary w-100 mb-3">
          <i className="bi bi-telephone me-1"></i> Contact the workshop
        </Link>

        <p className="small text-muted mb-0">
          Remembered your password? <Link to="/login" className="text-brand-purple fw-bold">Back to login</Link>
        </p>
      </div>
    </div>
  )
}