import { useState } from 'react'
import { nu } from '../../data/store.js'
import { useDialogs } from '../../ui/DialogContext.js'
import useSettings from '../../data/useSettings.js'
import { fillText } from '../../data/content.js'
import usePageTitle from '../../ui/usePageTitle.js'
import useApi from '../../useApi.js'
import { api } from '../../api.js'

const EMPTY = { name: '', category: 'Auto Parts', condition: 'New', price: '', qty: 1, description: '' }
const STATUS = {
  review: ['scheduled', 'In review'],
  approved: ['completed', 'Accepted'],
  rejected: ['review', 'Not accepted'],
  bought: ['completed', 'Bought'],
}
const NOTE = {
  review: 'Our team will look at it soon.',
  approved: 'The workshop wants to buy it — we will call you.',
  rejected: 'Sorry, the workshop cannot buy this part.',
  bought: 'Bought by the workshop — thank you!',
}

// Makes a photo smaller (max 900 px wide, JPG) and gives it back as text, so it can be saved in MySQL
function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error(file.name + ' is not a picture.'))
    if (file.size > 10 * 1024 * 1024) return reject(new Error(file.name + ' is too big (10 MB at most).'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read ' + file.name))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error(file.name + ' is not a picture.'))
      img.onload = () => {
        const scale = Math.min(1, 900 / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// Sell a part to the workshop — saved through POST /api/shop/listings.
// The admin looks at it and accepts it (the workshop buys it and calls the customer) or rejects it.
export default function SellPart() {
  usePageTitle('Sell a Spare Part')
  const { confirm, notice } = useDialogs()
  const settings = useSettings() || {}
  const [f, setF] = useState(EMPTY)
  const [photos, setPhotos] = useState([])      // pictures as text, ready to send (3 at most)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const listings = useApi('/shop/listings')     // my listings
  const mine = listings.data || []

  async function pickPhotos(e) {
    const files = [...e.target.files].slice(0, 3 - photos.length)
    e.target.value = ''                        // so the same file can be chosen again
    if (!files.length) return setError('You can add 3 photos at most.')
    setError('')
    try {
      const pics = []
      for (const file of files) pics.push(await shrinkPhoto(file))
      setPhotos((old) => [...old, ...pics].slice(0, 3))
    } catch (err) {
      setError(err.message)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!f.name.trim() || !f.price || !f.description.trim()) return setError('Please fill in the part name, price and description.')
    if (photos.length === 0) return setError('Please add at least 1 photo.')
    const sure = await confirm(fillText(settings.askSell, { name: f.name.trim(), qty: f.qty, price: nu(Number(f.price)) }),
      { title: settings.askSellTitle || 'Send this part to the workshop?', okText: 'Yes, send it' })
    if (!sure) return

    setSaving(true)
    try {
      await api('/shop/listings', {
        method: 'POST',
        body: {
          name: f.name.trim(),
          category: f.category,
          condition: f.condition,
          price: Number(f.price),
          qty: Number(f.qty),
          description: f.description.trim(),
          photos,
        },
      })
      const partName = f.name.trim()
      setF(EMPTY)
      setPhotos([])
      listings.reload()
      setSaving(false)
      await notice(settings.msgSoldTitle || 'Part sent to the workshop!', fillText(settings.msgSold, { name: partName }))
      return                                   // saving is already finished
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <section className="acp-section">
      <div className="container" style={{ maxWidth: 720 }}>
        <h2 className="fw-bold mb-1">Sell a Spare Part</h2>
        <p className="text-muted mb-4">Have a part you no longer need? Offer it to the workshop. Our team will look at it, and if we want to buy it, we will call you.</p>

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
              Click to <span className="text-brand-purple fw-bold">choose photos</span>
              <br /><small>1 to 3 photos — PNG or JPG, up to 10 MB each</small>
              <input type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={pickPhotos} />
            </label>
            {photos.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {photos.map((src, i) => (
                  <div key={i} className="position-relative">
                    <img src={src} alt={'Photo ' + (i + 1)} style={{ width: 110, height: 82, objectFit: 'cover', borderRadius: 8 }} />
                    <button type="button" className="btn btn-sm btn-dark position-absolute top-0 end-0 m-1 py-0 px-1" aria-label="Remove photo"
                      onClick={() => setPhotos(photos.filter((_, k) => k !== i))}><i className="bi bi-x"></i></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <button className="btn btn-brand-primary w-100" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm"></span> Submitting…</> : <>Submit for Review <i className="bi bi-arrow-right"></i></>}
          </button>
        </form>

        {mine.length > 0 && (
          <div className="acp-card p-0 overflow-hidden mt-4">
            <div className="table-responsive">
              <table className="table acp-table mb-0">
                <thead><tr><th>My listings</th><th>Price</th><th>Status</th></tr></thead>
                <tbody>
                  {mine.map((l) => (
                    <tr key={l.id}>
                      <td>{l.name}<br /><small className="text-muted">{l.category} · {l.item_condition}</small></td>
                      <td>{nu(l.price)}</td>
                      <td><span className={'acp-badge ' + STATUS[l.status][0]}>{STATUS[l.status][1]}</span>
                        <br /><small className="text-muted">{NOTE[l.status]}</small></td>
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
