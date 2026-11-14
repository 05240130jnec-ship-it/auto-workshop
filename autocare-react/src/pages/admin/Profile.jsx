import { useRef, useState } from 'react'
import { api } from '../../api.js'
import { useAuth } from '../../auth/AuthContext.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import Avatar from './Avatar.jsx'
import { useAdmin } from './AdminContext.js'

// Admin → My profile: my name, phone, photo and password.
// Saved in MySQL through /api/admin/profile (the photo too, as text).
// The login email is not changed here.

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

export default function AdminProfile() {
  usePageTitle('My Profile')
  const { user, updateUser } = useAuth()
  const { data, act } = useAdmin()
  const { toast } = useDialogs()
  const me = data.profile || {}
  const fileBox = useRef(null)

  const [f, setF] = useState({ name: me.name || '', phone: me.phone || '' })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [busyPhoto, setBusyPhoto] = useState(false)

  const save = (body, msg) => act(() => api('/admin/profile', { method: 'PATCH', body }), msg)

  async function saveDetails(e) {
    e.preventDefault()
    const name = f.name.trim().replace(/\s+/g, ' ')
    const phone = f.phone.replace(/[\s-]/g, '')
    if (!NAME.test(name)) return toast('Please enter your full name (letters and spaces only)', 'error')
    if (phone && !PHONE.test(phone)) return toast('Please enter a valid Bhutan phone number, e.g. 17123456', 'error')
    if (await save({ name, phone }, 'Your details are saved')) updateUser({ name })
  }

  async function savePassword(e) {
    e.preventDefault()
    if (!pw.current) return toast('Please enter your current password', 'error')
    if (pw.next.length < 8 || !/[A-Za-z]/.test(pw.next) || !/\d/.test(pw.next)) return toast('New password: at least 8 characters, with a letter and a number', 'error')
    if (pw.next !== pw.confirm) return toast('The new passwords do not match', 'error')
    const ok = await act(() => api('/admin/profile/password', { method: 'PATCH', body: { currentPassword: pw.current, newPassword: pw.next } }), 'Your password is changed')
    if (ok) setPw({ current: '', next: '', confirm: '' })
  }

  async function pickPhoto(e) {
    const file = e.target.files[0]
    e.target.value = ''                       // so the same file can be chosen again
    if (!file) return
    if (!file.type.startsWith('image/')) return toast('Please choose a picture (JPG or PNG).', 'error')
    if (file.size > 10 * 1024 * 1024) return toast('This picture is too big (10 MB at most).', 'error')
    setBusyPhoto(true)
    try {
      await save({ photo: await shrinkPhoto(file) }, 'Profile photo updated')
    } catch (err) { toast(err.message, 'error') }
    setBusyPhoto(false)
  }
  async function removePhoto() {
    setBusyPhoto(true)
    await save({ photo: null }, 'Profile photo removed')
    setBusyPhoto(false)
  }

  const pwBox = (k, label, auto) => (
    <div className="col-md-4">
      <label className="a-form-label" htmlFor={'apw-' + k}>{label}</label>
      <input id={'apw-' + k} type={show ? 'text' : 'password'} className="a-form-control" autoComplete={auto}
        value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} />
    </div>
  )

  return (
    <>
      <ATopbar title="My Profile" sub="Your details, photo and password" />

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="a-panel text-center">
            <div className="ap-photo">
              <Avatar name={me.name || user.name} photo={me.photo} size={120} />
              {busyPhoto && <div className="ap-busy"><span className="spinner-border spinner-border-sm"></span></div>}
              <button type="button" className="ap-cam" onClick={() => fileBox.current.click()} disabled={busyPhoto}
                title={me.photo ? 'Change photo' : 'Add photo'} aria-label={me.photo ? 'Change photo' : 'Add photo'}>
                <i className="bi bi-camera-fill"></i>
              </button>
            </div>
            <input ref={fileBox} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickPhoto} />
            {me.photo && <button type="button" className="ap-remove" onClick={removePhoto} disabled={busyPhoto}>Remove photo</button>}
            <h3 className="ap-name">{me.name || user.name}</h3>
            <p className="text-muted small mb-2">{user.email}</p>
            <span className="a-badge a-badge-complete">Administrator</span>
          </div>
        </div>

        <div className="col-lg-8">
          <form className="a-panel mb-4" onSubmit={saveDetails} noValidate>
            <div className="a-panel-head"><h3>Personal details</h3></div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="a-form-label" htmlFor="ap-name">Full name</label>
                <input id="ap-name" className="a-form-control" maxLength={60} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="a-form-label" htmlFor="ap-phone">Phone</label>
                <input id="ap-phone" type="tel" className="a-form-control" maxLength={16} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="a-form-label" htmlFor="ap-email">Email</label>
                <input id="ap-email" className="a-form-control" value={user.email} disabled />
              </div>
            </div>
            <button className="a-btn a-btn-primary mt-3"><i className="bi bi-check2"></i> Save changes</button>
          </form>

          <form className="a-panel" onSubmit={savePassword} noValidate>
            <div className="a-panel-head">
              <h3>Change password</h3>
              <button type="button" className="ap-show" onClick={() => setShow(!show)}>
                <i className={show ? 'bi bi-eye-slash' : 'bi bi-eye'}></i> {show ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="row g-3">
              {pwBox('current', 'Current password', 'current-password')}
              {pwBox('next', 'New password', 'new-password')}
              {pwBox('confirm', 'Confirm new password', 'new-password')}
            </div>
            <p className="a-form-help mt-2 mb-0">At least 8 characters, with a letter and a number</p>
            <button className="a-btn a-btn-primary mt-3"><i className="bi bi-shield-lock"></i> Change password</button>
          </form>
        </div>
      </div>
    </>
  )
}
