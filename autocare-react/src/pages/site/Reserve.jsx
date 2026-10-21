import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.js'
import { useStore, nu, today, daysAgo } from '../../data/store.js'
import { findItem } from '../../data/catalog.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'

// "Buy Now" on the shop pages → order the part and pay when you collect it
export default function Reserve() {
  usePageTitle('Order Part')
  const [params] = useSearchParams()
  const item = findItem(params.get('item'))
  const { user } = useAuth()
  const store = useStore()
  const { toast } = useDialogs()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [pickup, setPickup] = useState(daysAgo(-1))
  if (!item) return <Navigate to="/shop" replace />

  function submit(e) {
    e.preventDefault()
    const id = store.nextId('reservations', 'ORD-', 4)
    store.add('reservations', { id, customerId: user.id, slug: item.slug, name: item.name, price: item.price, qty: Number(qty), pickup, status: 'ready', date: today() })
    toast(`Order #${id} placed — collect it on the pickup date`)
    navigate('/my-repairs')
  }

  return (
    <section className="acp-section">
      <div className="container" style={{ maxWidth: 820 }}>
        <Link to="/shop" className="small text-muted d-inline-block mb-3"><i className="bi bi-arrow-left"></i> Back to shop</Link>
        <div className="acp-card p-4">
          <div className="row g-4 align-items-center">
            <div className="col-md-5">
              <img src={item.image} className="img-fluid rounded-3" alt={item.name} />
            </div>
            <div className="col-md-7">
              <small className="acp-eyebrow">{item.category}</small>
              <h1 className="h3 fw-bold mt-2">{item.name}</h1>
              <p className="fs-5 fw-bold" style={{ color: 'var(--brand-green)' }}>{nu(item.price)}</p>
              <form onSubmit={submit}>
                <div className="row g-3 mb-3">
                  <div className="col-5">
                    <label className="form-label small fw-bold">Quantity</label>
                    <input type="number" min={1} max={20} className="form-control" value={qty} onChange={(e) => setQty(e.target.value)} required />
                  </div>
                  <div className="col-7">
                    <label className="form-label small fw-bold">Pickup date</label>
                    <input type="date" min={today()} className="form-control" value={pickup} onChange={(e) => setPickup(e.target.value)} required />
                  </div>
                </div>
                <div className="d-flex justify-content-between fw-bold border-top pt-2 mb-3">
                  <span>Total</span><span>{nu(item.price * (Number(qty) || 0))}</span>
                </div>
                <p className="small text-muted"><i className="bi bi-shop me-1"></i>Pay at the workshop when you collect your order.</p>
                <button className="btn btn-brand-primary w-100">Place Order <i className="bi bi-arrow-right"></i></button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
