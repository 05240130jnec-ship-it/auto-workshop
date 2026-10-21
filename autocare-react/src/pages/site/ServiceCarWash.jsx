// Converted from repairCar/service-car-wash.html — same markup and classes as your HTML page
import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'

export default function ServiceCarWash() {
  usePageTitle("Car Wash")
  return (
    <>


<div className="acp-subnav">
  <nav className="container acp-subnav-inner" aria-label="Services">
      <Link className="acp-subnav-link" to="/services">All Services</Link>
      <Link className="acp-subnav-link" to="/services/engine">Engine Diagnostics</Link>
      <Link className="acp-subnav-link" to="/services/brake">Brake Repair</Link>
      <Link className="acp-subnav-link" to="/services/oil">Oil Change</Link>
      <Link className="acp-subnav-link active" to="/services/car-wash">Car Wash</Link>
  </nav>
</div>

<section className="acp-section">
  <div className="container">
    <div className="row g-4 g-lg-5 align-items-center">
      <div className="col-lg-6">
        <small className="acp-eyebrow">Our Services</small>
        <h1 className="acp-page-title mt-2 mb-2">Car Wash</h1>
        <p className="acp-service-price mb-3">from Nu. 300</p>
        <p className="acp-lead">A spotless car inside and out, cleaned with care.</p>
        <p className="text-muted">Our team washes the body, wheels and tyres with car-safe shampoo and microfibre cloths.</p>
        <p className="text-muted">Choose an interior clean as well to vacuum the seats and carpets and wipe down the dashboard.</p>
        <p className="text-muted">Your car comes back shining and ready for the road.</p>
        <ul className="acp-ticks acp-ticks--single">
          <li><i className="bi bi-check-circle-fill"></i>Exterior wash with car-safe shampoo</li>
          <li><i className="bi bi-check-circle-fill"></i>Wheel and tyre cleaning</li>
          <li><i className="bi bi-check-circle-fill"></i>Optional interior vacuum and wipe-down</li>
        </ul>
        <div className="d-flex flex-wrap gap-3 mt-2">
          <Link to="/booking?service=car-wash" className="btn btn-brand-primary btn-lg">Book a Car Wash{' '}<i className="bi bi-arrow-right ms-1"></i></Link>
          <Link to="/services" className="btn btn-outline-secondary btn-lg acp-btn-ghost">All Services</Link>
        </div>
      </div>
      <div className="col-lg-6">
        <div className="acp-service-gallery">
          <img className="acp-gallery-main" src="/media/car%20wash/wash1.jpg" alt="Car Wash" />
          <img src="/media/car%20wash/wash2.jpg" alt="Car Wash" />
          <img src="/media/car%20wash/wash3.jpg" alt="Car Wash" />
        </div>
      </div>
    </div>
  </div>
</section>

<section className="acp-cta">
  <div className="container">
    <h2 className="fw-bold">Ready to get started?</h2>
    <p className="mb-3">Whether it's a routine service or a major repair, we're here to help.</p>
    <Link to="/booking?service=car-wash" className="btn btn-brand-primary btn-lg">Book Now</Link>
  </div>
</section>


    </>
  )
}
