import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { useStore, initials } from '../data/store.js'
import useTheme from '../ui/useTheme.js'
import Loading from '../ui/Loading.jsx'

// Mechanic portal layout: your machanic/ sidebar around every mechanic page
export default function MechanicLayout() {
  useTheme('mechanic')
  const { user, logout } = useAuth()
  const store = useStore()
  const { Q } = store
  const me = Q.mechanic(user.id) || {}
  const navigate = useNavigate()
  const { hash, pathname } = useLocation()
  const [open, setOpen] = useState(false)

  const cls = (active) => (active ? 'active' : undefined)
  const go = () => setOpen(false)
  function doLogout(e) {
    e.preventDefault()
    logout()
    navigate('/login')
  }

  return (
    <div className="m-shell">
      <aside className={'m-sidebar' + (open ? ' open' : '')} id="mSidebar">
        <div className="m-brand">
          <div className="m-brand-logo"><img src="/media/logo.jpg" alt="logo" /></div>
          <div className="m-brand-text">
            <strong>AutoPro Care</strong>
            <small>Mechanic portal</small>
          </div>
        </div>

        <div className="m-nav-group">
          <span className="m-nav-label">MAIN</span>
          <ul className="m-nav">
            <li><NavLink to="/mechanic" end onClick={go}><i className="bi bi-grid-1x2-fill"></i> Dashboard</NavLink></li>
            <li><NavLink to="/mechanic/repairs" onClick={go}><i className="bi bi-wrench-adjustable"></i> My Repairs</NavLink></li>
            <li><Link to="/mechanic/reports#parts" className={cls(pathname === '/mechanic/reports' && hash === '#parts')} onClick={go}><i className="bi bi-tools"></i> Parts Used</Link></li>
          </ul>
        </div>

        <div className="m-nav-group">
          <span className="m-nav-label">REPORTS</span>
          <ul className="m-nav">
            <li><Link to="/mechanic/reports" className={cls(pathname === '/mechanic/reports' && !hash)} onClick={go}><i className="bi bi-file-earmark-bar-graph"></i> My Reports</Link></li>
            <li><Link to="/mechanic/reports#performance" className={cls(pathname === '/mechanic/reports' && hash === '#performance')} onClick={go}><i className="bi bi-speedometer2"></i> Performance</Link></li>
          </ul>
        </div>

        <div className="m-nav-group">
          <span className="m-nav-label">ACCOUNT</span>
          <ul className="m-nav">
            <li><NavLink to="/mechanic/profile" onClick={go}><i className="bi bi-person-fill"></i> My Profile</NavLink></li>
            <li><a href="/login" onClick={doLogout}><i className="bi bi-box-arrow-right"></i> Logout</a></li>
          </ul>
        </div>

        <div className="m-user-foot">
          <div className="m-user-info">
            <div className="m-avatar">{initials(user.name)}</div>
            <div className="m-user-text">
              <strong>{user.name}</strong>
              <small>{me.specialization || 'Mechanic'}</small>
            </div>
          </div>
          <a href="/login" className="m-logout" onClick={doLogout}><i className="bi bi-box-arrow-right"></i> Logout</a>
        </div>
      </aside>

      <main className="m-main">
        <button className="m-sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Menu"><i className="bi bi-list"></i></button>
        {store.ready ? <Outlet /> : <Loading error={store.error} onRetry={store.reload} />}
      </main>
    </div>
  )
}
