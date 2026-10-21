// Converted from repairCar/services.html — same markup and classes as your HTML page
import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'

export default function Services() {
  usePageTitle("Services")
  return (
    <>


<div className="acp-subnav">
  <nav className="container acp-subnav-inner" aria-label="Services">
      <Link className="acp-subnav-link active" to="/services">All Services</Link>
      <Link className="acp-subnav-link" to="/services/engine">Engine Diagnostics</Link>
      <Link className="acp-subnav-link" to="/services/brake">Brake Repair</Link>
      <Link className="acp-subnav-link" to="/services/oil">Oil Change</Link>
      <Link className="acp-subnav-link" to="/services/car-wash">Car Wash</Link>
  </nav>
</div>

<section className="acp-section">
  <div className="container">
    <div className="acp-section-head">
      <small className="acp-eyebrow">Our Services</small>
      <h1 className="acp-page-title mt-2 mb-2">All Services</h1>
      <p className="text-muted mb-0">Pick a service to see the details, or book it straight away.</p>
    </div>
    <div className="row g-4">
      <div className="col-sm-6 col-lg-3">
        <article className="acp-service-card">
          <Link to="/services/engine" className="acp-service-card-img"><img src="/media/engine/engine1.jpg" alt="Engine Diagnostics" /></Link>
          <div className="acp-service-card-body">
            <h3>Engine Diagnostics</h3>
            <p className="acp-service-card-text">Scan tools and expert checks to find engine problems early.</p>
            <p className="acp-service-price">from Nu. 1,000</p>
            <div className="acp-service-card-actions">
              <Link to="/booking?service=engine-diagnostics" className="btn btn-brand-primary">Book Now</Link>
              <Link to="/services/engine" className="acp-more-link">Details{' '}<i className="bi bi-arrow-right"></i></Link>
            </div>
          </div>
        </article>
      </div>
      <div className="col-sm-6 col-lg-3">
        <article className="acp-service-card">
          <Link to="/services/brake" className="acp-service-card-img"><img src="/media/brake/brake1.png" alt="Brake Pad Replacement" /></Link>
          <div className="acp-service-card-body">
            <h3>Brake Pad Replacement</h3>
            <p className="acp-service-card-text">Inspection and replacement of pads and discs with genuine parts.</p>
            <p className="acp-service-price">from Nu. 9,189</p>
            <div className="acp-service-card-actions">
              <Link to="/booking?service=brake-repair" className="btn btn-brand-primary">Book Now</Link>
              <Link to="/services/brake" className="acp-more-link">Details{' '}<i className="bi bi-arrow-right"></i></Link>
            </div>
          </div>
        </article>
      </div>
      <div className="col-sm-6 col-lg-3">
        <article className="acp-service-card">
          <Link to="/services/oil" className="acp-service-card-img"><img src="/media/oil/oil1.jpg" alt="Oil Change" /></Link>
          <div className="acp-service-card-body">
            <h3>Oil Change</h3>
            <p className="acp-service-card-text">Fresh engine oil and a new filter, usually done while you wait.</p>
            <p className="acp-service-price">from Nu. 700</p>
            <div className="acp-service-card-actions">
              <Link to="/booking?service=oil-change" className="btn btn-brand-primary">Book Now</Link>
              <Link to="/services/oil" className="acp-more-link">Details{' '}<i className="bi bi-arrow-right"></i></Link>
            </div>
          </div>
        </article>
      </div>
      <div className="col-sm-6 col-lg-3">
        <article className="acp-service-card">
          <Link to="/services/car-wash" className="acp-service-card-img"><img src="/media/car%20wash/wash1.jpg" alt="Car Wash" /></Link>
          <div className="acp-service-card-body">
            <h3>Car Wash</h3>
            <p className="acp-service-card-text">Exterior wash, wheels and tyres, with an optional interior clean.</p>
            <p className="acp-service-price">from Nu. 300</p>
            <div className="acp-service-card-actions">
              <Link to="/booking?service=car-wash" className="btn btn-brand-primary">Book Now</Link>
              <Link to="/services/car-wash" className="acp-more-link">Details{' '}<i className="bi bi-arrow-right"></i></Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</section>

<section className="acp-cta">
  <div className="container">
    <h2 className="fw-bold">Ready to get started?</h2>
    <p className="mb-3">Whether it's a routine service or a major repair, we're here to help.</p>
    <Link to="/contact" className="btn btn-brand-primary btn-lg">Contact Us</Link>
  </div>
</section>


    </>
  )
}
