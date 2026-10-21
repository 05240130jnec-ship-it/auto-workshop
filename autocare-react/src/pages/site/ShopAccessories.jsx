// Converted from repairCar/inventory-accessories.html — same markup and classes as your HTML page
import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'

export default function ShopAccessories() {
  usePageTitle("Car Accessories")
  return (
    <>


<div className="acp-subnav">
  <nav className="container acp-subnav-inner" aria-label="Inventory categories">
      <Link className="acp-subnav-link" to="/shop">Auto Parts</Link>
      <Link className="acp-subnav-link active" to="/shop/accessories">Car Accessories</Link>
      <Link className="acp-subnav-link" to="/shop/cleaning">Cleaning Products</Link>
      <Link className="acp-subnav-link" to="/shop/safety">Emergency & Safety</Link>
  </nav>
</div>

<section className="acp-section">
  <div className="container">
    <div className="acp-section-head d-flex flex-wrap justify-content-between align-items-end gap-3">
      <div>
        <small className="acp-eyebrow">Inventory</small>
        <h1 className="acp-page-title mt-2 mb-2">Car Accessories</h1>
        <p className="text-muted mb-0">Upgrade comfort and style with seat covers, cameras, lights and more.</p>
      </div>
    </div>

    {/* ACCESSORIES */}
    <div className="row g-4">
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/accessories/seat%20covers.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Seat Covers</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 3500/-</p>
          <Link to="/reserve?item=seat-covers" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/accessories/phone%20holder.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Phone Holders</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 800/-</p>
          <Link to="/reserve?item=phone-holder" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/accessories/desh%20carmer.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Dash Cameras</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 4500/-</p>
          <Link to="/reserve?item=dash-camera" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/accessories/car%20perform.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Car Perfumes</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 500/-</p>
          <Link to="/reserve?item=car-perfume" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/accessories/speaker.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Speakers</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 2800/-</p>
          <Link to="/reserve?item=speakers" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
        </div>
      </div>
      <div className="col-6 col-md-4 col-lg-3">
        <div className="acp-card h-100 text-center p-3">
          <img src="/media/accessories/alloy%20wheel.jpg" className="acp-product-img" alt="" />
          <h3 className="h6 fw-bold mb-1">Alloy Wheels</h3>
          <p className="mb-2" style={{ color: "var(--brand-green)", fontWeight: "700" }}>Nu. 8500/-</p>
          <Link to="/reserve?item=alloy-wheels" className="btn btn-brand-primary w-100 btn-sm">Buy Now</Link>
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
