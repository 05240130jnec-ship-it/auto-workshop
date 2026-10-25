import { Link } from 'react-router-dom'
import { nu, fmtDate, relDate } from '../../data/store.js'
import { imageFor } from '../../data/services.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import useApi from '../../useApi.js'
import { api } from '../../api.js'
import Loading from '../../ui/Loading.jsx'

const BADGE = {
  pending: ['review', 'IN REVIEW'],
  progress: ['scheduled', 'BEING REPAIRED'],
  complete: ['completed', 'Completed'],
  cancelled: ['review', 'Cancelled'],
}
const RES_BADGE = {
  ready: ['scheduled', 'Ready for pickup'],
  collected: ['completed', 'Collected'],
  cancelled: ['review', 'Cancelled'],
}
const DOT = ['text-danger', 'text-warning', 'text-primary', 'text-success', 'text-info']

// The backend stores the appointment as apptDate + apptTime
const appt = (r) => (r.apptDate ? `${fmtDate(r.apptDate)}, ${r.apptTime}` : null)

// My Repairs — data comes from the backend (GET /api/repairs and /api/shop/reservations)
export default function MyRepairs() {
  usePageTitle('My Repairs')
  const { confirm, toast, view } = useDialogs()

  const repairs = useApi('/repairs')
  const res = useApi('/shop/reservations')

  if (repairs.loading) return <section className="acp-section"><div className="container"><Loading /></div></section>
  if (repairs.error) return <section className="acp-section"><div className="container"><Loading error={repairs.error} onRetry={repairs.reload} /></div></section>

  const mine = repairs.data
  const active = mine.filter((r) => r.status === 'pending' || r.status === 'progress')
  const past = mine.filter((r) => r.status === 'complete' || r.status === 'cancelled')
  const reservations = res.data || []

  const specialist = (r, i) => (
    r.mechanicName
      ? <><i className={'bi bi-circle-fill ' + DOT[i % DOT.length]} style={{ fontSize: '.5rem' }}></i> {r.mechanicName.split(' ')[0]}</>
      : <span className="text-muted">Not assigned yet</span>
  )

  async function cancel(r) {
    const ok = await confirm(`Cancel booking #${r.id} for your ${r.vehicle}?`, { title: 'Cancel booking?', okText: 'Yes, cancel', danger: true })
    if (!ok) return
    try {
      await api('/repairs/' + r.id, { method: 'PATCH', body: { status: 'cancelled' } })
      toast('Booking #' + r.id + ' cancelled', 'info')
      repairs.reload()   // load the list again so the page shows the change
    } catch (err) {
      toast(err.message, 'danger')
    }
  }

  async function details(row) {
    let r
    try {
      r = await api('/repairs/' + row.id)   // full repair with parts and services
    } catch (err) {
      return toast(err.message, 'danger')
    }
    const step = ['pending', 'progress', 'complete'].indexOf(r.status)
    view('Booking #' + r.id, (
      <div>
        {r.status === 'cancelled'
          ? <div className="a-note mb-3">This booking was cancelled.</div>
          : (
            <div className="a-steps">
              {['Booked', 'Being repaired', 'Ready for pickup'].map((s, i) => <div key={s} className={i <= step ? 'done' : ''}>{s}</div>)}
            </div>
          )}
        <div className="a-detail-grid">
          <div><span>Vehicle</span><strong>{r.vehicle}</strong><br /><small className="text-muted">{r.plate}</small></div>
          <div><span>Service</span><strong>{r.service}</strong></div>
          <div><span>Mechanic</span><strong>{r.mechanicName || 'Not assigned yet'}</strong></div>
          <div><span>Booked</span><strong>{fmtDate(r.date)}</strong></div>
          <div><span>{appt(r) ? 'Appointment' : 'Promised by'}</span><strong>{appt(r) || fmtDate(r.due)}</strong></div>
          <div><span>{r.status === 'complete' ? 'Amount' : 'Estimate'}</span><strong>{nu(r.cost)}</strong></div>
        </div>
        {r.notes && <><div className="a-section-title">Your description</div><div className="a-note mb-3">{r.notes}</div></>}
        {r.parts.length > 0 && (
          <>
            <div className="a-section-title">Parts used</div>
            <table className="a-mini-table"><tbody>
              {r.parts.map((p) => <tr key={p.id}><td>{p.name} × {p.qty}</td><td className="text-end">{nu(p.qty * p.price)}</td></tr>)}
            </tbody></table>
          </>
        )}
        {r.services.length > 0 && (
          <>
            <div className="a-section-title">Work done</div>
            <table className="a-mini-table"><tbody>
              {r.services.map((s) => <tr key={s.id}><td>{s.name} × {s.qty}</td><td className="text-end">{nu(s.qty * s.cost)}</td></tr>)}
            </tbody></table>
          </>
        )}
      </div>
    ))
  }

  return (
    <section className="acp-section">
      <div className="container">

        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">My Repairs</h2>
            <p className="text-muted mb-0">Track your ongoing maintenance and review your vehicle's service history in one place.</p>
          </div>
          <div className="d-flex gap-3">
            <div className="acp-card px-3 py-2 text-center">
              <div className="fs-4 fw-bold text-brand-purple">{String(active.length).padStart(2, '0')}</div>
              <div className="small text-muted text-uppercase">Active Requests</div>
            </div>
            <div className="acp-card px-3 py-2 text-center">
              <div className="fs-4 fw-bold text-brand-purple">{String(mine.length).padStart(2, '0')}</div>
              <div className="small text-muted text-uppercase">Total Records</div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="h5 fw-bold mb-0"><i className="bi bi-wrench-adjustable"></i> Active Repairs</h3>
          <Link to="/booking" className="btn btn-brand-primary btn-sm"><i className="bi bi-plus-lg"></i> Book a service</Link>
        </div>

        {active.length === 0 && (
          <div className="acp-card p-4 mb-4 text-center text-muted">
            No active repairs. <Link to="/services" className="text-brand-purple fw-bold">Book a service</Link> whenever you need us.
          </div>
        )}

        {active.map((r, i) => {
          const [cls, label] = BADGE[r.status]
          return (
            <div className="acp-card p-3 mb-3" key={r.id}>
              <div className="row g-3 align-items-center">
                <div className="col-md-2 col-4">
                  <img src={imageFor(r.service)} className="img-fluid rounded-3" alt="" />
                </div>
                <div className="col-md-3 col-8">
                  <span className={'acp-badge ' + cls}>{label}</span>
                  <h4 className="h6 fw-bold mt-1 mb-0">{r.vehicle}</h4>
                  <p className="small text-muted mb-0">{r.service} · #{r.id}</p>
                </div>
                <div className="col-md-2 col-6">
                  <p className="small text-muted mb-0">Assigned Specialist</p>
                  <p className="fw-bold mb-0">{specialist(r, i)}</p>
                </div>
                <div className="col-md-3 col-6">
                  <p className="small text-muted mb-0">{r.status === 'pending' ? 'Appointment' : 'Estimated Completion'}</p>
                  <p className={'fw-bold mb-0' + (r.status === 'pending' && !r.mechanicId ? ' text-brand-red' : '')}>
                    {appt(r) || relDate(r.due)}
                  </p>
                </div>
                <div className="col-md-2 text-md-end d-flex flex-md-column gap-2 align-items-md-end">
                  <button className="btn btn-brand-yellow btn-sm" onClick={() => details(r)}>View Details</button>
                  {r.status === 'pending' && <button className="btn btn-link btn-sm text-muted p-0" onClick={() => cancel(r)}>Cancel</button>}
                </div>
              </div>
            </div>
          )
        })}

        <h3 className="h5 fw-bold mb-3 mt-4"><i className="bi bi-clock-history"></i> Past Repairs</h3>
        <div className="acp-card p-0 overflow-hidden mb-4">
          <div className="table-responsive">
            <table className="table acp-table mb-0">
              <thead>
                <tr><th>Vehicle &amp; ID</th><th>Specialist</th><th>Date</th><th>Amount</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {past.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">No past repairs yet.</td></tr>}
                {past.map((r, i) => (
                  <tr key={r.id}>
                    <td>{r.vehicle}<br /><small className="text-muted">#{r.id} · {r.service}</small></td>
                    <td>{specialist(r, i + 2)}</td>
                    <td>{fmtDate(r.due || r.date)}</td>
                    <td>{r.status === 'complete' ? nu(r.cost) : '—'}</td>
                    <td><span className={'acp-badge ' + BADGE[r.status][0]}>{BADGE[r.status][1]}</span></td>
                    <td><button className="btn btn-link p-0 text-brand-red fw-bold" onClick={() => details(r)}>Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {reservations.length > 0 && (
          <>
            <h3 className="h5 fw-bold mb-3"><i className="bi bi-bag"></i> My Part Orders</h3>
            <div className="acp-card p-0 overflow-hidden">
              <div className="table-responsive">
                <table className="table acp-table mb-0">
                  <thead><tr><th>Item</th><th>Qty</th><th>Total</th><th>Pickup</th><th>Status</th></tr></thead>
                  <tbody>
                    {reservations.map((x) => (
                      <tr key={x.id}>
                        <td>{x.name}<br /><small className="text-muted">#{x.id}</small></td>
                        <td>{x.qty}</td>
                        <td>{nu(x.qty * x.price)}</td>
                        <td>{fmtDate(x.pickup)}</td>
                        <td><span className={'acp-badge ' + RES_BADGE[x.status][0]}>{RES_BADGE[x.status][1]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}