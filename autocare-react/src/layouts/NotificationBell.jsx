import { useState } from 'react'
import { Link } from 'react-router-dom'
import { nu, relDate, fmtDate } from '../data/store.js'
import { api } from '../api.js'
import { useDialogs } from '../ui/DialogContext.js'

// The customer's bell. Messages are made from their repairs and part orders (from MySQL):
//   booked → mechanic working → ready for pickup / cancelled, and part orders ready to collect.
// The red number = messages not opened yet. Opening the bell marks them as seen
// (remembered in this browser only, per customer).
// Clicking a message opens its details in a pop-up — you stay on the same page.
const RECENT_DAYS = 14

function daysSince(iso) {
  if (!iso) return 999
  return Math.round((Date.now() - new Date(String(iso).slice(0, 10) + 'T00:00:00')) / 86400000)
}

function buildMessages(repairs, orders) {
  const list = []
  repairs.forEach((r) => {
    if (r.status === 'pending') {
      list.push({ repairId: r.id, key: r.id + ':pending:' + (r.mechanic_id || ''), icon: 'bi-calendar-check', tone: 'text-warning',
        text: <>Booking <b>#{r.id}</b> received — we'll assign a mechanic soon</>, when: r.booked_on })
    } else if (r.status === 'progress') {
      list.push({ repairId: r.id, key: r.id + ':progress:' + r.mechanic_id, icon: 'bi-wrench-adjustable', tone: 'text-primary',
        text: <><b>{r.mechanic_name || 'A mechanic'}</b> is working on your {r.vehicle}</>, when: r.started_on || r.booked_on })
    } else if (r.status === 'complete' && daysSince(r.completed_on) <= RECENT_DAYS) {
      list.push({ repairId: r.id, key: r.id + ':complete', icon: 'bi-check-circle-fill', tone: 'text-success',
        text: <>Your <b>{r.vehicle}</b> is ready for pickup · {nu(r.cost)}</>, when: r.completed_on })
    } else if (r.status === 'cancelled' && daysSince(r.booked_on) <= RECENT_DAYS) {
      list.push({ repairId: r.id, key: r.id + ':cancelled', icon: 'bi-x-circle', tone: 'text-muted',
        text: <>Booking <b>#{r.id}</b> was cancelled</>, when: r.booked_on })
    }
  })
  orders.forEach((o) => {
    if (o.status === 'ready') {
      list.push({ order: o, key: o.id + ':ready', icon: 'bi-bag-check', tone: 'text-success',
        text: <>Part order <b>#{o.id}</b> ({o.name}) is ready to collect</>, when: o.created_on })
    }
  })
  return list.sort((a, b) => String(b.when).localeCompare(String(a.when)))
}

function readSeen(userId) {
  try { return JSON.parse(localStorage.getItem('acp_seen_' + userId)) || [] } catch { return [] }
}
function saveSeen(userId, keys) {
  try { localStorage.setItem('acp_seen_' + userId, JSON.stringify(keys)) } catch { /* storage blocked */ }
}

export default function NotificationBell({ user, repairs, orders }) {
  const [seen, setSeen] = useState(() => readSeen(user.id))
  const { view, toast } = useDialogs()
  const messages = buildMessages(repairs || [], orders || [])
  const unseen = messages.filter((m) => !seen.includes(m.key)).length

  function markSeen() {
    const keys = messages.map((m) => m.key)
    setSeen(keys)
    saveSeen(user.id, keys)
  }

  // Show one message's details in a pop-up (no page change)
  async function open(m) {
    if (m.order) {
      const o = m.order
      return view('Part order #' + o.id, (
        <div className="a-detail-grid">
          <div><span>Item</span><strong>{o.name}</strong></div>
          <div><span>Quantity</span><strong>{o.qty}</strong></div>
          <div><span>Total</span><strong>{nu(o.qty * o.price)}</strong></div>
          <div><span>Pick up on</span><strong>{fmtDate(o.pickup)}</strong></div>
          <div><span>Status</span><strong>Ready to collect · pay at the workshop</strong></div>
        </div>
      ))
    }
    let r
    try { r = await api('/repairs/' + m.repairId) } catch (err) { return toast(err.message, 'error') }
    const STATUS = { pending: 'Booked — waiting for a mechanic', progress: 'Being repaired', complete: 'Ready for pickup', cancelled: 'Cancelled' }
    view('Booking #' + r.id, (
      <div className="a-detail-grid">
        <div><span>Vehicle</span><strong>{r.vehicle}</strong><br /><small className="text-muted">{r.plate}</small></div>
        <div><span>Service</span><strong>{r.service}</strong></div>
        <div><span>Status</span><strong>{STATUS[r.status]}</strong></div>
        <div><span>Mechanic</span><strong>{r.mechanic_name || 'Not assigned yet'}</strong></div>
        <div><span>{r.appt_date ? 'Appointment' : 'Promised by'}</span><strong>{r.appt_date ? `${fmtDate(r.appt_date)}, ${r.appt_time}` : fmtDate(r.due)}</strong></div>
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
