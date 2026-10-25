import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { nu, today, daysAgo } from '../../data/store.js'
import { findItem } from '../../data/catalog.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import useApi from '../../useApi.js'
import { api } from '../../api.js'

// "Buy Now" on the shop pages → reserve the part (POST /api/shop/reservations), pay when you collect it
export default function Reserve() {
  usePageTitle('Order Part')
  const [params] = useSearchParams()
  const item = findItem(params.get('item'))
  const { toast } = useDialogs()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [pickup, setPickup] = useState(daysAgo(-1))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Live stock from the backend (GET /api/shop/parts)
  const parts = useApi('/shop/parts')
  const stockRow = (parts.data || []).find((p) => p.sku === (item && item.slug))
  const stock = stockRow ? stockRow.stock : 0

  if (!item) return <Navigate to="/shop" replace />

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const data = await api('/shop/reservations', {
        method: 'POST',
        body: { partId: item.slug, qty: Number(qty), pickup },
      })
      toast(`Order #${data.id} placed — collect it on the pickup date`)
      navigate('/my-repairs')
    } catch (err) {
      setSaving(false)
      setError(err.message)    // e.g. "Only 3 left in stock." from the backend
      parts.reload()
    }
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
              <p className="fs-5 fw-bold mb-1" style={{ color: 'var(--brand-green)' }}>{nu(item.price)}</p>
              <p className="small mb-3">
                {parts.loading
                  ? <span className="text-muted">Checking stock…</span>
                  : stock > 0
                    ? <span className="text-success"><i className="bi bi-check-circle me-1"></i>{stock} in stock</span>
                    : <span className="text-danger"><i className="bi bi-x-circle me-1"></i>Out of stock</span>}
              </p>
              <form onSubmit={submit}>
                <div className="row g-3 mb-3">
                  <div className="col-5">
                    <label className="form-label small fw-bold">Quantity</label>
                    <input type="number" min={1} max={stock || 1} className="form-control" value={qty} onChange={(e) => setQty(e.target.value)} required />
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
                {error && <div className="alert alert-danger py-2 small">{error}</div>}
                <button className="btn btn-brand-primary w-100" disabled={saving || stock === 0}>
                  {saving ? <><span className="spinner-border spinner-border-sm"></span> Placing order…</> : <>Place Order <i className="bi bi-arrow-right"></i></>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}