import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { nu, fmtDate } from '../../data/store.js'
import { api } from '../../api.js'
import { useMechanic } from './MechanicContext.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import MTopbar from './MTopbar.jsx'

const SERVICE_TYPES = ['Brake Pad Replacement', 'Engine Diagnostics', 'Oil Change', 'Car Wash', 'Wheel Alignment', 'Battery Replacement', 'AC Service', 'General Labour']

// Repair detail: update status, write notes, log parts and services.
// Every button calls the backend; parts taken here come out of the inventory in MySQL.
export default function RepairDetail() {
  const { id } = useParams()
  usePageTitle('Repair ' + id)
  const store = useMechanic()
  const { Q, act } = store
  const { toast, confirm } = useDialogs()
  const navigate = useNavigate()
  const r = store.get('repairs', id)   // only jobs assigned to me are loaded
  const inventory = store.data.parts
  const url = '/mechanic/repairs/' + id

  const [note, setNote] = useState('')
  const [partId, setPartId] = useState(inventory.find((p) => p.stock > 0)?.id || '')
  const [partQty, setPartQty] = useState(1)
  const [svcType, setSvcType] = useState(SERVICE_TYPES[0])
  const [svcQty, setSvcQty] = useState(1)
  const [svcCost, setSvcCost] = useState(1500)

  if (!r) {
    return (
      <>
        <MTopbar title="Repair not found" sub="This job doesn't exist or isn't assigned to you." back="/mechanic/repairs" />
        <div className="m-panel text-center"><Link to="/mechanic/repairs" className="m-btn m-btn-primary">Back to my repairs</Link></div>
      </>
    )
  }

  const c = { name: r.customerName, phone: r.customerPhone }
  const locked = r.status === 'complete' || r.status === 'cancelled'
  const partsTotal = Q.partsTotal(r)
  const servicesTotal = Q.servicesTotal(r)
  const grand = partsTotal + servicesTotal

  function setStatus(status) {
    if (status === r.status) return
    act(() => api(url, { method: 'PATCH', body: { status } }),
      'Status changed to ' + (status === 'pending' ? 'Pending' : 'In Progress'))
  }

  async function complete() {
    const final = grand > 0 ? grand : r.cost
    const ok = await confirm(`Mark this job complete? The customer will be charged ${nu(final)}${grand > 0 ? ' (parts + services)' : ' (the estimate)'}.`, { title: 'Complete repair', okText: 'Mark complete' })
    if (!ok) return
    // The backend sets the bill to parts + services when the job is completed
    const done = await act(() => api(url, { method: 'PATCH', body: { status: 'complete' } }), r.vehicle + ' is ready for pickup 🎉')
    if (done) navigate('/mechanic/repairs')
  }

  async function addNote() {
    if (!note.trim()) return
    const ok = await act(() => api(url, { method: 'PATCH', body: { addNote: note.trim() } }), 'Note added')
    if (ok) setNote('')
  }

  async function addPart() {
    const p = store.get('parts', partId)
    const qty = Number(partQty)
    if (!p || qty < 1) return
    if (qty > p.stock) return toast(`Only ${p.stock} × ${p.name} left in stock`, 'error')
    // POST takes the parts out of the inventory in the same step
    const ok = await act(() => api(url + '/parts', { method: 'POST', body: { partId: p.id, qty } }),
      `${qty} × ${p.name} logged · stock now ${p.stock - qty}`)
    if (!ok) return
    setPartQty(1)
    if (p.stock - qty <= p.reorder) toast(p.name + ' is running low — admin has been alerted', 'warn')
  }

  function removePart(item) {
    act(() => api(url + '/parts/' + item.id, { method: 'DELETE' }), item.name + ' returned to stock', 'info')
  }

  function addService() {
    if (Number(svcQty) < 1 || Number(svcCost) < 0) return
    act(() => api(url + '/services', { method: 'POST', body: { name: svcType, qty: Number(svcQty), cost: Number(svcCost) } }),
      svcType + ' added')
  }

  function removeService(item) {
    act(() => api(url + '/services/' + item.id, { method: 'DELETE' }), item.name + ' removed', 'info')
  }

  return (
    <>
      <MTopbar title={`${r.vehicle} — ${r.plate}`} sub={`Repair order #${r.id} · ${c.name || 'Unknown'}`} back="/mechanic/repairs" />

      {locked && (
        <div className="m-panel mb-4" style={{ background: r.status === 'complete' ? '#f0fdf4' : '#f8fafc' }}>
          <i className={'bi me-2 ' + (r.status === 'complete' ? 'bi-check-circle-fill text-success' : 'bi-x-circle')}></i>
          {r.status === 'complete' ? `Completed on ${fmtDate(r.completedOn || r.due)} · charged ${nu(r.cost)}` : 'This job was cancelled.'}
        </div>
      )}

      <div className="row g-4">
        {/* LEFT: Repair info */}
        <div className="col-lg-5">
          <div className="m-panel mb-4">
            <div className="m-panel-head"><h3>Vehicle &amp; Customer</h3></div>
            <p className="mb-2"><strong>{r.vehicle}</strong></p>
            <p className="text-muted small mb-3">Plate: {r.plate} · {r.service}{r.priority !== 'normal' ? ' · ' + r.priority.toUpperCase() : ''}</p>
            <hr />
            <p className="mb-1"><strong>Customer:</strong> {c.name}</p>
            <p className="mb-1"><strong>Phone:</strong> <a href={'tel:' + (c.phone || '').replace(/\s/g, '')}>{c.phone}</a></p>
            <p className="mb-0"><strong>Due:</strong> {fmtDate(r.due)}{r.appointment ? ` · ${r.appointment.time} · ${r.appointment.delivery === 'pickup' ? 'Home pickup' : 'Drop-off'}` : ''}</p>
          </div>

          <div className="m-panel mb-4">
            <div className="m-panel-head"><h3>Problem Description</h3></div>
            <p className="text-muted small mb-0">{r.notes ? `"${r.notes}"` : 'No description given.'}</p>
          </div>

          {(r.workNotes || []).length > 0 && (
            <div className="m-panel">
              <div className="m-panel-head"><h3>Work Notes</h3></div>
              {r.workNotes.map((n, i) => <p key={i} className="small mb-2">{n}</p>)}
            </div>
          )}
        </div>

        {/* MIDDLE: Status */}
        <div className="col-lg-3">
          <div className="m-panel">
            <div className="m-panel-head"><h3>Update Status</h3></div>
            <button className={'m-btn w-100 mb-2 ' + (r.status === 'pending' ? 'm-btn-yellow' : 'm-btn-outline')} disabled={locked} onClick={() => setStatus('pending')}>
              <span className="m-dot m-dot-yellow"></span> Pending
            </button>
            <button className={'m-btn w-100 mb-2 ' + (r.status === 'progress' ? 'm-btn-primary' : 'm-btn-outline')} disabled={locked} onClick={() => setStatus('progress')}>
              <span className="m-dot" style={{ background: r.status === 'progress' ? '#fff' : 'var(--m-blue)' }}></span> In Progress
            </button>
            <button className={'m-btn w-100 mb-3 ' + (r.status === 'complete' ? 'm-btn-success' : 'm-btn-outline')} disabled={locked} onClick={complete}>
              <span className="m-dot m-dot-green"></span> Mark Complete
            </button>
            <label className="m-form-label">Add Note</label>
            <textarea className="m-form-control" rows={4} placeholder="Progress notes..." value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="m-btn m-btn-outline m-btn-sm w-100 mt-2" onClick={addNote} disabled={!note.trim()}><i className="bi bi-journal-plus"></i> Save note</button>
          </div>
        </div>

        {/* RIGHT: Log Parts + Services */}
        <div className="col-lg-4">
          <div className="m-panel mb-4">
            <div className="m-panel-head"><h3>Log Parts Used</h3></div>
            {!locked && (
              <>
                <label className="m-form-label">Select Part</label>
                <select className="m-form-control mb-3" value={partId} onChange={(e) => setPartId(e.target.value)}>
                  {inventory.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} — {nu(p.price)} ({p.stock > 0 ? p.stock + ' in stock' : 'out of stock'})
                    </option>
                  ))}
                </select>
                <label className="m-form-label">Quantity</label>
                <input type="number" className="m-form-control mb-3" min={1} value={partQty} onChange={(e) => setPartQty(e.target.value)} />
                <button className="m-btn m-btn-primary w-100 mb-3" onClick={addPart}><i className="bi bi-plus-circle"></i> Add Part</button>
                <hr />
              </>
            )}
            {(r.parts || []).length === 0 && <p className="small text-muted">No parts logged yet.</p>}
            {(r.parts || []).map((p) => (
              <div key={p.id} className="d-flex justify-content-between align-items-center mb-2 small">
                <span>{p.name} × {p.qty}</span>
                <span><strong>{nu(p.qty * p.price)}</strong>
                  {!locked && <button className="btn btn-link btn-sm text-danger p-0 ms-2" title="Remove" onClick={() => removePart(p)}><i className="bi bi-x-circle"></i></button>}
                </span>
              </div>
            ))}
            <div className="d-flex justify-content-between pt-2 mt-2" style={{ borderTop: '1px solid var(--m-border)' }}>
              <strong>Parts Total</strong><strong style={{ color: 'var(--m-purple)' }}>{nu(partsTotal)}</strong>
            </div>
          </div>

          <div className="m-panel">
            <div className="m-panel-head"><h3>Log Services</h3></div>
            {!locked && (
              <>
                <label className="m-form-label">Service Type</label>
                <select className="m-form-control mb-3" value={svcType} onChange={(e) => setSvcType(e.target.value)}>
                  {SERVICE_TYPES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <label className="m-form-label">Hours / Qty</label>
                <input type="number" className="m-form-control mb-3" min={1} value={svcQty} onChange={(e) => setSvcQty(e.target.value)} />
                <label className="m-form-label">Service Cost (Nu.)</label>
                <input type="number" className="m-form-control mb-3" min={0} step={50} value={svcCost} onChange={(e) => setSvcCost(e.target.value)} />
                <button className="m-btn m-btn-primary w-100 mb-3" onClick={addService}><i className="bi bi-plus-circle"></i> Add Service</button>
              </>
            )}
            {(r.services || []).map((s) => (
              <div key={s.id} className="d-flex justify-content-between align-items-center mb-2 small">
                <span>{s.name} × {s.qty}</span>
                <span><strong>{nu(s.qty * s.cost)}</strong>
                  {!locked && <button className="btn btn-link btn-sm text-danger p-0 ms-2" title="Remove" onClick={() => removeService(s)}><i className="bi bi-x-circle"></i></button>}
                </span>
              </div>
            ))}
            <div className="d-flex justify-content-between pt-2 mt-2" style={{ borderTop: '1px solid var(--m-border)' }}>
              <strong>Services Total</strong><strong style={{ color: 'var(--m-purple)' }}>{nu(servicesTotal)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="m-panel mt-4 d-flex justify-content-between align-items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <strong style={{ fontSize: '1.1rem' }}>Grand Total: </strong>
          <strong style={{ color: 'var(--m-purple)', fontSize: '1.2rem' }}>{nu(grand)}</strong>
          <span className="text-muted small ms-2">Estimate given to customer: {nu(r.cost)}</span>
        </div>
        <div>
          <Link to="/mechanic/repairs" className="m-btn m-btn-outline me-2">Back</Link>
          {!locked && <button className="m-btn m-btn-success" onClick={complete}><i className="bi bi-check2-circle"></i> Complete Repair</button>}
        </div>
      </div>
    </>
  )
}