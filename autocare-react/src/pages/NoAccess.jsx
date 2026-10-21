import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { HOME_FOR } from '../auth/users.js'

export default function NoAccess() {
  const { user, logout } = useAuth()
  return (
    <div className="c-center">
      <div className="a-panel text-center" style={{ maxWidth: 420 }}>
        <div className="a-confirm-icon danger"><i className="bi bi-shield-lock"></i></div>
        <h2 className="h4 fw-bold">No access</h2>
        <p className="text-muted">
          {user ? <>You’re logged in as a <b>{user.role}</b>, so you can’t open that page.</> : 'Please log in first.'}
        </p>
        <div className="d-flex gap-2 justify-content-center">
          {user && <Link to={HOME_FOR[user.role]} className="a-btn a-btn-primary">Go to my area</Link>}
          <Link to="/login" className="a-btn a-btn-outline" onClick={() => user && logout()}>Switch account</Link>
        </div>
      </div>
    </div>
  )
}
