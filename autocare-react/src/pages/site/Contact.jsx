// Converted from repairCar/contact.html — same markup and classes as your HTML page
import usePageTitle from '../../ui/usePageTitle.js'

export default function Contact() {
  usePageTitle("Contact")
  return (
    <>


{/* ===== CONTACT HEADER ===== */}
<section className="acp-contact-head text-center">
  <div className="container">
    <small className="acp-eyebrow">Contact</small>
    <h2 className="fw-bold mt-2 mb-3">Get in touch with us</h2>
    <p className="text-muted mx-auto mb-0" style={{ maxWidth: "560px" }}>We are here to help with any questions about our services, repairs, or parts. Reach out and we will respond promptly.</p>
  </div>
</section>

{/* ===== CONTACT CARDS ===== */}
<section className="pb-5">
  <div className="container" style={{ maxWidth: "1080px" }}>
    <div className="row g-4 align-items-stretch">

      {/* Left: ways to reach us */}
      <div className="col-lg-7 d-flex flex-column gap-4">
        <div className="acp-contact-card">
          <span className="acp-contact-icon"><i className="bi bi-envelope-fill"></i></span>
          <div>
            <h4 className="h5 fw-bold mb-1">Email us</h4>
            <p className="text-muted mb-2">Send us an email and we'll get back within 24 hours.</p>
            <a href="mailto:chungmo06@gmail.com" className="acp-contact-link">chungmo06@gmail.com{' '}<i className="bi bi-arrow-right"></i></a>
          </div>
        </div>

        <div className="acp-contact-card">
          <span className="acp-contact-icon acp-contact-icon--green"><i className="bi bi-whatsapp"></i></span>
          <div>
            <h4 className="h5 fw-bold mb-1">WhatsApp</h4>
            <p className="text-muted mb-2">Prefer instant messaging? Chat with us on WhatsApp.</p>
            <a href="https://wa.me/97517394436" target="_blank" rel="noopener" className="acp-contact-link">+975 17394436{' '}<i className="bi bi-arrow-right"></i></a>
          </div>
        </div>

        <div className="acp-contact-card">
          <span className="acp-contact-icon"><i className="bi bi-geo-alt-fill"></i></span>
          <div>
            <h4 className="h5 fw-bold mb-1">Visit our shop</h4>
            <p className="fw-semibold mb-1">Sarpang, Bhutan</p>
            <p className="text-muted mb-0">Located in the heart of the city. Drop by during business hours.</p>
          </div>
        </div>
      </div>

      {/* Right: business hours */}
      <div className="col-lg-5">
        <div className="acp-hours-card h-100">
          <h4 className="h5 fw-bold mb-4"><i className="bi bi-clock-fill me-2"></i>Business hours</h4>
          <div className="acp-hours-row"><span>Monday – Friday</span><span>8:00 AM – 6:00 PM</span></div>
          <div className="acp-hours-row"><span>Saturday</span><span>8:00 AM – 6:00 PM</span></div>
          <div className="acp-hours-row acp-hours-row--closed"><span>Sunday</span><span>Closed</span></div>
          <p className="acp-hours-note mb-0">We aim to respond within 24 hours on business days. For urgent matters, reach us on WhatsApp.</p>
          <a href="https://wa.me/97517394436" target="_blank" rel="noopener" className="btn btn-brand-primary w-100 mt-4"><i className="bi bi-whatsapp me-2"></i>Chat on WhatsApp</a>
        </div>
      </div>

    </div>
  </div>
</section>


    </>
  )
}
