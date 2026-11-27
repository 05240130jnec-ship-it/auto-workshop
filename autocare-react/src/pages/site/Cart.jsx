import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { nu, today, daysAgo, fmtDate } from '../../data/store.js'
import useSettings from '../../data/useSettings.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import useApi from '../../useApi.js'
import Loading from '../../ui/Loading.jsx'
import { setCartQty, removeFromCart, checkoutCart } from '../../data/cart.js'

// My Cart (/cart): the products the customer saved with "Add to cart" to decide later.
// The cart is saved in MySQL (GET /api/cart). The customer ticks what to buy now:
// "Place order" orders only the ticked products (one order each, collected and paid at the workshop);
// the products that are not ticked stay in the cart for later.
export default function Cart() {
  usePageTitle('My Cart')
  const { confirm, notice, toast } = useDialogs()
  const navigate = useNavigate()
  const settings = useSettings()
  const loaded = useApi('/cart')
  const [cart, setCart] = useState(null)          // { items, total, count }
  const [pickup, setPickup] = useState(daysAgo(-1))   // tomorrow
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [unticked, setUnticked] = useState([])   // products the customer keeps for later (all ticked at first)

  useEffect(() => { if (loaded.data) setCart(loaded.data) }, [loaded.data])

  if (loaded.loading || loaded.error || !cart) {
    return <section className="acp-section"><div className="container"><Loading error={loaded.error} onRetry={loaded.reload} /></div></section>
  }
  const items = cart.items
  const chosen = items.filter((it) => !unticked.includes(it.partId))
  const chosenCount = chosen.reduce((sum, it) => sum + it.qty, 0)
  const chosenTotal = chosen.reduce((sum, it) => sum + it.price * it.qty, 0)
  const allTicked = chosen.length === items.length

  const tick = (it) => setUnticked((u) => (u.includes(it.partId) ? u.filter((x) => x !== it.partId) : [...u, it.partId]))
  const tickAll = () => setUnticked(allTicked ? items.map((it) => it.partId) : [])

  async function change(it, qty) {
    if (qty < 1 || qty > it.stock) return
    setError('')
    try { setCart(await setCartQty(it.partId, qty)) } catch (err) { setError(err.message); loaded.reload() }
  }

  async function remove(it) {
    setError('')
    try {
      setCart(await removeFromCart(it.partId))
      toast(it.name + ' removed from your cart')
    } catch (err) { setError(err.message); loaded.reload() }
  }

  async function placeOrder() {
    setError('')
    if (chosen.length === 0) return setError('Tick at least one product to order.')
    if (!pickup || pickup < today()) return setError('Please choose a pickup date from today on.')
    const left = items.length - chosen.length
    const sure = await confirm(
      `Order ${chosenCount} item${chosenCount > 1 ? 's' : ''} for ${nu(chosenTotal)} and collect ${chosenCount > 1 ? 'them' : 'it'} on ${fmtDate(pickup)}?` +
      (left > 0 ? ` The other ${left} product${left > 1 ? 's' : ''} will stay in your cart.` : ''),
      { title: 'Place your order?', okText: 'Yes, place order' })
    if (!sure) return
    setBusy(true)
    try {
      const result = await checkoutCart(pickup, chosen.map((it) => it.partId))
      await notice('Order placed!',
        `Your order${result.ids.length > 1 ? 's' : ''} ${result.ids.join(', ')} ${result.ids.length > 1 ? 'are' : 'is'} ready for pickup on ${fmtDate(pickup)}. Pay at the workshop.`)
      navigate('/my-repairs')
    } catch (err) {
      setBusy(false)
      setError(err.message)       // e.g. "Only 2 Brake Pads left in stock."
      loaded.reload()
    }
  }

  return (
    <section className="acp-section acp-order">
      <div className="container" style={{ maxWidth: 1040 }}>
        <nav className="acp-order-crumbs small mb-3">
          <Link to="/shop"><i className="bi bi-arrow-left"></i> Continue shopping</Link>
        </nav>
        <h1 className="h3 fw-bold mb-4"><i className="bi bi-cart3 me-2"></i>My Cart</h1>

        {items.length === 0 ? (
          <div className="acp-card p-5 text-center">
            <i className="bi bi-cart3 fs-1 text-muted"></i>
            <p className="mt-2 mb-3 text-muted">Your cart is empty.</p>
            <Link to="/shop" className="btn btn-brand-primary">Go to the shop</Link>
          </div>
        ) : (
          <div className="row g-4">
            {/* ===== LEFT: the products ===== */}
            <div className="col-lg-7">
              <label className="d-flex align-items-center gap-2 small fw-bold mb-2" style={{ cursor: 'pointer' }}>
                <input type="checkbox" className="form-check-input m-0" checked={allTicked} onChange={tickAll} />
                Select all ({items.length})
              </label>
              {items.map((it) => (
                <div className={'acp-card acp-cart-row' + (unticked.includes(it.partId) ? ' is-later' : '')} key={it.partId}>
                  <input type="checkbox" className="form-check-input m-0 flex-shrink-0" aria-label={'Order ' + it.name + ' now'}
                    checked={!unticked.includes(it.partId)} onChange={() => tick(it)} />
                  <img src={it.image || '/media/logo.jpg'} alt="" />
                  <div className="flex-grow-1">
                    <Link to={'/reserve?item=' + encodeURIComponent(it.sku)} className="fw-bold text-dark text-decoration-none">{it.name}</Link>
                    <div className="small text-muted">{it.category} · {nu(it.price)} each</div>
                    <div className="d-flex align-items-center gap-3 mt-2 flex-wrap">
                      <div className="acp-qty acp-qty-sm">
                        <button type="button" onClick={() => change(it, it.qty - 1)} disabled={it.qty <= 1} aria-label="Less"><i className="bi bi-dash-lg"></i></button>
                        <input type="number" value={it.qty} readOnly aria-label="Quantity" />
                        <button type="button" onClick={() => change(it, it.qty + 1)} disabled={it.qty >= it.stock} aria-label="More"><i className="bi bi-plus-lg"></i></button>
                      </div>
                      <button type="button" className="btn btn-link btn-sm text-danger p-0" onClick={() => remove(it)}>
                        <i className="bi bi-trash3"></i> Remove
                      </button>
                    </div>
                    {it.qty > it.stock && <div className="small text-danger mt-1">Only {it.stock} left in stock.</div>}
                  </div>
                  <strong className="text-nowrap">{nu(it.price * it.qty)}</strong>
                </div>
              ))}
            </div>

            {/* ===== RIGHT: pickup date + total ===== */}
            <div className="col-lg-5">
              <div className="acp-order-box">
                <label className="form-label small fw-bold">When will you collect it?</label>
                <div className="acp-order-dates mb-2">
                  {[['Today', today()], ['Tomorrow', daysAgo(-1)], ['In 2 days', daysAgo(-2)]].map(([label, d]) => (
                    <button type="button" key={label} className={pickup === d ? 'is-on' : ''} onClick={() => setPickup(d)}>
                      <strong>{label}</strong><small>{fmtDate(d)}</small>
                    </button>
                  ))}
                </div>
                <input type="date" min={today()} className="form-control mb-4" value={pickup} onChange={(e) => setPickup(e.target.value)} />

                <div className="acp-order-summary">
                  {chosen.length === 0 && <div className="text-muted"><span>No products ticked</span><span></span></div>}
                  {chosen.map((it) => (
                    <div key={it.partId}><span>{it.name} × {it.qty}</span><span>{nu(it.price * it.qty)}</span></div>
                  ))}
                  <div><span>Pickup</span><span>{pickup ? fmtDate(pickup) : '—'}</span></div>
                  <div className="is-total"><span>Total to pay</span><span>{nu(chosenTotal)}</span></div>
                </div>

                {error && <div className="alert alert-danger py-2 small mt-3 mb-0">{error}</div>}

                <button type="button" className="btn btn-brand-primary w-100 btn-lg mt-3" onClick={placeOrder} disabled={busy || chosen.length === 0}>
                  {busy ? <><span className="spinner-border spinner-border-sm"></span> Placing order…</>
                    : chosen.length === 0 ? 'Tick a product to order' : <>Place Order ({chosenCount}) · {nu(chosenTotal)} <i className="bi bi-arrow-right"></i></>}
                </button>
                <p className="acp-order-note">
                  <i className="bi bi-geo-alt-fill"></i>
                  Collect and pay at our workshop{settings && settings.address ? <>: <strong>{settings.address}</strong></> : '.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
