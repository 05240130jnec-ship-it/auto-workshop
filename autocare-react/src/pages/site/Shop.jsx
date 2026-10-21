// Converted from repairCar/inventory.html — same markup and classes as your HTML page
import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'

export default function Shop() {
  usePageTitle("Auto Parts")
  return (
    <>


<div className="acp-subnav">
  <nav className="container acp-subnav-inner" aria-label="Inventory categories">
      <Link className="acp-subnav-link active" to="/shop">Auto Parts</Link>
      <Link className="acp-subnav-link" to="/shop/accessories">Car Accessories</Link>
      <Link className="acp-subnav-link" to="/shop/cleaning">Cleaning Products</Link>
      <Link className="acp-subnav-link" to="/shop/safety">Emergency & Safety</Link>
  </nav>
</div>

<section className="acp-section">
  <div className="container">
    <div className="acp-section-head d-flex flex-wrap justify-content-between align-items-end gap-3">
      <div>
        <small className="acp-eyebrow">Inventory</small>
        <h1 className="acp-page-title mt-2 mb-2">Auto Parts</h1>
        <p className="text-muted mb-0">Engine oil, brake pads, batteries, tyres and more, all genuine parts.</p>
      </div>
    </div>

    {/* AUTO PARTS */}
    <div className="row g-4">
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/oil/oil2.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Engine Oil</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 1000/-</p>
          <Link to="/reserve?item=engine-oil" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/brake/brake2.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Brake Pads</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 1800/-</p>
          <Link to="/reserve?item=brake-pads" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/oil/oil3.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Lubricants</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 1000/-</p>
          <Link to="/reserve?item=lubricants" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/accessories/batteries.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Batteries</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 4500/-</p>
          <Link to="/reserve?item=battery" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/accessories/tire.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Tires</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 3500/-</p>
          <Link to="/reserve?item=tires" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/accessories/spake%20plug.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Spark Plugs</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 350/-</p>
          <Link to="/reserve?item=spark-plugs" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
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
