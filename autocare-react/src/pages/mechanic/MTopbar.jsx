import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.js'
import { useStore, initials } from '../../data/store.js'

// The header row at the top of each mechanic page
export default function MTopbar({ title, sub, back, children }) {
  const { user } = useAuth()
  const { data } = useStore()
  const waiting = data.repairs.filter((r) => r.mechanicId === user.id && r.status === 'pending').length
  return (
    <header className="m-topbar">
      <div>
        {back && <Link to={back} className="text-muted small d-block mb-1" style={{ textDecoration: 'none' }}><i className="bi bi-arrow-left"></i> Back to repairs</Link>}
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      <div className="m-topbar-actions">
        {children}
        <Link to="/" className="m-btn m-btn-outline m-btn-sm"><i className="bi bi-house-door"></i> Main Site</Link>
        <Link to="/mechanic/repairs" className="m-icon-btn" title={waiting + ' job(s) waiting to start'}>
          <i className="bi bi-bell"></i>{waiting > 0 && <span className="m-notif-dot">{waiting}</span>}
        </Link>
        <div className="m-user-chip"><span>{user.name}</span><div className="m-avatar">{initials(user.name)}</div></div>
      </div>
    </header>
  )
}
