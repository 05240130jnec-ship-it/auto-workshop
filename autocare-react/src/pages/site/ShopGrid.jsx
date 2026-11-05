import { Link } from 'react-router-dom'
import useApi from '../../useApi.js'
import Loading from '../../ui/Loading.jsx'
import { nu } from '../../data/store.js'

// The product cards on the 4 shop pages.
// Products, prices and pictures come from MySQL: inventory parts with "Show in shop" = Yes
// (admin → Inventory → edit a part). Used like:  <ShopGrid category="Auto Parts" />
export default function ShopGrid({ category }) {
  const list = useApi('/content/products?category=' + encodeURIComponent(category))
  const products = list.data || []

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
              ? <Link to={'/reserve?item=' + encodeURIComponent(p.sku)} className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
              : <button className="btn btn-secondary w-100 btn-sm" disabled>Out of stock</button>}
          </div>
        </div>
      ))}
    </div>
  )
}
