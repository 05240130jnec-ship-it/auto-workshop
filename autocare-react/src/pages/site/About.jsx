// About page — every text, picture, card and team member comes from MySQL
// (admin → Website Content → About page). Same markup and classes as before.
import { Link } from 'react-router-dom'
import usePageTitle from '../../ui/usePageTitle.js'
import useSettings from '../../data/useSettings.js'
import Loading from '../../ui/Loading.jsx'
import Stars from '../../ui/Stars.jsx'
import { lines, rows, gmailLink, whatsappLink } from '../../data/content.js'
import { initials } from '../../data/store.js'

export default function About() {
  usePageTitle('About Us')
  const s = useSettings()
  if (!s) return <section className="acp-section"><div className="container"><Loading /></div></section>

  const story = lines(s.storyText)
  const pillars = rows(s.pillars)
  const whyUs = rows(s.whyUs)
  const values = rows(s.values)
  const team = rows(s.team)
  const firstHours = rows(s.hours)[0]

  return (
    <>
      {/* ===== HERO — WHO WE ARE ===== */}
      <section className="acp-hero2 acp-page-hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="acp-hero2-tag"><i className="bi bi-people-fill"></i>{' '}Who we are</span>
              <h1 className="acp-hero2-title"><Stars text={s.aboutTitle} /></h1>
              <p className="acp-hero2-text">{s.aboutText}</p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/services" className="btn btn-brand-primary btn-lg">Our Services{' '}<i className="bi bi-arrow-right ms-1"></i></Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="acp-hero2-media">
                <img src={s.aboutImage} alt="The AutoCarePro workshop" />
                <div className="acp-hero2-chip">
                  <i className="bi bi-geo-alt-fill"></i>
                  <div><strong>{s.address}</strong><span>{firstHours ? firstHours.join(': ') : ''}</span></div>
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
              <img src={s.storyImage} className="acp-photo" alt="Inside the AutoCarePro workshop" />
            </div>
            <div className="col-lg-7">
              <small className="acp-eyebrow">Our Story</small>
              <h2 className="acp-page-title mt-2 mb-4">{s.storyTitle}</h2>
              {story.map((p, i) => <p key={i} className={'text-muted' + (i === story.length - 1 ? ' mb-0' : '')}>{p}</p>)}
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHAT WE OFFER ===== */}
      {pillars.length > 0 && (
        <section className="acp-section">
          <div className="container">
            <div className="text-center mb-5">
              <small className="acp-eyebrow">What We Offer</small>
              <h2 className="acp-page-title mt-2 mb-2">Core Pillars</h2>
              <p className="text-muted mb-0">The things that power every AutoCarePro workshop.</p>
            </div>
            <div className="row g-4">
              {pillars.map(([icon, title, text, link, linkText], i) => (
                <div className="col-md-4" key={i}>
                  <div className="acp-feature">
                    <span className="acp-feature-icon"><i className={'bi ' + (icon || 'bi-star-fill')}></i></span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                    {link && <Link to={link} className="acp-more-link">{linkText || 'Learn more'}{' '}<i className="bi bi-arrow-right"></i></Link>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== WHY CHOOSE US ===== */}
      {whyUs.length > 0 && (
        <section className="acp-section bg-white">
          <div className="container">
            <div className="text-center mb-5">
              <small className="acp-eyebrow">Why Choose Us</small>
              <h2 className="acp-page-title mt-2 mb-2">What Makes Us Different</h2>
            </div>
            <div className="row g-4">
              {whyUs.map(([icon, title, text], i) => (
                <div className="col-6 col-lg-3" key={i}>
                  <div className="acp-why">
                    <span className="acp-why-icon"><i className={'bi ' + (icon || 'bi-star-fill')}></i></span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== OUR VALUES ===== */}
      {values.length > 0 && (
        <section className="acp-section">
          <div className="container">
            <div className="text-center mb-5">
              <small className="acp-eyebrow">Our Values</small>
              <h2 className="acp-page-title mt-2 mb-2">What We Stand For</h2>
              <p className="text-muted mb-0">The principles that guide everything we do at AutoCarePro.</p>
            </div>
            <div className="row g-4">
              {values.map(([icon, title, text], i) => (
                <div className="col-md-6 col-lg-3" key={i}>
                  <div className="acp-value">
                    <h3><i className={'bi ' + (icon || 'bi-star-fill')}></i>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== TEAM ===== */}
      {team.length > 0 && (
        <section className="acp-section bg-white">
          <div className="container">
            <div className="text-center mb-5">
              <small className="acp-eyebrow">Our Team</small>
              <h2 className="acp-page-title mt-2 mb-2">The People Behind the Wrenches</h2>
              <p className="text-muted mb-0">Meet the team building AutoCarePro.</p>
            </div>
            <div className="row g-4 justify-content-center">
              {team.map(([name, role], i) => (
                <div className="col-sm-6 col-lg-4" key={i}>
                  <div className="acp-team-card">
                    <div className="acp-avatar mx-auto mb-3" aria-hidden="true">{initials(name)}</div>
                    <h3>{name}</h3>
                    <p>{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA ===== */}
      <section className="acp-cta">
        <div className="container">
          <h2 className="fw-bold">{s.ctaTitle}</h2>
          <p className="mb-4">{s.ctaText}</p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <a href={gmailLink(s.email)} target="_blank" rel="noopener" className="btn btn-brand-primary btn-lg">
              <i className="bi bi-envelope-fill me-1"></i>{' '}Email Us{' '}</a>
            <a href={whatsappLink(s.whatsapp)} target="_blank" rel="noopener" className="btn btn-brand-outline btn-lg">
              <i className="bi bi-whatsapp me-1"></i>{' '}WhatsApp{' '}</a>
          </div>
        </div>
      </section>
    </>
  )
}
