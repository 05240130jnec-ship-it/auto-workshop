// Converted from repairCar/service-engine.html — same markup and classes as your HTML page
import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'

export default function ServiceEngine() {
  usePageTitle("Engine Diagnostics")
  return (
    <>


<div className="acp-subnav">
  <nav className="container acp-subnav-inner" aria-label="Services">
      <Link className="acp-subnav-link" to="/services">All Services</Link>
      <Link className="acp-subnav-link active" to="/services/engine">Engine Diagnostics</Link>
      <Link className="acp-subnav-link" to="/services/brake">Brake Repair</Link>
      <Link className="acp-subnav-link" to="/services/oil">Oil Change</Link>
      <Link className="acp-subnav-link" to="/services/car-wash">Car Wash</Link>
  </nav>
</div>

<section className="acp-section">
  <div className="container">
    <div className="row g-4 g-lg-5 align-items-center">
      <div className="col-lg-6">
        <small className="acp-eyebrow">Our Services</small>
        <h1 className="acp-page-title mt-2 mb-2">Engine Diagnostics</h1>
        <p className="acp-service-price mb-3">from Nu. 1,000</p>
        <p className="acp-lead">Find out exactly what is wrong with your engine before you spend money fixing it.</p>
        <p className="text-muted">We use advanced scan tools to read error codes and pinpoint engine performance issues with precision.</p>
        <p className="text-muted">Our certified technicians interpret data to provide transparent repair recommendations and avoid unnecessary costs.</p>
        <p className="text-muted">Get your vehicle back on the road quickly with accurate diagnostics you can trust.</p>
        <ul className="acp-ticks acp-ticks--single">
          <li><i className="bi bi-check-circle-fill"></i>Faster problem identification saves time and money</li>
          <li><i className="bi bi-check-circle-fill"></i>Detailed reports help you make informed decisions</li>
          <li><i className="bi bi-check-circle-fill"></i>Prevent costly breakdowns with early detection</li>
        </ul>
        <div className="d-flex flex-wrap gap-3 mt-2">
          <Link to="/booking?service=engine-diagnostics" className="btn btn-brand-primary btn-lg">Book a Diagnostics{' '}<i className="bi bi-arrow-right ms-1"></i></Link>
          <Link to="/services" className="btn btn-outline-secondary btn-lg acp-btn-ghost">All Services</Link>
        </div>
      </div>
      <div className="col-lg-6">
        <div className="acp-service-gallery">
          <img className="acp-gallery-main" src="/media/engine/engine2.jpg" alt="Engine Diagnostics" />
          <img src="/media/engine/engine1.jpg" alt="Engine Diagnostics" />
          <img src="/media/engine/engine3.jpg" alt="Engine Diagnostics" />
        </div>
      </div>
    </div>
  </div>
</section>

<section className="acp-cta">
  <div className="container">
    <h2 className="fw-bold">Ready to get started?</h2>
    <p className="mb-3">Whether it's a routine service or a major repair, we're here to help.</p>
    <Link to="/booking?service=engine-diagnostics" className="btn btn-brand-primary btn-lg">Book Now</Link>
  </div>
</section>


    </>
  )
}
