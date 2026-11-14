import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.js'
import { initials, today, fmtDate } from '../../data/store.js'
import { useMechanic } from './MechanicContext.js'
import useSettings from '../../data/useSettings.js'
import { mt } from './texts.js'
import '../../styles/mechanic-menu.css'

// The header row at the top of each mechanic page:
//   left  = page title
//   right = 🔔 notifications (drop-down) + my avatar (drop-down: My profile, Log out)
// All words come from MySQL (admin → Mechanic Portal).
export default function MTopbar({ title, sub, back, children }) {
  const { user, logout } = useAuth()
  const { data } = useMechanic()
  const s = useSettings()
  const navigate = useNavigate()
  const [open, setOpen] = useState(null)        // which drop-down is open: 'bell' | 'me' | null
  const box = useRef(null)

  // ---------- Notifications, made from my jobs ----------
  const notes = makeNotes(data.repairs, s)

  // Which notifications I have already seen (kept in this browser, per mechanic)
  const seenKey = 'acp_mech_seen_' + user.id
  const [seen, setSeen] = useState(() => {
    try { return JSON.parse(localStorage.getItem(seenKey)) || [] } catch { return [] }
  })
  const unread = notes.filter((n) => !seen.includes(n.key)).length

  function markAllRead() {
    const all = notes.map((n) => n.key)
    setSeen(all)
    try { localStorage.setItem(seenKey, JSON.stringify(all)) } catch { /* storage blocked */ }
  }

  // Close the drop-down when clicking somewhere else or pressing Esc
  useEffect(() => {
    if (!open) return
    const click = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(null) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(null) }
    document.addEventListener('mousedown', click)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', esc) }
  }, [open])

  function toggle(which) {
    setOpen(open === which ? null : which)
  }

  function doLogout() {
    logout()
    navigate('/staff-login')
  }

  return (
    <header className="m-topbar">
      <div>
        {back && <Link to={back} className="text-muted small d-block mb-1" style={{ textDecoration: 'none' }}><i className="bi bi-arrow-left"></i> Back to repairs</Link>}
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>

      <div className="m-topbar-actions" ref={box}>
        {children}

        {/* ===== 🔔 Notifications ===== */}
        <div className="mm-wrap">
          <button type="button" className="m-icon-btn" onClick={() => toggle('bell')} aria-label="Notifications" aria-expanded={open === 'bell'}>
            <i className="bi bi-bell"></i>
            {unread > 0 && <span className="m-notif-dot">{unread}</span>}
          </button>

          {open === 'bell' && (
            <div className="mm-menu mm-notes">
              <div className="mm-head">
                <strong>Notifications</strong>
                {unread > 0 && <button type="button" className="mm-link" onClick={markAllRead}>Mark all as read</button>}
              </div>
              {notes.length === 0 && <p className="mm-empty"><i className="bi bi-bell-slash"></i> {mt(s, 'mNoteEmpty')}</p>}
              <div className="mm-list">
                {notes.map((n) => (
                  <Link key={n.key} to={'/mechanic/repairs/' + n.repairId} className={'mm-note' + (seen.includes(n.key) ? '' : ' is-new')}
                    onClick={() => { setOpen(null); markOneRead(n.key) }}>
                    <span className={'mm-note-icon ' + n.tone}><i className={'bi ' + n.icon}></i></span>
                    <span className="mm-note-body">
                      <strong>{n.title}</strong>
                      <small>{n.text}</small>
                    </span>
                  </Link>
                ))}
              </div>
              <Link to="/mechanic/repairs" className="mm-foot" onClick={() => setOpen(null)}>See all my repairs</Link>
            </div>
          )}
        </div>

        {/* ===== My avatar: profile + log out ===== */}
        <div className="mm-wrap">
          <button type="button" className="m-avatar mm-avatar-btn" onClick={() => toggle('me')} title={user.name} aria-label="My account" aria-expanded={open === 'me'}>
            {initials(user.name)}
          </button>

          {open === 'me' && (
            <div className="mm-menu mm-me">
              <div className="mm-me-top">
                <div className="m-avatar">{initials(user.name)}</div>
                <div>
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </div>
              </div>
              <Link to="/mechanic/profile" className="mm-item" onClick={() => setOpen(null)}>
                <i className="bi bi-person"></i> {mt(s, 'mMenuProfile')}
              </Link>
              <button type="button" className="mm-item mm-danger" onClick={doLogout}>
                <i className="bi bi-box-arrow-right"></i> {mt(s, 'mMenuLogout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )

  // Clicking one notification marks only that one as read
  function markOneRead(key) {
    if (seen.includes(key)) return
    const next = [...seen, key]
    setSeen(next)
    try { localStorage.setItem(seenKey, JSON.stringify(next)) } catch { /* storage blocked */ }
  }
}

// Builds the notification list from my jobs (newest first):
//   - a job the admin gave me that I have not started yet
//   - a car that comes to the workshop today
//   - a job in progress that is past its due date
function makeNotes(repairs, s) {
  const now = today()
  const notes = []
  for (const r of repairs) {
    const car = r.vehicle + (r.plate ? ' · ' + r.plate : '')
    if (r.status === 'pending') {
      notes.push({ key: 'new-' + r.id, repairId: r.id, date: r.date || '', icon: 'bi-wrench-adjustable', tone: 'm-icon-orange',
        title: mt(s, 'mNoteNew'), text: car + ' — ' + r.service })
    }
    if ((r.status === 'pending' || r.status === 'progress') && r.appointment && r.appointment.date === now) {
      notes.push({ key: 'today-' + r.id + '-' + now, repairId: r.id, date: now, icon: 'bi-calendar-check', tone: 'm-icon-blue',
        title: mt(s, 'mNoteToday', { time: r.appointment.time || '' }), text: car })
    }
    if (r.status === 'progress' && r.due && r.due < now) {
      notes.push({ key: 'late-' + r.id + '-' + r.due, repairId: r.id, date: r.due, icon: 'bi-exclamation-triangle-fill', tone: 'm-icon-red',
        title: mt(s, 'mNoteLate'), text: car + ' — was due ' + fmtDate(r.due) })
    }
  }
  return notes.sort((a, b) => b.date.localeCompare(a.date))
}