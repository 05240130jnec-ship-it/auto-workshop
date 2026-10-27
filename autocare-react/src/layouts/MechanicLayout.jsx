import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { initials } from '../data/store.js'
import useTheme from '../ui/useTheme.js'
import MechanicDataProvider from '../pages/mechanic/MechanicDataProvider.jsx'
import { useMechanic } from '../pages/mechanic/MechanicContext.js'

// Mechanic portal: loads my jobs from the backend first, then shows the sidebar + page
export default function MechanicLayout() {
  useTheme('mechanic')
  return (
    <MechanicDataProvider>
      <MechanicShell />
    </MechanicDataProvider>
  )
}

function MechanicShell() {
  const { user, logout } = useAuth()
  const { data, reload } = useMechanic()
  const me = data.profile || {}
  const navigate = useNavigate()
  const { hash, pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // Fresh data each time another page opens (the admin may have assigned new jobs)
  useEffect(() => { reload() }, [pathname, reload])

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
        <Outlet />
      </main>
    </div>
  )
}