import { Link, Navigate, useParams } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'
import useSettings from '../../data/useSettings.js'
import Loading from '../../ui/Loading.jsx'
import { shopCategories, shopLink } from '../../data/content.js'
import ShopGrid from './ShopGrid.jsx'

// One page for every shop category: /shop (the first one) and /shop/accessories, /shop/cleaning ...
// The categories (name + description) come from MySQL (admin → Website Content → Shop pages),
// the products from Inventory (parts with "Show in shop" = Yes and the same category name).
export default function ShopCategory() {
  const { slug } = useParams()
  const settings = useSettings()
  const cats = shopCategories(settings)
  const cat = slug ? cats.find((c) => c.slug === slug) : cats[0]
  usePageTitle(cat ? cat.name : 'Shop')

  if (!settings) return <section className="acp-section"><div className="container"><Loading /></div></section>
  if (!cat) return <Navigate to="/shop" replace />

  return (
    <>
      <div className="acp-subnav">
        <nav className="container acp-subnav-inner" aria-label="Inventory categories">
          {cats.map((c) => (
            <Link key={c.slug} className={'acp-subnav-link' + (c.slug === cat.slug ? ' active' : '')} to={shopLink(cats, c)}>{c.name}</Link>
          ))}
        </nav>
      </div>

      <section className="acp-section">
        <div className="container">
          <div className="acp-section-head d-flex flex-wrap justify-content-between align-items-end gap-3">
            <div>
              <small className="acp-eyebrow">Inventory</small>
              <h1 className="acp-page-title mt-2 mb-2">{cat.name}</h1>
              <p className="text-muted mb-0">{cat.text}</p>
            </div>
          </div>

          <ShopGrid category={cat.name} />

          <div className="p-4 rounded-3 mt-5 mb-0 d-flex flex-wrap justify-content-between align-items-center gap-3" style={{ background: 'var(--brand-purple)', color: '#fff' }}>
            <div>
              <h2 className="h5 fw-bold mb-1">Have spare parts to sell?</h2>
              <p className="mb-0 small opacity-75">List your used or surplus auto parts and reach buyers directly.</p>
            </div>
            <Link to="/sell-part" className="btn btn-brand-yellow">+ Sell a Part</Link>
          </div>
        </div>
      </section>
    </>
  )
}
