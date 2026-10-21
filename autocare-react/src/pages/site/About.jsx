// Converted from repairCar/about.html — same markup and classes as your HTML page
import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'

export default function About() {
  usePageTitle("About Us")
  return (
    <>


{/* ===== HERO — WHO WE ARE ===== */}
<section className="acp-hero2 acp-page-hero">
  <div className="container">
    <div className="row align-items-center g-5">
      <div className="col-lg-6">
        <span className="acp-hero2-tag"><i className="bi bi-people-fill"></i>{' '}Who we are</span>
        <h1 className="acp-hero2-title">About{' '}<span>AutoCarePro</span></h1>
        <p className="acp-hero2-text">Your trusted web-based auto workshop, where expert repairs meet genuine spare parts, all managed on one smart digital platform.</p>
        <div className="d-flex flex-wrap gap-3">
          <Link to="/services" className="btn btn-brand-primary btn-lg">Our Services{' '}<i className="bi bi-arrow-right ms-1"></i></Link>
          <Link to="/contact" className="btn btn-lg acp-btn-outline-light">Contact Us</Link>
        </div>
      </div>
      <div className="col-lg-6">
        <div className="acp-hero2-media">
          <img src="/media/car%20wash/wash2.jpg" alt="Car being washed at the AutoCarePro workshop" />
          <div className="acp-hero2-chip">
            <i className="bi bi-geo-alt-fill"></i>
            <div><strong>Sarpang, Bhutan</strong><span>Open Monday – Saturday</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/* ===== OUR STORY ===== */}
<section className="acp-section bg-white">
  <div className="container">
    <div className="row g-5 align-items-center">
      <div className="col-lg-5">
        <img src="/media/engine/engine3.jpg" className="acp-photo" alt="Technician working in the AutoCarePro workshop" />
      </div>
      <div className="col-lg-7">
        <small className="acp-eyebrow">Our Story</small>
        <h2 className="acp-page-title mt-2 mb-4">Built for Modern Workshops</h2>
        <p className="text-muted"><strong>AutoCarePro</strong>{' '}is a smart web-based auto workshop management system created to replace slow and outdated paper-based processes. Our goal is to make workshop operations faster, easier, and more organized for both customers and mechanics.</p>
        <p className="text-muted">We believe every customer should stay informed about their vehicle’s repair progress in real time, while mechanics should have a clear and efficient digital workspace to manage their daily tasks.</p>
        <p className="text-muted mb-0">From booking repair services to purchasing genuine spare parts online, AutoCarePro combines everything a modern workshop needs into one simple and accessible platform.</p>
      </div>
    </div>
  </div>
</section>

{/* ===== WHAT WE OFFER ===== */}
<section className="acp-section">
  <div className="container">
    <div className="text-center mb-5">
      <small className="acp-eyebrow">What We Offer</small>
      <h2 className="acp-page-title mt-2 mb-2">Three Core Pillars</h2>
      <p className="text-muted mb-0">The three things that power every AutoCarePro workshop.</p>
    </div>
    <div className="row g-4">
      <div className="col-md-4">
        <div className="acp-feature">
          <span className="acp-feature-icon"><i className="bi bi-wrench-adjustable"></i></span>
          <h3>Expert Repair Services</h3>
          <p>Book vehicle repair services online and track your vehicle status in real time, from pending to completed.</p>
          <Link to="/services" className="acp-more-link">View services{' '}<i className="bi bi-arrow-right"></i></Link>
        </div>
      </div>
      <div className="col-md-4">
        <div className="acp-feature">
          <span className="acp-feature-icon"><i className="bi bi-box-seam"></i></span>
          <h3>Genuine Spare Parts Shop</h3>
          <p>Browse and purchase genuine spare parts directly from our workshop inventory through a simple online platform.</p>
          <Link to="/shop" className="acp-more-link">Shop parts{' '}<i className="bi bi-arrow-right"></i></Link>
        </div>
      </div>
      <div className="col-md-4">
        <div className="acp-feature">
          <span className="acp-feature-icon"><i className="bi bi-cpu"></i></span>
          <h3>Smart Management</h3>
          <p>Admins and mechanics manage workshop operations digitally: job assignments, repair updates and inventory tracking.</p>
          <Link to="/my-repairs" className="acp-more-link">Track my repairs{' '}<i className="bi bi-arrow-right"></i></Link>
        </div>
      </div>
    </div>
  </div>
</section>

{/* ===== WHY CHOOSE US ===== */}
<section className="acp-section bg-white">
  <div className="container">
    <div className="text-center mb-5">
      <small className="acp-eyebrow">Why Choose Us</small>
      <h2 className="acp-page-title mt-2 mb-2">What Makes Us Different</h2>
    </div>
    <div className="row g-4">
      <div className="col-6 col-lg-3">
        <div className="acp-why">
          <span className="acp-why-icon"><i className="bi bi-clock-history"></i></span>
          <h3>Real-time Status</h3>
          <p>Track your repair from anywhere, anytime.</p>
        </div>
      </div>
      <div className="col-6 col-lg-3">
        <div className="acp-why">
          <span className="acp-why-icon"><i className="bi bi-shield-check"></i></span>
          <h3>Genuine Parts</h3>
          <p>All parts sourced from trusted suppliers.</p>
        </div>
      </div>
      <div className="col-6 col-lg-3">
        <div className="acp-why">
          <span className="acp-why-icon"><i className="bi bi-people-fill"></i></span>
          <h3>Skilled Mechanics</h3>
          <p>An experienced, specialized workshop team.</p>
        </div>
      </div>
      <div className="col-6 col-lg-3">
        <div className="acp-why">
          <span className="acp-why-icon"><i className="bi bi-globe2"></i></span>
          <h3>100% Online</h3>
          <p>Book, track and buy from any device.</p>
        </div>
      </div>
    </div>
  </div>
</section>

{/* ===== OUR VALUES ===== */}
<section className="acp-section">
  <div className="container">
    <div className="text-center mb-5">
      <small className="acp-eyebrow">Our Values</small>
      <h2 className="acp-page-title mt-2 mb-2">What We Stand For</h2>
      <p className="text-muted mb-0">Four principles guide everything we do at AutoCarePro.</p>
    </div>
    <div className="row g-4">
      <div className="col-md-6 col-lg-3">
        <div className="acp-value">
          <h3><i className="bi bi-patch-check-fill"></i>Integrity</h3>
          <p>We never recommend a repair you don't need. Our diagnostics are thorough and our quotes honest.</p>
        </div>
      </div>
      <div className="col-md-6 col-lg-3">
        <div className="acp-value">
          <h3><i className="bi bi-tools"></i>Expertise</h3>
          <p>Continuous training and top-tier tools for every job.</p>
        </div>
      </div>
      <div className="col-md-6 col-lg-3">
        <div className="acp-value">
          <h3><i className="bi bi-house-heart-fill"></i>Community</h3>
          <p>We're your neighbors. Supporting local families and businesses is at the heart of what we do.</p>
        </div>
      </div>
      <div className="col-md-6 col-lg-3">
        <div className="acp-value">
          <h3><i className="bi bi-check-circle-fill"></i>Reliability</h3>
          <p>On-time service you can count on, every time.</p>
        </div>
      </div>
    </div>
  </div>
</section>

{/* ===== TEAM ===== */}
<section className="acp-section bg-white">
  <div className="container">
    <div className="text-center mb-5">
      <small className="acp-eyebrow">Our Team</small>
      <h2 className="acp-page-title mt-2 mb-2">The People Behind the Wrenches</h2>
      <p className="text-muted mb-0">Meet the team building AutoCarePro.</p>
    </div>
    <div className="row g-4 justify-content-center">
      <div className="col-sm-6 col-lg-4">
        <div className="acp-team-card">
          <div className="acp-avatar mx-auto mb-3" aria-hidden="true">KL</div>
          <h3>Mrs. Kuenzang Lhamo</h3>
          <p>Diploma: CSN</p>
        </div>
      </div>
      <div className="col-sm-6 col-lg-4">
        <div className="acp-team-card">
          <div className="acp-avatar mx-auto mb-3" aria-hidden="true">UD</div>
          <h3>Mr. Ugyen Dorji</h3>
          <p>Diploma: CSN</p>
        </div>
      </div>
      <div className="col-sm-6 col-lg-4">
        <div className="acp-team-card">
          <div className="acp-avatar mx-auto mb-3" aria-hidden="true">CW</div>
          <h3>Mrs. Chungku Wangmo</h3>
          <p>Diploma: CSN</p>
        </div>
      </div>
    </div>
  </div>
</section>

{/* ===== CTA ===== */}
<section className="acp-cta">
  <div className="container">
    <h2 className="fw-bold">Ready to get started?</h2>
    <p className="mb-4">Whether it's a routine service or a major repair, we're here to help. Reach out to us today for a free estimate.</p>
    <div className="d-flex flex-wrap justify-content-center gap-3">
      <a href="mailto:chungkumo08@gmail.com" className="btn btn-brand-primary btn-lg">
        <i className="bi bi-envelope-fill me-1"></i>{' '}Email Us{' '}</a>
      <a href="https://wa.me/97517394436" target="_blank" rel="noopener" className="btn btn-brand-outline btn-lg">
        <i className="bi bi-whatsapp me-1"></i>{' '}WhatsApp{' '}</a>
    </div>
  </div>
</section>

{/* ===== FOOTER ===== */}

    </>
  )
}
