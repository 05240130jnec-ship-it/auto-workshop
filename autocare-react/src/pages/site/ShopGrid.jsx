import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.js'
import { useDialogs } from '../../ui/DialogContext.js'
import { addToCart } from '../../data/cart.js'
import useApi from '../../useApi.js'
import Loading from '../../ui/Loading.jsx'
import { nu } from '../../data/store.js'

// The product cards on the 4 shop pages.
// Products, prices and pictures come from MySQL: inventory parts with "Show in shop" = Yes
// (admin → Inventory → edit a part). Used like:  <ShopGrid category="Auto Parts" />
export default function ShopGrid({ category }) {
  const list = useApi('/content/products?category=' + encodeURIComponent(category))
  const products = list.data || []
  const { user } = useAuth()
  const { toast, notice } = useDialogs()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(null)   // the product being added right now

  // Add to cart (only for logged-in customers; visitors go to the login page first)
  async function add(p) {
    if (!user || user.role !== 'customer') return navigate('/login')
    setAdding(p.id)
    try {
      await addToCart(p.id, 1)
      toast(p.name + ' added to your cart')
    } catch (err) {
      await notice('Could not add to cart', err.message)
    }
    setAdding(null)
  }

  if (list.loading || list.error) return <Loading error={list.error} onRetry={list.reload} />
  if (products.length === 0) {
    return <p className="text-muted text-center py-5">No products in this category yet.</p>
  }

  return (
    <div className="row g-4">
      {products.map((p) => (
        <div className="col-6 col-md-4 col-lg-3" key={p.id}>
          <div className="acp-card h-100 text-center p-3">
            <img src={p.image || '/media/logo.jpg'} className="acp-product-img" alt="" />
            <h3 className="h6 fw-bold mb-1">{p.name}</h3>
            <p className="mb-2" style={{ color: 'var(--brand-green)', fontWeight: '700' }}>{nu(p.price)}</p>
            {p.stock > 0
              ? (
                <div className="d-flex gap-2">
                  <Link to={'/reserve?item=' + encodeURIComponent(p.sku)} className="btn btn-brand-primary flex-grow-1 btn-sm">Buy Now</Link>
                  <button type="button" className="btn btn-outline-secondary btn-sm" title="Add to cart" aria-label="Add to cart"
                    onClick={() => add(p)} disabled={adding === p.id}>
                    {adding === p.id ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-cart-plus"></i>}
                  </button>
                </div>
              )
              : <button className="btn btn-secondary w-100 btn-sm" disabled>Out of stock</button>}
          </div>
        </div>
      ))}
    </div>
  )
}
