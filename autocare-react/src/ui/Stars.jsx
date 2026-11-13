// Shows a title where the words between *stars* are orange:
//   <Stars text="Your Trusted *Auto Care* Partner" />  →  Your Trusted <span>Auto Care</span> Partner
export default function Stars({ text }) {
  return String(text || '').split('*').map((part, i) => (i % 2 ? <span key={i}>{part}</span> : part))
}
