// Converted from repairCar/services.html — same markup and classes as your HTML page
import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'
import useApi from '../../useApi.js'
import Loading from '../../ui/Loading.jsx'
import { nu } from '../../data/store.js'
import { detailLink } from '../../data/content.js'

export default function Services() {
  usePageTitle("Services")
  // Services and prices come from MySQL (admin → Website Content → Services)
  const list = useApi('/content/services')
  const services = list.data || []
  return (
    <>


<div className="acp-subnav">
  <nav className="container acp-subnav-inner" aria-label="Services">
      <Link className="acp-subnav-link active" to="/services">All Services</Link>
      {services.map((sv) => (
        <Link key={sv.id} className="acp-subnav-link" to={detailLink(sv)}>{sv.title}</Link>
      ))}
  </nav>
</div>

<section className="acp-section">
  <div className="container">
    <div className="acp-section-head">
      <small className="acp-eyebrow">Our Services</small>
      <h1 className="acp-page-title mt-2 mb-2">All Services</h1>
      <p className="text-muted mb-0">Pick a service to see the details, or book it straight away.</p>
    </div>
    {(list.loading || list.error) && <Loading error={list.error} onRetry={list.reload} />}
    <div className="row g-4">
      {services.map((sv) => (
        <div className="col-sm-6 col-lg-3" key={sv.id}>
          <article className="acp-service-card">
            <Link to={detailLink(sv)} className="acp-service-card-img"><img src={sv.image || '/media/engine/engine3.jpg'} alt={sv.title} /></Link>
            <div className="acp-service-card-body">
              <h3>{sv.title}</h3>
              <p className="acp-service-card-text">{sv.shortText}</p>
              <p className="acp-service-price">from {nu(sv.price)}</p>
              <div className="acp-service-card-actions">
                <Link to={'/booking?service=' + sv.slug} className="btn btn-brand-primary">Book Now</Link>
                <Link to={detailLink(sv)} className="acp-more-link">Details{' '}<i className="bi bi-arrow-right"></i></Link>
              </div>
            </div>
          </article>
        </div>
      ))}
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
