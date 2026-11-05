import { useState } from 'react'
import { Link } from 'react-router-dom'
import { nu, relDate, fmtDate } from '../data/store.js'
import { useDialogs } from '../ui/DialogContext.js'

// The customer's notification bell.
// Messages are made from the customer's repairs and part reservations (from MySQL).
// Red number = messages not opened yet. Opening the bell marks them as seen
// (remembered in this browser, per customer).
// Clicking a message opens its details in a pop-up, so you stay on the same page.

function buildMessages(repairs, reservations) {
  const list = []
  repairs.forEach((r) => {
    if (r.status === 'pending') {
      list.push({ repair: r, key: r.id + ':pending', icon: 'bi-calendar-check-fill', tone: 'text-warning',
        text: <>Booking <b>#{r.id}</b> received, we'll assign a mechanic soon</>, when: r.date })
    } else if (r.status === 'progress') {
      list.push({ repair: r, key: r.id + ':progress', icon: 'bi-wrench-adjustable-circle-fill', tone: 'text-primary',
        text: <><b>{r.mechanicName || 'A mechanic'}</b> is working on your {r.vehicle}</>, when: r.date })
    } else if (r.status === 'complete') {
      list.push({ repair: r, key: r.id + ':complete', icon: 'bi-check-circle-fill', tone: 'text-success',
        text: <>Your <b>{r.vehicle}</b> is ready for pickup · {nu(r.cost)}</>, when: r.due || r.date })
    } else if (r.status === 'cancelled') {
      list.push({ repair: r, key: r.id + ':cancelled', icon: 'bi-x-circle-fill', tone: 'text-muted',
        text: <>Booking <b>#{r.id}</b> was cancelled</>, when: r.date })
    }
  })
  reservations.forEach((o) => {
    if (o.status === 'ready') {
      list.push({ order: o, key: o.id + ':ready', icon: 'bi-bag-check-fill', tone: 'text-success',
        text: <>Part <b>{o.name}</b> is ready to collect</>, when: o.date })
    }
  })
  // newest first, and only the latest 10
  return list.sort((a, b) => String(b.when).localeCompare(String(a.when))).slice(0, 10)
}

function readSeen(userId) {
  try { return JSON.parse(localStorage.getItem('acp_seen_' + userId)) || [] } catch { return [] }
}
function saveSeen(userId, keys) {
  try { localStorage.setItem('acp_seen_' + userId, JSON.stringify(keys)) } catch { /* storage blocked */ }
}

const STATUS = { pending: 'Booked, waiting for a mechanic', progress: 'Being repaired', complete: 'Ready for pickup', cancelled: 'Cancelled' }

export default function NotificationBell({ user, repairs, reservations }) {
  const [seen, setSeen] = useState(() => readSeen(user.id))
  const { view } = useDialogs()
  const messages = buildMessages(repairs || [], reservations || [])
  const unseen = messages.filter((m) => !seen.includes(m.key)).length

  function markSeen() {
    const keys = messages.map((m) => m.key)
    setSeen(keys)
    saveSeen(user.id, keys)
  }

  // Show one message's details in a pop-up (no page change)
  function open(m) {
    if (m.order) {
      const o = m.order
      return view('Part reservation #' + o.id, (
        <div className="a-detail-grid">
          <div><span>Item</span><strong>{o.name}</strong></div>
          <div><span>Quantity</span><strong>{o.qty}</strong></div>
          <div><span>Total</span><strong>{nu(o.qty * o.price)}</strong></div>
          <div><span>Pick up on</span><strong>{fmtDate(o.pickup)}</strong></div>
          <div><span>Status</span><strong>Ready to collect · pay at the workshop</strong></div>
        </div>
      ))
    }
    const r = m.repair
    view('Booking #' + r.id, (
      <div className="a-detail-grid">
        <div><span>Vehicle</span><strong>{r.vehicle}</strong><br /><small className="text-muted">{r.plate}</small></div>
        <div><span>Service</span><strong>{r.service}</strong></div>
        <div><span>Status</span><strong>{STATUS[r.status]}</strong></div>
        <div><span>Mechanic</span><strong>{r.mechanicName || 'Not assigned yet'}</strong></div>
        <div><span>Appointment</span><strong>{r.apptDate ? `${fmtDate(r.apptDate)}, ${r.apptTime}` : '—'}</strong></div>
        <div><span>{r.status === 'complete' ? 'Amount' : 'Estimate'}</span><strong>{nu(r.cost)}</strong></div>
      </div>
    ))
  }

  return (
    <div className="dropdown">
      <button type="button" className="acp-icon-btn position-relative border-0" data-bs-toggle="dropdown"
        aria-expanded="false" aria-label="Notifications" onClick={markSeen}>
        <i className="bi bi-bell"></i>
        {unseen > 0 && <span className="acp-notif-count">{unseen}</span>}
      </button>
      <div className="dropdown-menu dropdown-menu-end p-0 shadow" style={{ width: 320, maxWidth: '90vw' }}>
        <div className="px-3 py-2 border-bottom fw-bold">Notifications</div>
        {messages.length === 0 && <div className="px-3 py-4 text-center text-muted small">No notifications yet</div>}
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {messages.map((m) => (
            <button type="button" key={m.key} onClick={() => open(m)} className="dropdown-item d-flex gap-2 py-2 text-wrap text-start">
              <i className={'bi ' + m.icon + ' ' + m.tone + ' mt-1'}></i>
              <span className="small">{m.text}<br /><span className="text-muted">{relDate(String(m.when || '').slice(0, 10))}</span></span>
            </button>
          ))}
        </div>
        <Link to="/my-repairs" className="d-block text-center small py-2 border-top fw-bold text-brand-purple">View my repairs</Link>
      </div>
    </div>
  )
}