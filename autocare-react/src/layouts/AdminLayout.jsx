import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { useStore } from '../data/store.js'
import useTheme from '../ui/useTheme.js'
import Avatar from '../pages/admin/Avatar.jsx'
import Loading from '../ui/Loading.jsx'

// Admin panel layout — same sidebar as your admin interface, with live counts.
// All data comes from the backend (MySQL) through ApiStoreProvider.
export default function AdminLayout() {
  useTheme('admin')
  const { user, logout } = useAuth()
  const store = useStore()
  const { Q, data } = store
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const pendingRepairs = data.repairs.filter((r) => r.status === 'pending').length
  const pendingPO = Q.pendingOrders().length
  const low = Q.lowStock().length
  const custOrders = (data.reservations || []).filter((x) => x.status === 'ready').length
  const shop = (data.listings || []).filter((l) => l.status === 'review').length

  const link = (to, icon, label, count, tone, end) => (
    <li>
      <NavLink to={to} end={end} onClick={() => setOpen(false)}>
        <i className={'bi ' + icon}></i> {label}
        {count > 0 && <span className={'a-nav-count ' + (tone || '')}>{count}</span>}
      </NavLink>
    </li>
  )

  return (
    <div className="a-shell">
      <aside className={'a-sidebar' + (open ? ' open' : '')}>
        <div className="a-brand">
          <div className="a-brand-logo"><img src="/media/logo.jpg" alt="AutoCare Pro logo" /></div>
          <div className="a-brand-text"><strong>AutoCare Pro</strong><small>Admin panel</small></div>
        </div>
        <div className="a-nav-group">
          <span className="a-nav-label">Main</span>
          <ul className="a-nav">
            {link('/admin', 'bi-grid-1x2-fill', 'Dashboard', 0, '', true)}
            {link('/admin/repairs', 'bi-wrench-adjustable', 'Repairs', pendingRepairs)}
            {link('/admin/orders', 'bi-bag-check', 'Purchase Orders', pendingPO)}
            {link('/admin/customer-orders', 'bi-bag', 'Customer Orders', custOrders)}
            {link('/admin/shop', 'bi-shop', 'Shop & Listings', shop)}
          </ul>
        </div>
        <div className="a-nav-group">
          <span className="a-nav-label">Manage</span>
          <ul className="a-nav">
            {link('/admin/customers', 'bi-people-fill', 'Customers')}
            {link('/admin/mechanics', 'bi-person-badge', 'Mechanics')}
            {link('/admin/inventory', 'bi-box-seam', 'Inventory', low, 'red')}
            {link('/admin/suppliers', 'bi-truck', 'Suppliers')}
          </ul>
        </div>
        <div className="a-nav-group">
          <span className="a-nav-label">Other</span>
          <ul className="a-nav">
            <li><a href="/" target="_blank" rel="noreferrer"><i className="bi bi-globe2"></i> View website</a></li>
          </ul>
        </div>
        <div className="a-user-foot">
          <div className="a-user-info">
            <Avatar name={user.name} />
            <div className="a-user-text"><strong>{user.name}</strong><small>{user.email}</small></div>
          </div>
          <a href="/login" className="a-logout" onClick={(e) => { e.preventDefault(); logout(); navigate('/login') }}>
            <i className="bi bi-box-arrow-right"></i> Log out
          </a>
        </div>
      </aside>
      {open && <div className="a-backdrop show" onClick={() => setOpen(false)}></div>}

      <main className="a-main">
        <button className="a-sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Open menu"><i className="bi bi-list"></i></button>
        {store.ready ? <Outlet /> : <Loading error={store.error} onRetry={store.reload} />}
      </main>
    </div>
  )
}
