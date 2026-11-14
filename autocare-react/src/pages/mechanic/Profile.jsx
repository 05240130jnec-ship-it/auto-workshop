import { useRef, useState } from 'react'
import { fmtDate, initials } from '../../data/store.js'
import useSettings from '../../data/useSettings.js'
import { lines } from '../../data/content.js'
import { api } from '../../api.js'
import { useMechanic } from './MechanicContext.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import MTopbar from './MTopbar.jsx'
import { mt } from './texts.js'

// My profile — saved through PATCH /api/mechanic/profile and /api/mechanic/profile/password
// (name and login email are managed by the admin). The photo is saved in MySQL as text.

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
  const store = useMechanic()
  const { act, Q } = store
  const { toast } = useDialogs()
  const m = store.data.profile
  // Specialisations come from MySQL (set by the admin); keep my own one in the list too
  const settings = useSettings()
  const SPECS = [...new Set([...lines(settings && settings.specializations), m.specialization].filter(Boolean))]
  const [phone, setPhone] = useState(m.phone || '')
  const [pro, setPro] = useState({ specialization: m.specialization, experience: m.experience })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const jobs = Q.activeJobs()
  const fileBox = useRef(null)
  const [busyPhoto, setBusyPhoto] = useState(false)

  const setP = (k) => (e) => setPro({ ...pro, [k]: e.target.value })
  const setW = (k) => (e) => setPw({ ...pw, [k]: e.target.value })
  const saveProfile = (body, msg) => act(() => api('/mechanic/profile', { method: 'PATCH', body }), msg)

  function saveInfo() {
    if (!PHONE.test(phone.replace(/[\s-]/g, ''))) return toast('Please enter a valid Bhutan phone number, e.g. 17123456', 'error')
    saveProfile({ phone: phone.replace(/[\s-]/g, '') }, 'Phone number saved')
  }
  function savePro() {
    const years = Number(pro.experience)
    if (!Number.isInteger(years) || years < 0 || years > 60) return toast('Years of experience must be a whole number from 0 to 60', 'error')
    saveProfile({ specialization: pro.specialization, experience: Number(pro.experience) }, 'Professional details updated')
  }
  async function savePassword() {
    if (!pw.current) return toast('Please enter your current password', 'error')
    if (pw.next.length < 8 || !/[A-Za-z]/.test(pw.next) || !/\d/.test(pw.next)) return toast('New password: at least 8 characters, with a letter and a number', 'error')
    if (pw.next !== pw.confirm) return toast('New passwords do not match', 'error')
    // The backend checks the current password with bcrypt
    const ok = await act(() => api('/mechanic/profile/password', {
      method: 'PATCH', body: { currentPassword: pw.current, newPassword: pw.next },
    }), 'Password updated')
    if (ok) setPw({ current: '', next: '', confirm: '' })
  }
  function setAvailability(e) {
    const status = e.target.value
    // Open jobs would be stuck with me while I am away
    if (status === 'leave' && jobs > 0) {
      return toast(`You still have ${jobs} open job${jobs > 1 ? 's' : ''}. Finish them or ask the admin to give them to another mechanic first.`, 'error')
    }
    saveProfile({ status }, status === 'leave' ? 'Marked as on leave — the admin can see this' : status === 'busy' ? 'Marked as busy' : 'Marked as available')
  }

  // ----- Photo -----
  async function pickPhoto(e) {
    const file = e.target.files[0]
    e.target.value = ''                       // so the same file can be chosen again
    if (!file) return
    if (!file.type.startsWith('image/')) return toast('Please choose a picture (JPG or PNG).', 'error')
    if (file.size > 10 * 1024 * 1024) return toast('This picture is too big (10 MB at most).', 'error')
    setBusyPhoto(true)
    try {
      const photo = await shrinkPhoto(file)
      await saveProfile({ photo }, 'Profile photo updated')
    } catch (err) { toast(err.message, 'error') }
    setBusyPhoto(false)
  }
  async function removePhoto() {
    setBusyPhoto(true)
    await saveProfile({ photo: null }, 'Profile photo removed')
    setBusyPhoto(false)
  }

  return (
    <>
      <MTopbar title={mt(settings, 'mProfileTitle')} sub={mt(settings, 'mProfileText')} />

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="m-panel text-center">
            {/* Photo with a camera button (like the customer profile) */}
            <div className="mp-photo">
              {m.photo ? <img src={m.photo} alt="Profile" /> : <span>{initials(m.name)}</span>}
              {busyPhoto && <div className="mp-busy"><span className="spinner-border spinner-border-sm"></span></div>}
              <button type="button" className="mp-cam" onClick={() => fileBox.current.click()} disabled={busyPhoto}
                title={m.photo ? 'Change photo' : 'Add photo'} aria-label={m.photo ? 'Change photo' : 'Add photo'}>
                <i className="bi bi-camera-fill"></i>
              </button>
            </div>
            <input ref={fileBox} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickPhoto} />
            {m.photo && <button type="button" className="mp-remove" onClick={removePhoto} disabled={busyPhoto}>Remove photo</button>}
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>{m.name}</h3>
            <p className="text-muted small mb-3">{m.experience} years experience · Member since {m.joined ? new Date(m.joined).getFullYear() : '—'}</p>
            <div className="d-flex justify-content-center gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
              <span className="m-badge m-badge-complete">{m.specialization}</span>
              <span className="m-badge m-badge-progress">{jobs} active job{jobs === 1 ? '' : 's'}</span>
            </div>
            <hr />
            <label className="m-form-label text-start">Availability Status</label>
            <select className="m-form-control" value={m.status} onChange={setAvailability}>
              <option value="active">🟢 Available</option>
              <option value="busy">🟡 Busy</option>
              <option value="leave">🔴 On Leave</option>
            </select>
            <p className="small text-muted mt-2 mb-0">Joined {fmtDate(m.joined)}</p>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="m-panel mb-4">
            <div className="m-panel-head"><h3>{mt(settings, 'mProfInfo')}</h3></div>
            <div className="row g-3">
              <div className="col-md-6"><label className="m-form-label">Full Name</label><input type="text" className="m-form-control" value={m.name} disabled /></div>
              <div className="col-md-6"><label className="m-form-label">Email (used to log in)</label><input type="email" className="m-form-control" value={m.email} disabled /></div>
              <div className="col-md-6"><label className="m-form-label">Phone</label><input type="tel" className="m-form-control" maxLength={16} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>
            <p className="small text-muted mt-2 mb-0"><i className="bi bi-info-circle me-1"></i>{mt(settings, 'mProfNameNote')}</p>
            <button className="m-btn m-btn-primary mt-3" onClick={saveInfo}><i className="bi bi-check2"></i> Save Changes</button>
          </div>

          <div className="m-panel mb-4">
            <div className="m-panel-head"><h3>{mt(settings, 'mProfPro')}</h3></div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="m-form-label">Specialization</label>
                <select className="m-form-control" value={pro.specialization} onChange={setP('specialization')}>
                  {SPECS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-md-6"><label className="m-form-label">Years of Experience</label><input type="number" min={0} max={60} className="m-form-control" value={pro.experience} onChange={setP('experience')} /></div>
            </div>
            <button className="m-btn m-btn-primary mt-3" onClick={savePro}><i className="bi bi-check2"></i> Update Details</button>
          </div>

          <div className="m-panel">
            <div className="m-panel-head"><h3>{mt(settings, 'mProfPassword')}</h3></div>
            <div className="row g-3">
              <div className="col-md-6"><label className="m-form-label">Current Password</label><input type="password" className="m-form-control" placeholder="••••••••" value={pw.current} onChange={setW('current')} /></div>
              <div className="col-md-6"></div>
              <div className="col-md-6"><label className="m-form-label">New Password</label><input type="password" className="m-form-control" placeholder="••••••••" value={pw.next} onChange={setW('next')} /></div>
              <div className="col-md-6"><label className="m-form-label">Confirm Password</label><input type="password" className="m-form-control" placeholder="••••••••" value={pw.confirm} onChange={setW('confirm')} /></div>
            </div>
            <p className="small text-muted mt-2 mb-0">At least 8 characters, with a letter and a number</p>
            <button className="m-btn m-btn-primary mt-3" onClick={savePassword}><i className="bi bi-shield-lock"></i> Update Password</button>
          </div>
        </div>
      </div>
    </>
  )
}