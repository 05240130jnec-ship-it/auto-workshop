import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { nu, today, daysAgo, fmtDate } from '../../data/store.js'
import useSettings from '../../data/useSettings.js'
import { shopCategories, shopLink } from '../../data/content.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import useApi from '../../useApi.js'
import { api } from '../../api.js'
import Loading from '../../ui/Loading.jsx'

// "Buy Now" on the shop pages → order the part (POST /api/shop/reservations).
// The customer collects it at the workshop on the pickup date and pays there.
// Product, price, picture and stock come from MySQL (admin → Inventory).
export default function Reserve() {
  usePageTitle('Order Part')
  const [params] = useSearchParams()
  const sku = params.get('item')
  const { toast } = useDialogs()
  const navigate = useNavigate()
  const settings = useSettings()
  const [qty, setQty] = useState(1)
  const [pickup, setPickup] = useState(daysAgo(-1))   // tomorrow
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // The product — GET /api/content/products/seat-covers
  const parts = useApi(sku ? '/content/products/' + encodeURIComponent(sku) : null)
  const item = parts.data
  const stock = item ? Number(item.stock) || 0 : 0

  // Other products of the same shop page ("You may also like")
  const others = useApi(item ? '/content/products?category=' + encodeURIComponent(item.category) : null)
  const more = (others.data || []).filter((p) => p.sku !== sku && p.stock > 0).slice(0, 4)

  if (!sku || parts.error) return <Navigate to="/shop" replace />
  if (!item) return <section className="acp-section"><div className="container"><Loading /></div></section>

  // The shop page this product belongs to (for the "Back" link)
  const cats = shopCategories(settings)
  const cat = cats.find((c) => c.name === item.category)
  const backTo = cat ? shopLink(cats, cat) : '/shop'

  const amount = Math.min(Math.max(Number(qty) || 1, 1), Math.max(stock, 1))
  const total = item.price * amount
  const lowStock = stock > 0 && stock <= 5

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!pickup || pickup < today()) return setError('Please choose a pickup date from today on.')
    setSaving(true)
    try {
      const data = await api('/shop/reservations', {
        method: 'POST',
        body: { partId: item.sku, qty: amount, pickup },
      })
      toast(`Order #${data.id} placed — collect it on ${fmtDate(pickup)}`)
      navigate('/my-repairs')
    } catch (err) {
      setSaving(false)
      setError(err.message)    // e.g. "Only 3 left in stock." from the backend
      parts.reload()
    }
  }

  return (
    <section className="acp-section acp-order">
      <div className="container" style={{ maxWidth: 1040 }}>

        {/* Breadcrumb */}
        <nav className="acp-order-crumbs small mb-3">
          <Link to={backTo}><i className="bi bi-arrow-left"></i> {cat ? cat.name : 'Shop'}</Link>
          <span>/</span><span className="text-muted">{item.name}</span>
        </nav>

        <div className="row g-4">
          {/* ===== LEFT: picture ===== */}
          <div className="col-lg-6">
            <div className="acp-order-photo">
              <span className="acp-order-tag">{item.category}</span>
              <img src={item.image || '/media/logo.jpg'} alt={item.name} />
            </div>
          </div>

          {/* ===== RIGHT: order form ===== */}
          <div className="col-lg-6">
            <div className="acp-order-box">
              <h1 className="acp-order-title">{item.name}</h1>
              <div className="d-flex align-items-center gap-3 flex-wrap mb-4">
                <span className="acp-order-price">{nu(item.price)}</span>
                {stock === 0
                  ? <span className="acp-order-stock is-out"><i className="bi bi-x-circle-fill"></i> Out of stock</span>
                  : lowStock
                    ? <span className="acp-order-stock is-low"><i className="bi bi-exclamation-circle-fill"></i> Only {stock} left</span>
                    : <span className="acp-order-stock"><i className="bi bi-check-circle-fill"></i> {stock} in stock</span>}
              </div>

              <form onSubmit={submit}>
                {/* Quantity: − 1 + */}
                <label className="form-label small fw-bold">Quantity</label>
                <div className="acp-qty mb-4">
                  <button type="button" onClick={() => setQty(amount - 1)} disabled={amount <= 1} aria-label="Less"><i className="bi bi-dash-lg"></i></button>
                  <input type="number" min={1} max={stock || 1} value={qty} aria-label="Quantity"
                    onChange={(e) => setQty(e.target.value)} onBlur={() => setQty(amount)} />
                  <button type="button" onClick={() => setQty(amount + 1)} disabled={amount >= stock} aria-label="More"><i className="bi bi-plus-lg"></i></button>
                  <small className="text-muted ms-2">max {stock}</small>
                </div>

                {/* Pickup date */}
                <label className="form-label small fw-bold">When will you collect it?</label>
                <div className="acp-order-dates mb-2">
                  {[['Today', today()], ['Tomorrow', daysAgo(-1)], ['In 2 days', daysAgo(-2)]].map(([label, d]) => (
                    <button type="button" key={label} className={pickup === d ? 'is-on' : ''} onClick={() => setPickup(d)}>
                      <strong>{label}</strong><small>{fmtDate(d)}</small>
                    </button>
                  ))}
                </div>
                <input type="date" min={today()} className="form-control mb-4" value={pickup} onChange={(e) => setPickup(e.target.value)} required />

                {/* Summary */}
                <div className="acp-order-summary">
                  <div><span>{item.name} × {amount}</span><span>{nu(total)}</span></div>
                  <div><span>Pickup</span><span>{pickup ? fmtDate(pickup) : '—'}</span></div>
                  <div className="is-total"><span>Total to pay</span><span>{nu(total)}</span></div>
                </div>

                {error && <div className="alert alert-danger py-2 small mt-3 mb-0">{error}</div>}

                <button className="btn btn-brand-primary w-100 btn-lg mt-3" disabled={saving || stock === 0}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm"></span> Placing order…</>
                    : stock === 0 ? 'Out of stock' : <>Place Order · {nu(total)} <i className="bi bi-arrow-right"></i></>}
                </button>
                <p className="acp-order-note">
                  <i className="bi bi-geo-alt-fill"></i>
                  Collect and pay at our workshop{settings && settings.address ? <>: <strong>{settings.address}</strong></> : '.'}
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* ===== You may also like ===== */}
        {more.length > 0 && (
          <div className="mt-5">
            <h2 className="h5 fw-bold mb-3">You may also like</h2>
            <div className="row g-3">
              {more.map((p) => (
                <div className="col-6 col-md-3" key={p.sku}>
                  <Link to={'/reserve?item=' + encodeURIComponent(p.sku)} className="acp-order-more">
                    <img src={p.image || '/media/logo.jpg'} alt="" />
                    <strong>{p.name}</strong>
                    <span>{nu(p.price)}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
