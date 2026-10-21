import { initials } from '../../data/store.js'

const HUES = [248, 210, 160, 25, 330, 280, 190]

// Round avatar: photo if there is one, otherwise coloured initials
export default function Avatar({ name, photo, size }) {
  const s = size ? { width: size, height: size } : {}
  if (photo) return <div className="a-avatar a-avatar-img" style={s}><img src={photo} alt="" /></div>
  const h = HUES[[...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length]
  return <div className="a-avatar" style={{ background: `hsl(${h},60%,52%)`, ...s }}>{initials(name)}</div>
}
