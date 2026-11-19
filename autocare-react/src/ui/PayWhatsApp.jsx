import useSettings from '../data/useSettings.js'
import { nu } from '../data/store.js'

// "Pay via WhatsApp": opens WhatsApp to the workshop number with the payment message already written.
// The customer pays with mBoB / mPay and sends the screenshot there; the admin then clicks "Mark as paid".
// The number, the payment text and the message come from Website Content → Contact & footer.
//   <PayWhatsApp amount={1500} what="booking #ACP-1023 (Brake Repair)" />
export default function PayWhatsApp({ amount, what, small }) {
  const s = useSettings() || {}
  const number = String(s.whatsapp || '').replace(/\D/g, '')
  if (!number) return null
  const message = (s.payMessage || 'Hello, I want to pay {amount} for {what}.')
    .replace('{amount}', nu(amount)).replace('{what}', what)
  const link = 'https://wa.me/' + number + '?text=' + encodeURIComponent(message)
  return (
    <a href={link} target="_blank" rel="noreferrer" className={'btn btn-success ' + (small ? 'btn-sm' : '')} title={s.payText || ''}>
      <i className="bi bi-whatsapp"></i> Pay via WhatsApp
    </a>
  )
}

// The short "how to pay" text (from Website Content)
export function PayInfo() {
  const s = useSettings() || {}
  if (!s.payText) return null
  return <p className="small text-muted mb-2"><i className="bi bi-info-circle"></i> {s.payText}</p>
}
