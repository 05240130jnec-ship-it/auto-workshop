import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.js'
import { useAdmin } from './AdminContext.js'
import Avatar from './Avatar.jsx'

// Title row + search + notifications bell + my avatar (drop-down: My profile, Log out)
export default function ATopbar({ title, sub, search, onSearch, onEnter, placeholder, children }) {
  const { user, logout } = useAuth()
  const { Q, data } = useAdmin()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [me, setMe] = useState(false)           // the avatar menu
  const box = useRef(null)
  const meBox = useRef(null)
  const profile = data.profile || {}
  const input = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
      if (meBox.current && !meBox.current.contains(e.target)) setMe(false)
    }
    const slash = (e) => {
      if (e.key === '/' && input.current && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { e.preventDefault(); input.current.focus() }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', slash)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', slash) }
  }, [])

  const alerts = [
    ...Q.unassigned().map((r) => ({ icon: 'bi-person-exclamation', tone: 'orange', text: <><strong>{r.id}</strong> needs a mechanic</>, sub: r.vehicle + ' · ' + r.service, to: '/admin/repairs?open=' + r.id })),
    ...Q.pendingOrders().map((o) => ({ icon: 'bi-bag', tone: 'blue', text: <><strong>{o.id}</strong> awaiting approval</>, sub: o.qty + ' × ' + ((Q.part(o.partId) || {}).name || 'part'), to: '/admin/orders' })),
    ...Q.lowStock().map((p) => ({ icon: 'bi-exclamation-triangle', tone: 'red', text: <><strong>{p.name}</strong> {p.stock ? 'is running low' : 'is out of stock'}</>, sub: p.stock + ' left · reorder at ' + p.reorder, to: '/admin/inventory' })),
  ]

  return (
    <header className="a-topbar">
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      <div className="a-topbar-actions">
        {onSearch && (
          <div className="a-search-wrap">
            <i className="bi bi-search"></i>
            <input ref={input} className="a-search" placeholder={placeholder || 'Search...'} value={search} onChange={(e) => onSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter(e.target.value) }} />
          </div>
        )}
        {children}
        <div className="dropdown" ref={box}>
          <button className="a-icon-btn" onClick={() => setOpen(!open)} aria-label="Notifications">
            <i className="bi bi-bell"></i>
            {alerts.length > 0 && <span className="a-notif-dot">{Math.min(alerts.length, 9)}</span>}
          </button>
          <div className={'dropdown-menu dropdown-menu-end a-notif-menu' + (open ? ' show' : '')} style={{ right: 0, left: 'auto', top: '110%' }}>
            <div className="a-notif-head">Notifications <span>{alerts.length}</span></div>
            {alerts.length === 0 && <div className="a-empty-sm">You're all caught up.</div>}
            {alerts.slice(0, 8).map((a, i) => (
              <Link key={i} className="a-notif-item" to={a.to} onClick={() => setOpen(false)}>
                <div className={'a-item-icon a-icon-' + a.tone}><i className={'bi ' + a.icon}></i></div>
                <div><div>{a.text}</div><small>{a.sub}</small></div>
              </Link>
            ))}
          </div>
        </div>
        {/* My avatar: profile + log out */}
        <div className="a-me" ref={meBox}>
          <button type="button" className="a-me-btn" onClick={() => setMe(!me)} aria-label="My account" aria-expanded={me} title={user.name}>
            <Avatar name={profile.name || user.name} photo={profile.photo} />
          </button>
          {me && (
            <div className="a-me-menu">
              <div className="a-me-top">
                <Avatar name={profile.name || user.name} photo={profile.photo} />
                <div><strong>{profile.name || user.name}</strong><small>{user.email}</small></div>
              </div>
              <Link to="/admin/profile" className="a-me-item" onClick={() => setMe(false)}><i className="bi bi-person"></i> My profile</Link>
              <button type="button" className="a-me-item a-me-danger" onClick={() => { logout(); navigate('/staff-login') }}>
                <i className="bi bi-box-arrow-right"></i> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
