import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.js'
import { useAdmin } from './AdminContext.js'
import Avatar from './Avatar.jsx'
import { today, fmtDate } from '../../data/store.js'

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

  // ---------- 🔔 Notifications: things that need the admin, made from the MySQL data ----------
  const now = today()
  const alerts = [
    ...Q.unassigned().map((r) => ({ key: 'new-' + r.id, icon: 'bi-person-exclamation', tone: 'orange',
      text: <><strong>{r.id}</strong> needs a mechanic</>, sub: r.vehicle + ' · ' + r.service, to: '/admin/repairs?open=' + r.id })),
    ...data.repairs.filter((r) => r.status === 'progress' && r.due && r.due < now).map((r) => ({ key: 'late-' + r.id + '-' + r.due, icon: 'bi-alarm', tone: 'red',
      text: <><strong>{r.id}</strong> is overdue</>, sub: r.vehicle + ' · was due ' + fmtDate(r.due), to: '/admin/repairs?open=' + r.id })),
    ...Q.pendingOrders().map((o) => ({ key: 'po-' + o.id, icon: 'bi-bag', tone: 'blue',
      text: <><strong>{o.id}</strong> awaiting approval</>, sub: o.qty + ' × ' + ((Q.part(o.partId) || {}).name || 'part'), to: '/admin/orders' })),
    ...Q.lowStock().map((p) => ({ key: 'stock-' + p.id + '-' + p.stock, icon: 'bi-exclamation-triangle', tone: 'red',
      text: <><strong>{p.name}</strong> {p.stock ? 'is running low' : 'is out of stock'}</>, sub: p.stock + ' left · reorder at ' + p.reorder, to: '/admin/inventory' })),
    ...(data.listings || []).filter((l) => l.status === 'review').map((l) => ({ key: 'sell-' + l.id, icon: 'bi-tag', tone: 'purple',
      text: <>Sell request: <strong>{l.name}</strong></>, sub: 'Waiting for your review', to: '/admin/shop' })),
    ...(data.reservations || []).filter((x) => x.status === 'ready').map((x) => ({ key: 'res-' + x.id, icon: 'bi-box-seam', tone: 'green',
      text: <>Part order <strong>#{x.id}</strong></>, sub: 'Waiting to be collected', to: '/admin/shop' })),
  ]

  // Which ones I have already seen (kept in this browser)
  const seenKey = 'acp_admin_seen_' + user.id
  const [seen, setSeen] = useState(() => {
    try { return JSON.parse(localStorage.getItem(seenKey)) || [] } catch { return [] }
  })
  const unread = alerts.filter((a) => !seen.includes(a.key)).length
  function remember(list) {
    setSeen(list)
    try { localStorage.setItem(seenKey, JSON.stringify(list)) } catch { /* storage blocked */ }
  }
  const markAllRead = () => remember(alerts.map((a) => a.key))
  const markRead = (key) => { if (!seen.includes(key)) remember([...seen, key]) }

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
        {/* 🔔 Notifications */}
        <div className="an-wrap" ref={box}>
          <button className="a-icon-btn" onClick={() => setOpen(!open)} aria-label="Notifications" aria-expanded={open}>
            <i className="bi bi-bell"></i>
            {unread > 0 && <span className="a-notif-dot">{Math.min(unread, 9)}{unread > 9 ? '+' : ''}</span>}
          </button>
          {open && (
            <div className="an-menu">
              <div className="an-head">
                <strong>Notifications {alerts.length > 0 && <span>{alerts.length}</span>}</strong>
                {unread > 0 && <button type="button" onClick={markAllRead}>Mark all as read</button>}
              </div>
              {alerts.length === 0 && <p className="an-empty"><i className="bi bi-bell-slash"></i> You're all caught up.</p>}
              <div className="an-list">
                {alerts.map((a) => (
                  <Link key={a.key} className={'an-item' + (seen.includes(a.key) ? '' : ' is-new')} to={a.to}
                    onClick={() => { markRead(a.key); setOpen(false) }}>
                    <div className={'a-item-icon a-icon-' + a.tone}><i className={'bi ' + a.icon}></i></div>
                    <div><div>{a.text}</div><small>{a.sub}</small></div>
                  </Link>
                ))}
              </div>
            </div>
          )}
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
