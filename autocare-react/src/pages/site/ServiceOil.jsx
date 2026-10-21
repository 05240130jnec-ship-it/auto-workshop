// Converted from repairCar/service-oil.html — same markup and classes as your HTML page
import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'

export default function ServiceOil() {
  usePageTitle("Oil Change")
  return (
    <>


<div className="acp-subnav">
  <nav className="container acp-subnav-inner" aria-label="Services">
      <Link className="acp-subnav-link" to="/services">All Services</Link>
      <Link className="acp-subnav-link" to="/services/engine">Engine Diagnostics</Link>
      <Link className="acp-subnav-link" to="/services/brake">Brake Repair</Link>
      <Link className="acp-subnav-link active" to="/services/oil">Oil Change</Link>
      <Link className="acp-subnav-link" to="/services/car-wash">Car Wash</Link>
  </nav>
</div>

<section className="acp-section">
  <div className="container">
    <div className="row g-4 g-lg-5 align-items-center">
      <div className="col-lg-6">
        <small className="acp-eyebrow">Our Services</small>
        <h1 className="acp-page-title mt-2 mb-2">Oil Change</h1>
        <p className="acp-service-price mb-3">from Nu. 700</p>
        <p className="acp-lead">Fresh oil keeps your engine clean, cool and running smoothly.</p>
        <p className="text-muted">We drain the old oil, replace the oil filter and refill with the right grade of oil for your engine.</p>
        <p className="text-muted">While your car is with us, we also check fluid levels, belts and hoses at no extra cost.</p>
        <p className="text-muted">Most oil changes are finished while you wait.</p>
        <ul className="acp-ticks acp-ticks--single">
          <li><i className="bi bi-check-circle-fill"></i>Quality engine oil and new filter</li>
          <li><i className="bi bi-check-circle-fill"></i>Free fluid level and belt check</li>
          <li><i className="bi bi-check-circle-fill"></i>Quick service, usually while you wait</li>
        </ul>
        <div className="d-flex flex-wrap gap-3 mt-2">
          <Link to="/booking?service=oil-change" className="btn btn-brand-primary btn-lg">Book an Oil Change{' '}<i className="bi bi-arrow-right ms-1"></i></Link>
          <Link to="/services" className="btn btn-outline-secondary btn-lg acp-btn-ghost">All Services</Link>
        </div>
      </div>
      <div className="col-lg-6">
        <div className="acp-service-gallery">
          <img className="acp-gallery-main" src="/media/oil/oil1.jpg" alt="Oil Change" />
          <img src="/media/oil/oil2.jpg" alt="Oil Change" />
          <img src="/media/oil/oil3.jpg" alt="Oil Change" />
        </div>
      </div>
    </div>
  </div>
</section>

<section className="acp-cta">
  <div className="container">
    <h2 className="fw-bold">Ready to get started?</h2>
    <p className="mb-3">Whether it's a routine service or a major repair, we're here to help.</p>
    <Link to="/booking?service=oil-change" className="btn btn-brand-primary btn-lg">Book Now</Link>
  </div>
</section>


    </>
  )
}
