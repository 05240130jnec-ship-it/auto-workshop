import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import useTheme from '../ui/useTheme.js'
import { today } from '../data/store.js'
import MechanicDataProvider from '../pages/mechanic/MechanicDataProvider.jsx'
import { useMechanic } from '../pages/mechanic/MechanicContext.js'

// Mechanic portal: loads my jobs from the backend first, then shows the sidebar + page.
// "My profile" and "Log out" are in the avatar menu at the top right (MTopbar.jsx).
export default function MechanicLayout() {
  useTheme('mechanic')
  return (
    <MechanicDataProvider>
      <MechanicShell />
    </MechanicDataProvider>
  )
}

function MechanicShell() {
  const { data, reload } = useMechanic()
  const { hash, pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // Fresh data each time another page opens (the admin may have assigned new jobs)
  useEffect(() => { reload() }, [pathname, reload])

  // Numbers for the badges and the "Today" card
  const jobs = data.repairs
  const active = jobs.filter((r) => r.status === 'pending' || r.status === 'progress')
  const waiting = jobs.filter((r) => r.status === 'pending')
  const doneToday = jobs.filter((r) => r.status === 'complete' && (r.completedOn || r.due) === today()).length
  const totalToday = active.length + doneToday
  const percent = totalToday ? Math.round((doneToday / totalToday) * 100) : 0
  const next = jobs.find((r) => r.status === 'progress') || waiting[0]

  const cls = (on) => 'ms-link' + (on ? ' active' : '')
  const go = () => setOpen(false)

  return (
    <div className="m-shell">
      <aside className={'m-sidebar ms-side' + (open ? ' open' : '')} id="mSidebar">
        {/* Logo */}
        <div className="ms-brand">
          <img src="/media/logo.jpg" alt="AutoCare Pro logo" />
          <div>
            <strong>AutoCare Pro</strong>
            <small><span className="ms-dot"></span> Mechanic portal</small>
          </div>
        </div>

        {/* Menu */}
        <span className="ms-label">Menu</span>
        <nav className="ms-nav">
          <NavLink to="/mechanic" end onClick={go} className={({ isActive }) => cls(isActive)}>
            <i className="bi bi-grid-1x2-fill"></i><span>Dashboard</span>
          </NavLink>
          <NavLink to="/mechanic/repairs" onClick={go} className={({ isActive }) => cls(isActive)}>
            <i className="bi bi-wrench-adjustable"></i><span>My Repairs</span>
            {active.length > 0 && <em className="ms-badge">{active.length}</em>}
          </NavLink>
          <Link to="/mechanic/reports#parts" onClick={go} className={cls(pathname === '/mechanic/reports' && hash === '#parts')}>
            <i className="bi bi-tools"></i><span>Parts Used</span>
          </Link>
          <Link to="/mechanic/reports" onClick={go} className={cls(pathname === '/mechanic/reports' && hash !== '#parts')}>
            <i className="bi bi-file-earmark-bar-graph-fill"></i><span>My Reports</span>
          </Link>
        </nav>

        {/* Today card */}
        <div className="ms-today">
          <div className="ms-today-head">
            <span><i className="bi bi-calendar2-check"></i> Today</span>
            <strong>{doneToday}/{totalToday}</strong>
          </div>
          <div className="ms-bar"><div style={{ width: percent + '%' }}></div></div>
          <p>{waiting.length === 0 ? 'No jobs waiting. Great work!' : `${waiting.length} job${waiting.length > 1 ? 's' : ''} waiting to start`}</p>
          {next && (
            <Link to={'/mechanic/repairs/' + next.id} className="ms-today-btn" onClick={go}>
              {next.status === 'progress' ? 'Continue job' : 'Start next job'} <i className="bi bi-arrow-right"></i>
            </Link>
          )}
        </div>
      </aside>

      {open && <div className="ms-backdrop" onClick={go}></div>}

      <main className="m-main">
        <button className="m-sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Menu"><i className="bi bi-list"></i></button>
        <Outlet />
      </main>
    </div>
  )
}