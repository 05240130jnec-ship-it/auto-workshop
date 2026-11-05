import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { nu, fmtDate } from '../../data/store.js'
import useSettings from '../../data/useSettings.js'
import { cleanPlate, cleanVehicle, plateType, plateStartOk, formatPlate, PLATE_ERROR, VEHICLE_ERROR } from '../../data/vehicle.js'
import { offerFor, salePrice, lines } from '../../data/content.js'
import Loading from '../../ui/Loading.jsx'
import usePageTitle from '../../ui/usePageTitle.js'
import useApi from '../../useApi.js'
import { api } from '../../api.js'

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

// Booking form — saves the booking in MySQL through POST /api/repairs
export default function Booking() {
  usePageTitle('Book a Service')
  const [params] = useSearchParams()
  const navigate = useNavigate()

  // Services, prices and running offers come from MySQL (GET /api/content/services and /offers)
  const list = useApi('/content/services')
  const offerList = useApi('/content/offers')
  const services = list.data || []
  const [picked, setSlug] = useState(params.get('service') || 'brake-repair')
  const svc = services.find((b) => b.slug === picked) || services[0] || null
  const slug = svc ? svc.slug : ''
  const offer = svc ? offerFor(offerList.data, svc.slug) : null
  const price = svc ? salePrice(svc.price, offer) : 0

  // Vehicles this customer brought before (to pick quickly) — from GET /api/repairs
  const history = useApi('/repairs')
  const myVehicles = useMemo(() => {
    const m = {}
    ;(history.data || []).forEach((r) => { m[r.plate] = r })
    return Object.values(m).map((r) => ({ plate: r.plate, vehicle: r.vehicle, vehicleType: r.vehicleType || '' }))
  }, [history.data])

  const [vehicleType, setVehicleType] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [plate, setPlate] = useState('')
  const [problem, setProblem] = useState('')
  const [photos, setPhotos] = useState([])
  const [delivery, setDelivery] = useState('dropoff')

  // Calendar: this month, next month
  const now = new Date()
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const [date, setDate] = useState(iso(tomorrow.getDay() === 0 ? new Date(tomorrow.getTime() + 86400000) : tomorrow))
  const [pickedSlot, setSlot] = useState('')
  const [error, setError] = useState('')
  const [tried, setTried] = useState(false)   // show red boxes only after Confirm was pressed
  const vehicleBad = tried && !cleanVehicle(vehicle)
  const typeBad = tried && !vehicleType
  const [plateLeft, setPlateLeft] = useState(false)   // the customer has left the plate box
  // Plate box turns red:
  //  - straight away while typing, if it can not become a plate like BP-1-A1234
  //  - after leaving the box (or pressing Confirm), if it is not a full Bhutan plate
  const plateOk = !!cleanPlate(plate)
  const plateBad = (plate.trim() !== '' && !plateStartOk(plate)) || ((plateLeft || tried) && !plateOk)
  const [saving, setSaving] = useState(false)

  // Which slots are full on the chosen date — GET /api/repairs/slots?date=...
  // (loads again automatically every time the date changes)
  const slots = useApi('/repairs/slots?date=' + date)
  const taken = (t) => {
    const s = (slots.data || []).find((x) => x.time === t)
    return s ? s.full : false
  }
  // The time slots and cars per slot are set by the admin (Website Content → Booking)
  const slotTimes = (slots.data || []).map((x) => x.time)
  const slot = slotTimes.includes(pickedSlot) ? pickedSlot : (slotTimes.find((t) => !taken(t)) || '')
  const settings = useSettings()
  const PICKUP_FEE = settings ? Number(settings.pickupFee) || 0 : 0
  // Vehicle types come from MySQL (admin → Website Content → Lists)
  const vehicleTypes = lines(settings && settings.vehicleTypes)

  const firstDay = month.getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d))
  const canPrev = month > new Date(now.getFullYear(), now.getMonth(), 1)
  const canNext = month < new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const total = price + (delivery === 'pickup' ? PICKUP_FEE : 0)

  async function submit() {
    setError('')
    setTried(true)
    if (!vehicleType) return setError('Please choose your vehicle type.')
    if (!vehicle.trim() || !plate.trim()) return setError('Please enter your vehicle and plate number.')
    if (!cleanVehicle(vehicle)) return setError(VEHICLE_ERROR)
    if (!cleanPlate(plate)) return setError(PLATE_ERROR)
    if (problem.trim().length < 10) return setError('Please describe the problem in a little more detail.')
    if (!slot || taken(slot)) return setError('That time slot is full. Please choose another one.')

    setSaving(true)
    try {
      const data = await api('/repairs', {
        method: 'POST',
        body: {
          vehicleType,
          vehicle: cleanVehicle(vehicle),
          plate: cleanPlate(plate),          // tidy form, e.g. BP-1-A1234
          service: svc.serviceName,
          notes: problem.trim(),
          cost: total,
          apptDate: date,
          apptTime: slot,
          delivery,
        },
      })
      navigate('/confirm/' + data.id)          // e.g. /confirm/ACP-9252
    } catch (err) {
      setSaving(false)
      setError(err.message)                    // e.g. "That time slot is full..." from the backend
      slots.reload()                           // someone else may have just booked it
    }
  }

  // Wait until the services have loaded (or show the error)
  if (!svc) {
    return (
      <section className="acp-section">
        <div className="container">
          {list.loading ? <Loading /> : <Loading error={list.error || 'No services are available right now.'} onRetry={list.reload} />}
        </div>
      </section>
    )
  }

  return (
    <section className="acp-section">
      <div className="container">

        <div className="acp-steps">
          <div className="acp-step done"><span className="dot"><i className="bi bi-check"></i></span> Service</div>
          <div className="acp-step-connector"></div>
          <div className="acp-step active"><span className="dot">2</span> Details</div>
          <div className="acp-step-connector"></div>
          <div className="acp-step"><span className="dot">3</span> Confirm</div>
        </div>

        <div className="row g-4">
          <div className="col-lg-7">
            <div className="acp-card p-4 mb-4">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="badge" style={{ background: 'var(--brand-yellow)', color: '#fff' }}>SELECTED SERVICE</span>
                <span className="badge bg-light text-dark">Est. Price {nu(price)}</span>
              </div>
              <select className="form-select fw-bold mb-2" value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Service">
                {services.map((b) => <option key={b.slug} value={b.slug}>{b.title}</option>)}
              </select>
              <p className="text-muted mb-0">{svc.shortText}</p>
              {offer && <p className="small fw-bold mt-2 mb-0" style={{ color: 'var(--brand-yellow-dark)' }}><i className="bi bi-tag-fill me-1"></i>{offer.percent}% off this service {offer.endDate ? 'until ' + fmtDate(offer.endDate) : ''}</p>}
            </div>

            <div className="acp-card p-4 mb-4">
              <h3 className="h6 fw-bold mb-3">Your vehicle</h3>
              {myVehicles.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {myVehicles.map((v) => (
                    <button key={v.plate} type="button" className={'btn btn-sm ' + (plate === v.plate ? 'btn-brand-primary' : 'btn-outline-secondary' )}
                      onClick={() => { setVehicle(v.vehicle); setPlate(v.plate); if (vehicleTypes.includes(v.vehicleType)) setVehicleType(v.vehicleType) }}>
                      <i className="bi bi-car-front me-1"></i>{v.vehicle} · {v.plate}
                    </button>
                  ))}
                </div>
              )}
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold">Vehicle type</label>
                  <select className={'form-select' + (typeBad ? ' is-invalid' : '')} value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                    <option value="">Choose your vehicle type…</option>
                    {vehicleTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {typeBad && <div className="invalid-feedback">Please choose your vehicle type</div>}
                </div>
                <div className="col-md-7">
                  <label className="form-label small fw-bold">Make &amp; model</label>
                  <input className={'form-control' + (vehicleBad ? ' is-invalid' : '')} placeholder="e.g. Toyota Corolla 2018" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
                  {vehicleBad && <div className="invalid-feedback">Letters and numbers only, e.g. Toyota Corolla 2018</div>}
                </div>
                <div className="col-md-5">
                  <label className="form-label small fw-bold">Plate number</label>
                  <input className={'form-control' + (plateBad ? ' is-invalid' : plateOk ? ' is-valid' : '')} placeholder="e.g. BP-1-A1234" value={plate}
                    maxLength={12}
                    onChange={(e) => setPlate(formatPlate(e.target.value))}   // capital letters + hyphens by themselves
                    onBlur={() => { setPlateLeft(true); const p = cleanPlate(plate); if (p) setPlate(p) }} />
                  {plateBad
                    ? <div className="invalid-feedback">Must look like BP-1-A1234 (BP, BT, BG, RBP or RBG, one digit, then the number)</div>
                    : plateType(plate)
                      ? <div className="form-text">
                          {/* the vehicle type, in the colours of that plate */}
                          <span className="badge" style={{ color: plateType(plate).color, background: plateType(plate).bg }}>
                            {cleanPlate(plate).split('-')[0]}
                          </span>{' '}{plateType(plate).name}
                        </div>
                      : <div className="form-text">BP private · BT taxi · BG government · RBP police · RBG bodyguard</div>}
                </div>
              </div>
            </div>

            <div className="acp-card p-4 mb-4">
              <h3 className="h6 fw-bold mb-3">Describe the problem</h3>
              <textarea className="form-control" rows={5} value={problem} onChange={(e) => setProblem(e.target.value)}
                placeholder="e.g. The brakes are squeaking when I slow down at red lights. It started about three days ago..." />
            </div>

            <div className="acp-card p-4 mb-4">
              <h3 className="h6 fw-bold mb-3">Upload photos of the issue (Optional)</h3>
              <label className="d-block border border-2 rounded-3 text-center p-4 text-muted acp-dashed" style={{ cursor: 'pointer' }}>
                <i className="bi bi-camera fs-3 d-block mb-2"></i>
                Drag and drop photos here, or <span className="text-brand-purple fw-bold">browse files</span>
                <br /><small>PNG, JPG up to 10MB each</small>
                <input type="file" hidden multiple accept="image/*" onChange={(e) => setPhotos([...e.target.files])} />
              </label>
              {photos.length > 0 && (
                <ul className="small mt-2 mb-0">{photos.map((f) => <li key={f.name}>{f.name}</li>)}</ul>
              )}
            </div>

            <div className="acp-card p-4">
              <h3 className="h6 fw-bold mb-3">Delivery Preference</h3>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className={'acp-time-slot text-start p-3' + (delivery === 'dropoff' ? ' selected' : '')} onClick={() => setDelivery('dropoff')}>
                    <strong><i className="bi bi-truck me-1"></i> Drop-off</strong>
                    <p className="mb-0 small text-muted mt-1">Bring your vehicle to the workshop.</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className={'acp-time-slot text-start p-3' + (delivery === 'pickup' ? ' selected' : '')} onClick={() => setDelivery('pickup')}>
                    <strong><i className="bi bi-house-door me-1"></i> Home Pickup</strong>
                    <p className="mb-0 small text-muted mt-1">We'll pick up the vehicle. Extra {nu(PICKUP_FEE)}.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="acp-card p-4 acp-sticky">
              <h3 className="h6 fw-bold mb-3"><i className="bi bi-calendar-event me-1"></i> Schedule Appointment</h3>

              <div className="d-flex justify-content-between align-items-center fw-bold small mb-2">
                <button type="button" className="btn btn-sm btn-link text-dark p-0" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month"><i className="bi bi-chevron-left"></i></button>
                {month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                <button type="button" className="btn btn-sm btn-link text-dark p-0" disabled={!canNext} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month"><i className="bi bi-chevron-right"></i></button>
              </div>

              <div className="row row-cols-7 g-1 text-center small mb-3">
                {WEEK.map((w, i) => <div key={'w' + i} className="col text-muted fw-bold">{w}</div>)}
                {cells.map((d, i) => {
                  if (!d) return <div key={'e' + i} className="col"></div>
                  const past = d < new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
                  const sunday = d.getDay() === 0
                  const off = past || sunday
                  const sel = iso(d) === date
                  return (
                    <div key={i} className="col">
                      <button type="button" disabled={off} title={sunday ? 'Closed on Sundays' : ''}
                        className={'acp-day' + (sel ? ' selected' : '') + (off ? ' off' : '')}
                        onClick={() => setDate(iso(d))}>{d.getDate()}</button>
                    </div>
                  )
                })}
              </div>

              <h4 className="h6 fw-bold mb-2">Select a time slot {slots.loading && <span className="spinner-border spinner-border-sm ms-1"></span>}</h4>
              <div className="row g-2 mb-3">
                {slotTimes.map((t) => {
                  const full = taken(t)
                  return (
                    <div className="col-6" key={t}>
                      <div className={'acp-time-slot' + (slot === t && !full ? ' selected' : '') + (full ? ' disabled' : '')}
                        onClick={() => !full && setSlot(t)} title={full ? 'Fully booked' : ''}>
                        {t}{full && <small className="d-block">Full</small>}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="d-flex justify-content-between small mb-1"><span>{svc.title}</span><span>{nu(svc.price)}</span></div>
              {offer && <div className="d-flex justify-content-between small mb-1 text-success"><span>Offer: {offer.percent}% off</span><span>− {nu(svc.price - price)}</span></div>}
              {delivery === 'pickup' && <div className="d-flex justify-content-between small mb-1"><span>Home pickup</span><span>{nu(PICKUP_FEE)}</span></div>}
              <div className="d-flex justify-content-between fw-bold border-top pt-2 mb-3"><span>Estimated total</span><span>{nu(total)}</span></div>
              <p className="small text-muted">You pay at the workshop after the job is done.</p>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <button type="button" className="btn btn-brand-primary w-100 mb-2" onClick={submit} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm"></span> Booking…</> : <>Confirm Booking <i className="bi bi-arrow-right"></i></>}
              </button>
              <Link to="/services" className="d-block text-center small text-muted">
                <i className="bi bi-arrow-left"></i> Back to Services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}