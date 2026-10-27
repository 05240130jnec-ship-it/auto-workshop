import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.js'
import { useAdmin } from './AdminContext.js'
import Avatar from './Avatar.jsx'

// Title row + search + notifications bell + user chip (top of every admin page)
export default function ATopbar({ title, sub, search, onSearch, onEnter, placeholder, children }) {
  const { user } = useAuth()
  const { Q } = useAdmin()
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  const input = useRef(null)

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
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
        <div className="a-user-chip"><span>{user.name}</span><Avatar name={user.name} /></div>
      </div>
    </header>
  )
}
