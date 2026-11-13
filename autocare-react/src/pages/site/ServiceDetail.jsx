import { Link, useParams } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'
import useApi from '../../useApi.js'
import Loading from '../../ui/Loading.jsx'
import { nu } from '../../data/store.js'
import { lines, detailLink } from '../../data/content.js'

// One details page for EVERY service: /services/brake (old address) or /services/wheel-alignment.
// Title, price, text, points and pictures come from MySQL (admin → Website Content → Services).
export default function ServiceDetail() {
  const { key } = useParams()
  const svc = useApi('/content/services/' + key)
  const all = useApi('/content/services')
  const s = svc.data
  usePageTitle(s ? s.title : 'Service')

  const gallery = s ? lines(s.gallery) : []
  if (s && gallery.length === 0 && s.image) gallery.push(s.image)

  return (
    <>
      <div className="acp-subnav">
        <nav className="container acp-subnav-inner" aria-label="Services">
          <Link className="acp-subnav-link" to="/services">All Services</Link>
          {(all.data || []).map((x) => (
            <Link key={x.id} className={'acp-subnav-link' + (s && x.id === s.id ? ' active' : '')} to={detailLink(x)}>{x.title}</Link>
          ))}
        </nav>
      </div>

      <section className="acp-section">
        <div className="container">
          {!s ? (
            svc.error
              ? <div className="text-center py-5"><p className="text-muted">This service was not found.</p><Link to="/services" className="btn btn-brand-primary">See all services</Link></div>
              : <Loading />
          ) : (
            <div className="row g-4 g-lg-5 align-items-center">
              <div className="col-lg-6">
                <small className="acp-eyebrow">Our Services</small>
                <h1 className="acp-page-title mt-2 mb-2">{s.title}</h1>
                <p className="acp-service-price mb-3">from {nu(s.price)}</p>
                {s.intro && <p className="acp-lead">{s.intro}</p>}
                {lines(s.description || s.shortText).map((p, i) => <p className="text-muted" key={i}>{p}</p>)}
                {lines(s.points).length > 0 && (
                  <ul className="acp-ticks acp-ticks--single">
                    {lines(s.points).map((p, i) => <li key={i}><i className="bi bi-check-circle-fill"></i>{p}</li>)}
                  </ul>
                )}
                <div className="d-flex flex-wrap gap-3 mt-2">
                  <Link to={'/booking?service=' + s.slug} className="btn btn-brand-primary btn-lg">Book {s.title}{' '}<i className="bi bi-arrow-right ms-1"></i></Link>
                  <Link to="/services" className="btn btn-outline-secondary btn-lg acp-btn-ghost">All Services</Link>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="acp-service-gallery">
                  {gallery.slice(0, 3).map((src, i) => (
                    <img key={i} className={i === 0 ? 'acp-gallery-main' : undefined} src={src} alt={s.title} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="acp-cta">
        <div className="container">
          <h2 className="fw-bold">Ready to get started?</h2>
          <p className="mb-3">Whether it's a routine service or a major repair, we're here to help.</p>
          <Link to={'/booking?service=' + (s ? s.slug : '')} className="btn btn-brand-primary btn-lg">Book Now</Link>
        </div>
      </section>
    </>
  )
}
