import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api.js'
import { useAuth } from '../../auth/AuthContext.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import useSettings from '../../data/useSettings.js'
import Loading from '../../ui/Loading.jsx'
import Stars from '../../ui/Stars.jsx'
import { fmtDate, initials } from '../../data/store.js'

// My profile (customers): details, profile photo and password.
// Everything is saved in MySQL through /api/profile (the photo too, as text).
// The title and text come from MySQL (admin → Website Content → Login & profile).

const NAME = /^[A-Za-z][A-Za-z .'-]{1,59}$/
const PHONE = /^(\+?975)?[1-8]\d{7}$/

// Makes the chosen picture small and square (320×320 JPG) before it is saved
function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read this file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('This file is not a picture.'))
      img.onload = () => {
        const size = 320
        const side = Math.min(img.width, img.height)          // cut the middle square
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function Profile() {
  usePageTitle('My Profile')
  const settings = useSettings() || {}
  const { updateUser } = useAuth()
  const { toast } = useDialogs()
  const fileBox = useRef(null)
  const navigate = useNavigate()

  const [me, setMe] = useState(null)          // my details from MySQL
  const [error, setError] = useState('')
  const [f, setF] = useState({ name: '', phone: '', address: '' })
  const [saving, setSaving] = useState('')    // 'all' while saving
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [show, setShow] = useState({ current: false, next: false, confirm: false })
  const [tried, setTried] = useState(false)    // show red boxes only after Save
  // A new photo is only shown here first; it is saved when 'Save changes' is pressed.
  //   undefined = no change, 'data:image/…' = new photo, null = remove the photo
  const [newPhoto, setNewPhoto] = useState(undefined)

  // Load my details — GET /api/profile
  useEffect(() => {
    api('/profile')
      .then((d) => { setMe(d); setF({ name: d.name || '', phone: d.phone || '', address: d.address || '' }) })
      .catch((e) => setError(e.message))
  }, [])

  if (!me) return <section className="acp-section"><div className="container"><Loading error={error} /></div></section>

  // Tell the navbar to show the new name / photo
  function changed(d) {
    setMe(d)
    updateUser({ name: d.name })
    window.dispatchEvent(new Event('profile-changed'))
  }

  // ----- Details + password: ONE form, ONE Save button -----
  const bad = {
    name: !NAME.test(f.name.trim()) ? 'Please enter your full name (letters and spaces only)' : '',
    // The phone may stay empty (e.g. after Google sign-up); if it is typed it must be a Bhutan number
    phone: f.phone.trim() && !PHONE.test(f.phone.replace(/[\s-]/g, '')) ? 'Bhutan number, 8 digits, e.g. 17123456' : '',
  }
  // The password is only changed when a NEW password is typed. (The browser sometimes fills in the
  // current password by itself; that alone must not force a password change.)
  const changingPw = !!(pw.next || pw.confirm)
  const pwBad = {
    current: changingPw && !pw.current ? 'Please enter your current password' : '',
    next: changingPw && (pw.next.length < 8 || !/[A-Za-z]/.test(pw.next) || !/\d/.test(pw.next)) ? 'At least 8 characters, with a letter and a number' : '',
    confirm: changingPw && pw.confirm !== pw.next ? 'The passwords do not match' : '',
  }
  const dirty = f.name !== (me.name || '') || f.phone !== (me.phone || '') || f.address !== (me.address || '')
  const photoChanged = newPhoto !== undefined
  const shownPhoto = photoChanged ? newPhoto : me.photo     // what the round picture shows now

  async function saveAll(e) {
    e.preventDefault()
    setTried(true)
    if (bad.name || bad.phone || pwBad.current || pwBad.next || pwBad.confirm) return
    if (!dirty && !changingPw && !photoChanged) return toast('Nothing to save', 'info')
    setSaving('all')
    try {
      if (dirty) {
        const d = await api('/profile', { method: 'PATCH', body: { ...f, phone: f.phone.replace(/[\s-]/g, '') } })
        changed(d)
        setF({ name: d.name || '', phone: d.phone || '', address: d.address || '' })
      }
      if (photoChanged) {
        changed(newPhoto
          ? await api('/profile/photo', { method: 'PUT', body: { photo: newPhoto } })
          : await api('/profile/photo', { method: 'DELETE' }))
        setNewPhoto(undefined)
      }
      if (changingPw) {
        await api('/profile/password', { method: 'PATCH', body: { current: pw.current, next: pw.next } })
        setPw({ current: '', next: '', confirm: '' })
      }
      setTried(false)
      toast('Your changes are saved')
    } catch (err) { toast(err.message, 'error') }
    setSaving('')
  }

  // ----- Photo: chosen here, saved with "Save changes" -----
  async function pickPhoto(e) {
    const file = e.target.files[0]
    e.target.value = ''                       // so the same file can be chosen again
    if (!file) return
    if (!file.type.startsWith('image/')) return toast('Please choose a picture (JPG or PNG).', 'error')
    if (file.size > 10 * 1024 * 1024) return toast('This picture is too big (10 MB at most).', 'error')
    try {
      setNewPhoto(await shrinkPhoto(file))
    } catch (err) { toast(err.message, 'error') }
  }
  function removePhoto() {
    setNewPhoto(null)
  }

  const pwBox = (k, label) => (
    <div className="mb-3">
      <label className="form-label small fw-bold" htmlFor={'pw-' + k}>{label}</label>
      <div className="acp-pf-pw">
        <input id={'pw-' + k} type={show[k] ? 'text' : 'password'} autoComplete="new-password"
          className={'form-control' + (tried && pwBad[k] ? ' is-invalid' : '')}
          value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} />
        <button type="button" onClick={() => setShow({ ...show, [k]: !show[k] })} aria-label={show[k] ? 'Hide password' : 'Show password'}>
          <i className={show[k] ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
        </button>
      </div>
      {tried && pwBad[k] && <div className="invalid-feedback d-block">{pwBad[k]}</div>}
    </div>
  )

  return (
    <>
      <section className="acp-hero2 acp-page-hero text-center">
        <div className="container">
          <h1 className="acp-hero2-title"><Stars text={settings.profileTitle || 'My *profile*'} /></h1>
          {settings.profileText && <p className="acp-hero2-text mx-auto mb-0">{settings.profileText}</p>}
        </div>
      </section>

      <section className="acp-section">
        <div className="container" style={{ maxWidth: 720 }}>
          <form className="acp-pf-card acp-pf-one" onSubmit={saveAll} noValidate>
            {/* Photo + name on top */}
            <div className="acp-pf-top">
              <div className="acp-pf-photo">
                {shownPhoto ? <img src={shownPhoto} alt="Profile" /> : <span>{initials(me.name)}</span>}
                                <button type="button" className="acp-pf-cam" onClick={() => fileBox.current.click()} disabled={saving === 'all'}
                  title={shownPhoto ? 'Change photo' : 'Add photo'} aria-label={shownPhoto ? 'Change photo' : 'Add photo'}>
                  <i className="bi bi-camera-fill"></i>
                </button>
              </div>
              <input ref={fileBox} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickPhoto} />
              <h2 className="acp-pf-name">{me.name}</h2>
              <p className="acp-pf-email">{me.email}</p>
              {me.joined && <p className="acp-pf-since">Customer since {fmtDate(String(me.joined).slice(0, 10))}</p>}
              {shownPhoto && <button type="button" className="acp-pf-link" onClick={removePhoto} disabled={saving === 'all'}>Remove photo</button>}
              {photoChanged && <p className="small text-muted mb-0 mt-1">Press <b>Save changes</b> to keep this photo.</p>}
            </div>

            {/* Details */}
            <h3 className="acp-pf-title">Personal details</h3>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold" htmlFor="pf-name">Full name</label>
                <input id="pf-name" className={'form-control' + (tried && bad.name ? ' is-invalid' : '')} maxLength={60}
                  value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                {tried && bad.name && <div className="invalid-feedback">{bad.name}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold" htmlFor="pf-phone">Phone number</label>
                <input id="pf-phone" type="tel" className={'form-control' + (tried && bad.phone ? ' is-invalid' : '')} maxLength={16}
                  value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
                {tried && bad.phone && <div className="invalid-feedback">{bad.phone}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold" htmlFor="pf-email">Email</label>
                <input id="pf-email" className="form-control" value={me.email} disabled />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold" htmlFor="pf-address">Address</label>
                <input id="pf-address" className="form-control" maxLength={200} autoComplete="street-address"
                  value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
              </div>
            </div>

            {/* Password (optional) */}
            <h3 className="acp-pf-title mt-4">Change password</h3>
            <div className="row g-3">
              <div className="col-md-4">{pwBox('current', 'Current password')}</div>
              <div className="col-md-4">{pwBox('next', 'New password')}</div>
              <div className="col-md-4">{pwBox('confirm', 'Confirm new password')}</div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-2">
              {/* Cancel: leave without saving and go back to the home page */}
              <button type="button" className="btn acp-pf-remove" disabled={saving === 'all'} onClick={() => navigate('/')}>
                Cancel
              </button>
              <button className="btn btn-brand-primary px-4" disabled={saving === 'all'}>
                {saving === 'all' ? <><span className="spinner-border spinner-border-sm"></span> Saving…</> : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
