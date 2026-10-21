// Converted from repairCar/index.html — same markup and classes as your HTML page
import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'
import useCarousel from '../../ui/useCarousel.js'

export default function Home() {
  usePageTitle("Home")
  useCarousel('heroCarousel')

  return (
    <>


{/* HERO SLIDESHOW (Bootstrap carousel) */}
<section id="heroCarousel" className="carousel slide carousel-fade acp-hero2" data-bs-ride="carousel" data-bs-interval="5000" data-bs-pause="false" aria-label="Featured">
  <div className="carousel-indicators">
    <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
    <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
  </div>

  <div className="carousel-inner">

    {/* Slide 1: welcome */}
    <div className="carousel-item active">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <span className="acp-hero2-tag"><i className="bi bi-geo-alt-fill"></i>{' '}Auto workshop · Sarpang, Bhutan</span>
            <h1 className="acp-hero2-title">Your Trusted{' '}<span>Auto Care</span>{' '}Partner</h1>
            <p className="acp-hero2-text">Expert service, genuine parts, and a commitment to get you back on the road safely.</p>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/services" className="btn btn-brand-primary btn-lg">Book Your Service{' '}<i className="bi bi-arrow-right ms-1"></i></Link>
              <Link to="/shop" className="btn btn-lg acp-btn-outline-light">Shop Parts</Link>
            </div>
            <ul className="acp-hero2-points">
              <li><i className="bi bi-patch-check-fill"></i>Certified technicians</li>
              <li><i className="bi bi-shield-check"></i>Genuine parts</li>
              <li><i className="bi bi-tools"></i>Free inspection</li>
            </ul>
          </div>
          <div className="col-lg-6">
            <div className="acp-hero2-media">
              <img src="/media/engine/engine1.jpg" alt="Technician running engine diagnostics on a laptop" />
              <div className="acp-hero2-chip">
                <i className="bi bi-patch-check-fill"></i>
                <div><strong>Certified technicians</strong><span>Genuine parts · Fair pricing</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Slide 2: brake offer */}
    <div className="carousel-item">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <span className="acp-hero2-tag"><i className="bi bi-clock-fill"></i>{' '}Limited time offer</span>
            <h2 className="acp-hero2-title">Get{' '}<span>20% Off</span>{' '}Brake Pad Replacement</h2>
            <p className="acp-hero2-text">Book your brake service before{' '}<strong>31 October 2026</strong>{' '}and save. Free inspection included with every booking.</p>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/booking?service=brake-repair" className="btn btn-brand-primary btn-lg">Book Now{' '}<i className="bi bi-arrow-right ms-1"></i></Link>
              <Link to="/services/brake" className="btn btn-lg acp-btn-outline-light">Brake Repair Details</Link>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="acp-hero2-media">
              <img src="/media/banner1.jpg" alt="Cars on lifts in the AutoCarePro workshop" />
              <span className="acp-offer-badge">20%<small>OFF</small></span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
    <span className="visually-hidden">Previous</span>
  </button>
  <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
    <span className="carousel-control-next-icon" aria-hidden="true"></span>
    <span className="visually-hidden">Next</span>
  </button>
</section>

{/* INTRO */}
<section className="acp-intro bg-white">
  <div className="container acp-container-wide">
    <div className="row align-items-center g-4 g-lg-5">
      <div className="col-lg-7">
        <small className="acp-eyebrow">Why AutoCarePro</small>
        <h2 className="fw-bold mt-2 mb-3">Expert Care for Every Car</h2>
        <p className="text-muted">From routine maintenance to complex engine overhauls, our certified technicians combine decades of hands-on experience with cutting-edge diagnostic technology.</p>
        <p className="text-muted">We don't just fix cars – we build relationships. Our integrated inventory and supplier management ensures genuine parts, faster turnaround, and fair pricing.</p>
        <ul className="acp-ticks">
          <li><i className="bi bi-check-circle-fill"></i>Certified technicians</li>
          <li><i className="bi bi-check-circle-fill"></i>Genuine spare parts</li>
          <li><i className="bi bi-check-circle-fill"></i>Fast turnaround</li>
          <li><i className="bi bi-check-circle-fill"></i>Fair pricing</li>
        </ul>
        <Link to="/sell-part" className="btn btn-brand-yellow btn-lg mt-2">Sell a Spare Part{' '}<i className="bi bi-arrow-right ms-1"></i></Link>
      </div>
      <div className="col-lg-5">
        <img src="/media/engine/engine2.jpg" className="img-fluid acp-intro-img" alt="Mechanic running engine diagnostics" />
      </div>
    </div>
  </div>
</section>

{/* POPULAR SERVICES */}
<section className="acp-section">
  <div className="container">
    <h2 className="fw-bold mb-2">Popular Services</h2>
    <p className="text-muted mb-4">Book any of our most requested services in just a few clicks.</p>

    <div className="row g-4">
      <div className="col-md-6 col-lg-3">
        <div className="acp-card h-100 text-center pb-3">
          <img className="card-img-top" src="/media/engine/engine1.jpg" alt="" />
          <div className="p-3">
            <h3 className="h6 fw-bold mb-1">Engine Diagnostics</h3>
            <p className="price mb-3">from Nu. 1,000</p>
            <Link to="/booking?service=engine-diagnostics" className="btn btn-brand-primary w-100">Book Now</Link>
          </div>
        </div>
      </div>
      <div className="col-md-6 col-lg-3">
        <div className="acp-card h-100 text-center pb-3">
          <img className="card-img-top" src="/media/brake/brake1.png" alt="" />
          <div className="p-3">
            <h3 className="h6 fw-bold mb-1">Brake Repair</h3>
            <p className="price mb-3">from Nu. 9,189</p>
            <Link to="/booking?service=brake-repair" className="btn btn-brand-primary w-100">Book Now</Link>
          </div>
        </div>
      </div>
      <div className="col-md-6 col-lg-3">
        <div className="acp-card h-100 text-center pb-3">
          <img className="card-img-top" src="/media/oil/oil1.jpg" alt="" />
          <div className="p-3">
            <h3 className="h6 fw-bold mb-1">Oil Change</h3>
            <p className="price mb-3">from Nu. 700</p>
            <Link to="/booking?service=oil-change" className="btn btn-brand-primary w-100">Book Now</Link>
          </div>
        </div>
      </div>
      <div className="col-md-6 col-lg-3">
        <div className="acp-card h-100 text-center pb-3">
          <img className="card-img-top" src="/media/car%20wash/wash1.jpg" alt="" />
          <div className="p-3">
            <h3 className="h6 fw-bold mb-1">Car Wash</h3>
            <p className="price mb-3">from Nu. 300</p>
            <Link to="/booking?service=car-wash" className="btn btn-brand-primary w-100">Book Now</Link>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/* BANNER 2 */}
<section className="acp-banner acp-banner-alt">
  <div className="container">
    <div className="row align-items-center g-4">
      <div className="col-lg-8">
        <span className="acp-banner-tag">🆕 New Arrivals</span>
        <h2 className="acp-banner-title">Genuine Spare Parts Just Restocked</h2>
        <p className="acp-banner-text mb-0">{' '}Browse our latest inventory — engine oils, brake pads, batteries, accessories, cleaning products, and safety essentials.{' '}</p>
      </div>
      <div className="col-lg-4 text-lg-end text-center">
        <Link to="/shop" className="btn btn-brand-yellow btn-lg">{' '}Shop Parts{' '}<i className="bi bi-arrow-right ms-1"></i>
        </Link>
      </div>
    </div>
  </div>
</section>

{/* CTA */}
<section className="acp-cta">
  <div className="container">
    <h2 className="fw-bold">Ready to get started?</h2>
    <p className="mb-0">Whether it's a routine service or a major repair, we're here to help. Reach out to us today for a free estimate.</p>
  </div>
</section>

{/* FOOTER */}

    </>
  )
}
