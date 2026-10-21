import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext.js'
import { useStore, nu, today } from '../../data/store.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'

const EMPTY = { name: '', category: 'Auto Parts', condition: 'New', price: '', qty: 1, description: '' }

// Your sell-part.html form, now saving the listing for the admin to review
export default function SellPart() {
  usePageTitle('Sell a Spare Part')
  const { user } = useAuth()
  const store = useStore()
  const { toast } = useDialogs()
  const [f, setF] = useState(EMPTY)
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const mine = (store.data.listings || []).filter((l) => l.customerId === user.id)

  function submit(e) {
    e.preventDefault()
    setError('')
    if (!f.name.trim() || !f.price || !f.description.trim()) return setError('Please fill in the part name, price and description.')
    if (photos.length === 0) return setError('Please add at least 1 photo.')
    const id = store.nextId('listings', 'L-', 3)
    store.add('listings', { id, customerId: user.id, ...f, price: Number(f.price), qty: Number(f.qty), photos: photos.map((p) => p.name), status: 'review', date: today() })
    setF(EMPTY); setPhotos([])
    toast('Listing submitted — our team will review it soon')
  }

  return (
    <section className="acp-section">
      <div className="container" style={{ maxWidth: 720 }}>
        <h2 className="fw-bold mb-1">Sell a Spare Part</h2>
        <p className="text-muted mb-4">List a part you no longer need. Once submitted, our admin team will review and publish your listing.</p>

        <form className="acp-card p-4" onSubmit={submit} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-bold">Part Name</label>
            <input className="form-control" placeholder="e.g. Brake Pads (Front) — Toyota Corolla" value={f.name} onChange={set('name')} />
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-bold">Category</label>
              <select className="form-select" value={f.category} onChange={set('category')}>
                <option>Auto Parts</option>
                <option>Car Accessories</option>
                <option>Cleaning Product</option>
                <option>Emergency/Safety Items</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold">Condition</label>
              <select className="form-select" value={f.condition} onChange={set('condition')}>
                <option>New</option>
                <option>Like New</option>
                <option>Used - Good</option>
                <option>Used - Fair</option>
              </select>
            </div>
          </div>

          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <label className="form-label small fw-bold">Price (Nu.)</label>
              <input type="number" min={0} className="form-control" placeholder="e.g. 1200" value={f.price} onChange={set('price')} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold">Quantity Available</label>
              <input type="number" min={1} className="form-control" placeholder="e.g. 1" value={f.qty} onChange={set('qty')} />
            </div>
          </div>

          <div className="mt-3">
            <label className="form-label small fw-bold">Description</label>
            <textarea className="form-control" rows={4} value={f.description} onChange={set('description')}
              placeholder="Describe the part's fit (make/model/year), reason for selling, and any wear or defects." />
          </div>

          <div className="mt-3 mb-4">
            <label className="form-label small fw-bold">Photos</label>
            <label className="d-block border border-2 rounded-3 text-center p-4 text-muted acp-dashed" style={{ cursor: 'pointer' }}>
              <i className="bi bi-camera fs-3 d-block mb-2"></i>
              Drag and drop photos here, or <span className="text-brand-purple fw-bold">browse files</span>
              <br /><small>Add at least 1 photo — PNG, JPG up to 10MB each</small>
              <input type="file" hidden multiple accept="image/*" onChange={(e) => setPhotos([...e.target.files])} />
            </label>
            {photos.length > 0 && <ul className="small mt-2 mb-0">{photos.map((p) => <li key={p.name}>{p.name}</li>)}</ul>}
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <button className="btn btn-brand-primary w-100">Submit for Review <i className="bi bi-arrow-right"></i></button>
        </form>

        {mine.length > 0 && (
          <div className="acp-card p-0 overflow-hidden mt-4">
            <div className="table-responsive">
              <table className="table acp-table mb-0">
                <thead><tr><th>My listings</th><th>Price</th><th>Status</th></tr></thead>
                <tbody>
                  {mine.map((l) => (
                    <tr key={l.id}>
                      <td>{l.name}<br /><small className="text-muted">{l.category} · {l.condition}</small></td>
                      <td>{nu(l.price)}</td>
                      <td><span className={'acp-badge ' + (l.status === 'approved' ? 'completed' : l.status === 'rejected' ? 'review' : 'scheduled')}>
                        {l.status === 'approved' ? 'Published' : l.status === 'rejected' ? 'Rejected' : 'In review'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
