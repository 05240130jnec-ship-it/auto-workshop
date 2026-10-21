// Converted from repairCar/inventory-safety.html — same markup and classes as your HTML page
import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'

export default function ShopSafety() {
  usePageTitle("Emergency & Safety")
  return (
    <>


<div className="acp-subnav">
  <nav className="container acp-subnav-inner" aria-label="Inventory categories">
      <Link className="acp-subnav-link" to="/shop">Auto Parts</Link>
      <Link className="acp-subnav-link" to="/shop/accessories">Car Accessories</Link>
      <Link className="acp-subnav-link" to="/shop/cleaning">Cleaning Products</Link>
      <Link className="acp-subnav-link active" to="/shop/safety">Emergency & Safety</Link>
  </nav>
</div>

<section className="acp-section">
  <div className="container">
    <div className="acp-section-head d-flex flex-wrap justify-content-between align-items-end gap-3">
      <div>
        <small className="acp-eyebrow">Inventory</small>
        <h1 className="acp-page-title mt-2 mb-2">Emergency & Safety</h1>
        <p className="text-muted mb-0">Be ready for the road with jumper cables, first aid and safety gear.</p>
      </div>
    </div>

    {/* SAFETY */}
    <div className="row g-4">
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/accessories/jumper%20cable.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Jumper Cables</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 900/-</p>
          <Link to="/reserve?item=jumper-cables" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/accessories/tire%20inflator.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Tire Inflator</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 2200/-</p>
          <Link to="/reserve?item=tire-inflator" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/accessories/tool%20kit.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Tool Kits</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 4000/-</p>
          <Link to="/reserve?item=tool-kit" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/accessories/first%20aid%20kit.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">First Aid Kit</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 1200/-</p>
          <Link to="/reserve?item=first-aid" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
    </div>

    <div className="p-4 rounded-3 mt-5 mb-0 d-flex flex-wrap justify-content-between align-items-center gap-3" style={{ background: "var(--brand-purple)", color: "#fff" }}>
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
