import usePageTitle from '../../ui/usePageTitle.js'
import useSettings from '../../data/useSettings.js'
import Loading from '../../ui/Loading.jsx'
import { rows, gmailLink, whatsappLink } from '../../data/content.js'

// Contact page. Email, phone/WhatsApp, address, opening hours and the texts all come
// from MySQL (admin → Website Content → Contact & footer). The map shows the address.
export default function Contact() {
  usePageTitle('Contact')
  const s = useSettings()
  if (!s) return <section className="acp-section"><div className="container"><Loading /></div></section>

  const hours = rows(s.hours)
  const mapSrc = 'https://www.google.com/maps?q=' + encodeURIComponent(s.address || 'Bhutan') + '&output=embed'
  const mapLink = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.address || 'Bhutan')

  const cards = [
    { icon: 'bi-envelope-fill', title: 'Email us', text: "Send us an email and we'll get back to you within 24 hours.",
      value: s.email, href: gmailLink(s.email), link: 'Write an email' },
    { icon: 'bi-whatsapp', title: 'WhatsApp', text: 'Prefer instant messaging? Chat with us on WhatsApp.',
      value: s.phone, href: whatsappLink(s.whatsapp), link: 'Start a chat' },
    { icon: 'bi-geo-alt-fill', title: 'Visit our workshop', text: s.addressNote,
      value: s.address, href: mapLink, link: 'Get directions' },
  ]

  return (
    <>
      {/* ===== HEADER ===== */}
      <section className="acp-hero2 acp-page-hero acp-contact-hero text-center">
        <div className="container">
          <span className="acp-hero2-tag"><i className="bi bi-chat-dots-fill"></i>{' '}Contact</span>
          <h1 className="acp-hero2-title">Get in <span>touch</span> with us</h1>
          <p className="acp-hero2-text mx-auto mb-0">{s.contactIntro}</p>
        </div>
      </section>

      {/* ===== 3 WAYS TO REACH US ===== */}
      <section className="acp-section pb-4">
        <div className="container">
          <div className="row g-4">
            {cards.map((c) => (
              <div className="col-md-4" key={c.title}>
                <div className="acp-feature">
                  <span className="acp-feature-icon"><i className={'bi ' + c.icon}></i></span>
                  <h3>{c.title}</h3>
                  <p className="mb-2">{c.text}</p>
                  <p className="acp-contact-value">{c.value}</p>
                  <a href={c.href} target="_blank" rel="noopener" className="acp-more-link">{c.link}{' '}<i className="bi bi-arrow-right"></i></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOURS + MAP ===== */}
      <section className="acp-section pt-2">
        <div className="container">
          <div className="row g-4 align-items-stretch">
            <div className="col-lg-5">
              <div className="acp-hours-box h-100">
                <h3><span className="acp-feature-icon"><i className="bi bi-clock-fill"></i></span>Business hours</h3>
                <ul>
                  {hours.map(([day, time], i) => (
                    <li key={i}>
                      <span>{day}</span>
                      <strong className={/closed/i.test(time || '') ? 'is-closed' : ''}>{time}</strong>
                    </li>
                  ))}
                </ul>
                {s.hoursNote && <p className="acp-hours-box-note"><i className="bi bi-info-circle-fill"></i>{s.hoursNote}</p>}
              </div>
            </div>
            <div className="col-lg-7">
              <div className="acp-map h-100">
                <iframe title={'Map: ' + s.address} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
