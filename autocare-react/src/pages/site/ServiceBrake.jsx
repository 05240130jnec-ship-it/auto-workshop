// Converted from repairCar/service-brake.html — same markup and classes as your HTML page
import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'

export default function ServiceBrake() {
  usePageTitle("Brake Repair")
  return (
    <>


<div className="acp-subnav">
  <nav className="container acp-subnav-inner" aria-label="Services">
      <Link className="acp-subnav-link" to="/services">All Services</Link>
      <Link className="acp-subnav-link" to="/services/engine">Engine Diagnostics</Link>
      <Link className="acp-subnav-link active" to="/services/brake">Brake Repair</Link>
      <Link className="acp-subnav-link" to="/services/oil">Oil Change</Link>
      <Link className="acp-subnav-link" to="/services/car-wash">Car Wash</Link>
  </nav>
</div>

<section className="acp-section">
  <div className="container">
    <div className="row g-4 g-lg-5 align-items-center">
      <div className="col-lg-6">
        <small className="acp-eyebrow">Our Services</small>
        <h1 className="acp-page-title mt-2 mb-2">Brake Repair</h1>
        <p className="acp-service-price mb-3">from Nu. 9,189</p>
        <p className="acp-lead">Safe, quiet and reliable stopping power, checked and repaired by our technicians.</p>
        <p className="text-muted">We inspect brake pads, discs, calipers and brake fluid to find wear before it becomes dangerous.</p>
        <p className="text-muted">Worn pads and damaged discs are replaced with genuine parts, and every job ends with a road test.</p>
        <p className="text-muted">If you hear squeaking or grinding, or the pedal feels soft, book a brake check today.</p>
        <ul className="acp-ticks acp-ticks--single">
          <li><i className="bi bi-check-circle-fill"></i>Free brake inspection with every booking</li>
          <li><i className="bi bi-check-circle-fill"></i>Genuine brake pads and discs</li>
          <li><i className="bi bi-check-circle-fill"></i>Road-tested before you collect your car</li>
        </ul>
        <div className="d-flex flex-wrap gap-3 mt-2">
          <Link to="/booking?service=brake-repair" className="btn btn-brand-primary btn-lg">Book Brake Repair{' '}<i className="bi bi-arrow-right ms-1"></i></Link>
          <Link to="/services" className="btn btn-outline-secondary btn-lg acp-btn-ghost">All Services</Link>
        </div>
      </div>
      <div className="col-lg-6">
        <div className="acp-service-gallery">
          <img className="acp-gallery-main" src="/media/brake/brake1.png" alt="Brake Repair" />
          <img src="/media/brake/brake2.jpg" alt="Brake Repair" />
          <img src="/media/brake/brake3.jpg" alt="Brake Repair" />
        </div>
      </div>
    </div>
  </div>
</section>

<section className="acp-cta">
  <div className="container">
    <h2 className="fw-bold">Ready to get started?</h2>
    <p className="mb-3">Whether it's a routine service or a major repair, we're here to help.</p>
    <Link to="/booking?service=brake-repair" className="btn btn-brand-primary btn-lg">Book Now</Link>
  </div>
</section>


    </>
  )
}
