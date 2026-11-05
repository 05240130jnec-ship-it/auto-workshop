// Converted from repairCar/index.html — same markup and classes as your HTML page
import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'
import useCarousel from '../../ui/useCarousel.js'
import useApi from '../../useApi.js'
import { nu, fmtDate } from '../../data/store.js'
import { lines, rows } from '../../data/content.js'
import useSettings from '../../data/useSettings.js'
import Stars from '../../ui/Stars.jsx'

export default function Home() {
  usePageTitle("Home")
  useCarousel('heroCarousel')

  // Offers (slideshow) and services (Popular Services) come from MySQL
  const offers = useApi('/content/offers').data || []
  const services = useApi('/content/services').data || []
  // Welcome slide + intro text come from MySQL (admin → Website Content → Home page)
  const s = useSettings() || {}
  const chip = rows(s.homeChip)[0] || []

  return (
    <>


{/* HERO SLIDESHOW (Bootstrap carousel) */}
<section id="heroCarousel" className="carousel slide carousel-fade acp-hero2" data-bs-ride="carousel" data-bs-interval="5000" data-bs-pause="false" aria-label="Featured">
  <div className="carousel-indicators">
    <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
    {offers.map((o, i) => (
      <button key={o.id} type="button" data-bs-target="#heroCarousel" data-bs-slide-to={i + 1} aria-label={'Slide ' + (i + 2)}></button>
    ))}
  </div>

  <div className="carousel-inner">

    {/* Slide 1: welcome */}
    <div className="carousel-item active">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <span className="acp-hero2-tag"><i className="bi bi-geo-alt-fill"></i>{' '}{s.homeTag}</span>
            <h1 className="acp-hero2-title"><Stars text={s.homeTitle} /></h1>
            <p className="acp-hero2-text">{s.homeText}</p>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/services" className="btn btn-brand-primary btn-lg">Book Your Service{' '}<i className="bi bi-arrow-right ms-1"></i></Link>
              <Link to="/shop" className="btn btn-lg acp-btn-outline-light">Shop Parts</Link>
            </div>
            <ul className="acp-hero2-points">
              {lines(s.homePoints).map((pt, k) => (
                <li key={k}><i className={'bi ' + ['bi-patch-check-fill', 'bi-shield-fill-check', 'bi-wrench-adjustable-circle-fill'][k % 3]}></i>{pt}</li>
              ))}
            </ul>
          </div>
          <div className="col-lg-6">
            <div className="acp-hero2-media">
              {s.homeImage && <img src={s.homeImage} alt="The AutoCarePro workshop" />}
              {chip[0] && (
                <div className="acp-hero2-chip">
                  <i className="bi bi-patch-check-fill"></i>
                  <div><strong>{chip[0]}</strong><span>{chip[1]}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Offer slides: one for each running offer (admin → Website Content → Offers) */}
    {offers.map((o) => (
      <div className="carousel-item" key={o.id}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="acp-hero2-tag"><i className="bi bi-clock-fill"></i>{' '}{o.tag || 'Limited time offer'}</span>
              <h2 className="acp-hero2-title">Get{' '}<span>{o.percent}% Off</span>{' '}{o.title}</h2>
              <p className="acp-hero2-text">
                {o.endDate && <>Book before{' '}<strong>{fmtDate(o.endDate)}</strong>{' '}and save.{' '}</>}
                {o.text}
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to={'/booking?service=' + (o.serviceSlug || '')} className="btn btn-brand-primary btn-lg">Book Now{' '}<i className="bi bi-arrow-right ms-1"></i></Link>
                {o.serviceTitle && <Link to={o.servicePage || '/services/' + o.serviceSlug} className="btn btn-lg acp-btn-outline-light">{o.serviceTitle} Details</Link>}
              </div>
              {lines(o.points).length > 0 && (
                <ul className="acp-hero2-points">
                  {lines(o.points).map((pt, k) => (
                    <li key={k}><i className={'bi ' + ['bi-tag-fill', 'bi-wrench-adjustable-circle-fill', 'bi-calendar-check-fill'][k % 3]}></i>{pt}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="col-lg-6">
              <div className="acp-hero2-media">
                <img src={o.image || '/media/banner1.jpg'} alt={o.title} />
                <span className="acp-offer-badge">{o.percent}%<small>OFF</small></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}

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
        <h2 className="fw-bold mt-2 mb-3">{s.introTitle}</h2>
        {lines(s.introText).map((p, k) => <p className="text-muted" key={k}>{p}</p>)}
        <ul className="acp-ticks">
          {lines(s.introTicks).map((t, k) => <li key={k}><i className="bi bi-check-circle-fill"></i>{t}</li>)}
        </ul>
        <Link to="/sell-part" className="btn btn-brand-yellow btn-lg mt-2">Sell a Spare Part{' '}<i className="bi bi-arrow-right ms-1"></i></Link>
      </div>
      <div className="col-lg-5">
        {s.introImage && <img src={s.introImage} className="img-fluid acp-intro-img" alt="Inside the AutoCarePro workshop" />}
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
      {services.map((sv) => (
        <div className="col-md-6 col-lg-3" key={sv.id}>
          <div className="acp-card h-100 text-center pb-3">
            <img className="card-img-top" src={sv.image || '/media/engine/engine3.jpg'} alt="" />
            <div className="p-3">
              <h3 className="h6 fw-bold mb-1">{sv.title}</h3>
              <p className="price mb-3">from {nu(sv.price)}</p>
              <Link to={'/booking?service=' + sv.slug} className="btn btn-brand-primary w-100">Book Now</Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

{/* FOOTER */}

    </>
  )
}
