import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useDialogs } from '../ui/DialogContext.js'
import useTheme from '../ui/useTheme.js'
import AdminDataProvider from '../pages/admin/AdminDataProvider.jsx'
import { useAdmin } from '../pages/admin/AdminContext.js'
import '../styles/admin-theme.css'

// Admin panel: loads all data from the backend first, then shows the sidebar + page.
// "My profile" and "Log out" are in the avatar menu at the top right (ATopbar.jsx).
export default function AdminLayout() {
  useTheme('admin')
  return (
    <AdminDataProvider>
      <AdminShell />
    </AdminDataProvider>
  )
}

// Sidebar with live counts
function AdminShell() {
  const { Q, data, reload } = useAdmin()
  const { toast } = useDialogs()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // Fetch fresh data each time the admin opens another page
  // (customers and mechanics may have changed things meanwhile)
  useEffect(() => { reload() }, [pathname, reload])

  const pendingRepairs = data.repairs.filter((r) => r.status === 'pending').length
  const pendingPO = Q.pendingOrders().length
  const low = Q.lowStock().length
  const shop = (data.listings || []).filter((l) => l.status === 'review').length + (data.reservations || []).filter((x) => x.status === 'ready').length

  const link = (to, icon, label, count, tone, end) => (
    <li>
      <NavLink to={to} end={end} onClick={() => setOpen(false)}>
        <i className={'bi ' + icon}></i> <span>{label}</span>
        {count > 0 && <span className={'a-nav-count ' + (tone || '')}>{count}</span>}
      </NavLink>
    </li>
  )

  async function refresh(e) {
    e.preventDefault()
    await reload()
    toast('Data refreshed', 'info')
  }

  return (
    <div className="a-shell">
      <aside className={'a-sidebar' + (open ? ' open' : '')}>
        <div className="a-brand">
          <div className="a-brand-logo"><img src="/media/logo.jpg" alt="AutoCare Pro logo" /></div>
          <div className="a-brand-text"><strong>AutoCare Pro</strong><small><span className="a-dot"></span> Admin panel</small></div>
        </div>
        <div className="a-nav-group">
          <span className="a-nav-label">Main</span>
          <ul className="a-nav">
            {link('/admin', 'bi-grid-1x2-fill', 'Dashboard', 0, '', true)}
            {link('/admin/repairs', 'bi-wrench-adjustable', 'Repairs', pendingRepairs)}
            {link('/admin/orders', 'bi-bag-check-fill', 'Purchase Orders', pendingPO)}
            {link('/admin/shop', 'bi-shop', 'Shop & Listings', shop)}
          </ul>
        </div>
        <div className="a-nav-group">
          <span className="a-nav-label">Manage</span>
          <ul className="a-nav">
            {link('/admin/customers', 'bi-people-fill', 'Customers')}
            {link('/admin/mechanics', 'bi-person-badge-fill', 'Mechanics')}
            {link('/admin/inventory', 'bi-box-seam-fill', 'Inventory', low, 'red')}
            {link('/admin/suppliers', 'bi-truck', 'Suppliers')}
          </ul>
        </div>
        <div className="a-nav-group">
          <span className="a-nav-label">Settings</span>
          <ul className="a-nav">
            {link('/admin/content', 'bi-megaphone-fill', 'Website Content')}
            {link('/admin/mechanic-portal', 'bi-person-gear', 'Mechanic Portal')}
          </ul>
        </div>
        <div className="a-nav-group a-nav-other">
          <ul className="a-nav">
            <li><a href="/" target="_blank" rel="noreferrer"><i className="bi bi-globe2"></i> <span>View website</span></a></li>
            <li><a href="#" onClick={refresh}><i className="bi bi-arrow-clockwise"></i> <span>Refresh data</span></a></li>
          </ul>
        </div>
      </aside>
      {open && <div className="a-backdrop show" onClick={() => setOpen(false)}></div>}

      <main className="a-main">
        <button className="a-sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Open menu"><i className="bi bi-list"></i></button>
        <Outlet />
      </main>
    </div>
  )
}
