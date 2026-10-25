import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { HOME_FOR } from '../auth/users.js'
import { initials } from '../data/store.js'
import useTheme from '../ui/useTheme.js'
import useApi from '../useApi.js'

// Customer website layout: navbar + footer around every page
export default function SiteLayout() {
  useTheme('site')
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname

  // Bell number = my open repairs (only for logged-in customers)
  const isCustomer = user && user.role === 'customer'
  const repairs = useApi(isCustomer ? '/repairs' : null)
  const myOpen = isCustomer
    ? (repairs.data || []).filter((r) => r.status === 'pending' || r.status === 'progress').length
    : 0

  // Close the mobile menu, go to the top and refresh the bell when the page changes
  useEffect(() => {
    document.getElementById('mainNav')?.classList.remove('show')
    window.scrollTo(0, 0)
    if (isCustomer) repairs.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  const navClass = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '')

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg acp-navbar">
        <div className="container-fluid">
          <Link className="navbar-brand acp-brand" to="/">
            <img src="/media/logo.jpg" alt="logo" /><span>AutoCarePro</span>
          </Link>
          <button className="navbar-toggler border-0" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-label="Menu">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav ms-lg-4 align-items-lg-center mb-2 mb-lg-0">
              <li className="nav-item"><NavLink className={navClass} to="/" end>Home</NavLink></li>
              <li className="nav-item"><NavLink className={navClass} to="/about">About</NavLink></li>
              <li className="nav-item dropdown">
                <a className={'nav-link dropdown-toggle' + (path.startsWith('/services') || path === '/booking' ? ' active' : '')} href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Services</a>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item fw-semibold" to="/services">All Services</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" to="/services/engine">Engine Diagnostics</Link></li>
                  <li><Link className="dropdown-item" to="/services/brake">Brake Repair</Link></li>
                  <li><Link className="dropdown-item" to="/services/oil">Oil Change</Link></li>
                  <li><Link className="dropdown-item" to="/services/car-wash">Car Wash</Link></li>
                </ul>
              </li>
              <li className="nav-item dropdown">
                <a className={'nav-link dropdown-toggle' + (path.startsWith('/shop') ? ' active' : '')} href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Inventory</a>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" to="/shop">Auto Parts</Link></li>
                  <li><Link className="dropdown-item" to="/shop/accessories">Car Accessories</Link></li>
                  <li><Link className="dropdown-item" to="/shop/cleaning">Cleaning Products</Link></li>
                  <li><Link className="dropdown-item" to="/shop/safety">Emergency &amp; Safety</Link></li>
                </ul>
              </li>
              <li className="nav-item"><NavLink className={navClass} to="/contact">Contact</NavLink></li>
              {isCustomer && (
                <li className="nav-item"><NavLink className={navClass} to="/my-repairs">My Repairs</NavLink></li>
              )}
            </ul>

            <div className="d-flex align-items-center gap-3 ms-lg-auto mt-3 mt-lg-0">
              <Link to={isCustomer ? '/my-repairs' : '/login'} className="acp-icon-btn position-relative" aria-label="Notifications">
                <i className="bi bi-bell"></i>
                {myOpen > 0 && <span className="acp-notif-count">{myOpen}</span>}
              </Link>
              {user ? (
                <div className="dropdown">
                  <a href="#" className="acp-user-chip acp-user-chip--in" data-bs-toggle="dropdown" aria-expanded="false" title={user.name}>
                    <span className="acp-initials">{initials(user.name)}</span>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><span className="dropdown-item-text small text-muted">Signed in as<br /><strong className="text-dark">{user.name}</strong></span></li>
                    <li><hr className="dropdown-divider" /></li>
                    {isCustomer ? (
                      <>
                        <li><Link className="dropdown-item" to="/my-repairs"><i className="bi bi-wrench-adjustable me-2"></i>My repairs</Link></li>
                        <li><Link className="dropdown-item" to="/booking"><i className="bi bi-calendar-plus me-2"></i>Book a service</Link></li>
                      </>
                    ) : (
                      <li><Link className="dropdown-item" to={HOME_FOR[user.role]}><i className="bi bi-speedometer2 me-2"></i>Open my panel</Link></li>
                    )}
                    <li><button className="dropdown-item text-danger" onClick={() => { logout(); navigate('/') }}><i className="bi bi-box-arrow-right me-2"></i>Log out</button></li>
                  </ul>
                </div>
              ) : (
                <Link to="/login" className="acp-user-chip" title="Log in" aria-label="Log in"><i className="bi bi-person-circle"></i></Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <Outlet />

      {/* FOOTER */}
      <footer className="acp-footer">
        © 2026 AutoCarePro. All rights reserved.
      </footer>
    </>
  )
}