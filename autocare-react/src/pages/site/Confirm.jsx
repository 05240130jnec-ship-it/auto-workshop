import { Link, Navigate, useParams } from 'react-router-dom'
import { nu, fmtDate } from '../../data/store.js'
import usePageTitle from '../../ui/usePageTitle.js'
import useApi from '../../useApi.js'
import Loading from '../../ui/Loading.jsx'

// Shown after booking — loads the new booking from GET /api/repairs/:id
export default function Confirm() {
  usePageTitle('Booking Confirmed')
  const { id } = useParams()
  const { data: r, loading, error } = useApi('/repairs/' + id)

  if (loading) return <section className="acp-section"><div className="container"><Loading /></div></section>
  if (error) return <Navigate to="/my-repairs" replace />   // not found, or not this customer's booking

  return (
    <section className="acp-section">
      <div className="container">
        <div className="acp-steps">
          <div className="acp-step done"><span className="dot"><i className="bi bi-check"></i></span> Service</div>
          <div className="acp-step-connector"></div>
          <div className="acp-step done"><span className="dot"><i className="bi bi-check"></i></span> Details</div>
          <div className="acp-step-connector"></div>
          <div className="acp-step active"><span className="dot"><i className="bi bi-check"></i></span> Confirm</div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="acp-card p-5 text-center">
              <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                style={{ width: 70, height: 70, background: 'var(--brand-yellow-dark)', color: '#fff', fontSize: '2rem' }}>
                <i className="bi bi-check-lg"></i>
              </div>
              <h2 className="h4 fw-bold">Booking Confirmed!</h2>
              <p className="text-muted">Your repair request has been submitted. The workshop will assign a mechanic and you can follow every step in My Repairs.</p>

              <div className="bg-brand-pink rounded-3 p-3 my-4 text-start">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="small text-muted text-uppercase">Booking ID</div>
                    <strong>#{r.id}</strong>
                  </div>
                  <div className="col-6">
                    <div className="small text-muted text-uppercase">Assigned Specialist</div>
                    <strong>{r.mechanicName || 'Being assigned'}</strong>
                    <div className="small text-muted">{r.mechanicName ? '' : 'Usually within a few hours'}</div>
                  </div>
                  <div className="col-6">
                    <div className="small text-muted text-uppercase">Appointment</div>
                    <strong>{fmtDate(r.apptDate || r.due)}</strong>
                    <div className="small text-muted">{r.apptTime} · {r.delivery === 'pickup' ? 'Home pickup' : 'Drop-off'}</div>
                  </div>
                  <div className="col-6">
                    <div className="small text-muted text-uppercase">Vehicle · Estimate</div>
                    <strong>{r.vehicle}</strong>
                    <div className="small text-muted">{r.plate} · {nu(r.cost)}</div>
                  </div>
                </div>
              </div>

              <h4 className="h6 fw-bold text-start mb-3">What happens next?</h4>
              <ul className="list-unstyled text-start small mb-4">
                <li className="mb-2"><i className="bi bi-dot text-brand-purple fs-4 lh-1"></i>A mechanic will review your vehicle details and problem description.</li>
                <li className="mb-2"><i className="bi bi-dot text-brand-purple fs-4 lh-1"></i>You'll see the status change to “Being repaired” once work starts.</li>
                <li className="mb-2"><i className="bi bi-dot text-brand-purple fs-4 lh-1"></i>When it's done, the final amount appears here and your car is ready for pickup.</li>
              </ul>

              <Link to="/my-repairs" className="btn btn-brand-primary w-100">
                View my repairs <i className="bi bi-arrow-right"></i>
              </Link>
              <Link to="/contact" className="d-block mt-3 small text-brand-purple fw-bold">
                Need to change something? Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}