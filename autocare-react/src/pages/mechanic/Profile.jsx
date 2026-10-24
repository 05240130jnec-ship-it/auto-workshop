import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext.js'
import { useStore, fmtDate, SPECS } from '../../data/store.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import MTopbar from './MTopbar.jsx'

// Your profile.html — every "Save" button saves to MySQL through the backend
export default function Profile() {
  usePageTitle('My Profile')
  const { user, updateUser } = useAuth()
  const store = useStore()
  const { toast } = useDialogs()
  const m = store.get('mechanics', user.id)
  const [info, setInfo] = useState({ name: m.name, email: m.email || '', phone: m.phone || '', dob: m.dob || '', address: m.address || '' })
  const [pro, setPro] = useState({ specialization: m.specialization, experience: m.experience })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const jobs = store.Q.activeJobs(m.id)

  const setI = (k) => (e) => setInfo({ ...info, [k]: e.target.value })
  const setP = (k) => (e) => setPro({ ...pro, [k]: e.target.value })
  const setW = (k) => (e) => setPw({ ...pw, [k]: e.target.value })

  async function saveInfo() {
    if (!info.name.trim()) return toast('Name cannot be empty', 'error')
    const body = { ...info, name: info.name.trim(), email: info.email.trim().toLowerCase() }
    if (!(await store.send('/mechanics/' + m.id, { method: 'PATCH', body }))) return
    updateUser({ name: body.name, email: body.email }) // so the sidebar shows the new name
    toast('Personal information saved')
  }
  async function savePro() {
    const body = { specialization: pro.specialization, experience: Number(pro.experience) }
    if (await store.send('/mechanics/' + m.id, { method: 'PATCH', body })) toast('Professional details updated')
  }
  async function savePassword() {
    if (pw.next.length < 6) return toast('New password must be at least 6 characters', 'error')
    if (pw.next !== pw.confirm) return toast('New passwords do not match', 'error')
    // The backend checks the current password (it is stored scrambled, so only it can check)
    if (!(await store.send('/auth/change-password', { method: 'POST', body: { current: pw.current, next: pw.next } }))) return
    setPw({ current: '', next: '', confirm: '' })
    toast('Password updated')
  }
  async function setAvailability(e) {
    const status = e.target.value
    if (!(await store.send('/mechanics/' + m.id, { method: 'PATCH', body: { status } }))) return
    toast(status === 'leave' ? 'Marked as on leave — the admin can see this' : status === 'busy' ? 'Marked as busy' : 'Marked as available')
  }

  return (
    <>
      <MTopbar title="My Profile" sub="Manage your mechanic profile and availability" />

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="m-panel text-center">
            <img src={m.photo || '/media/logo.jpg'} alt="Avatar"
              style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--m-orange)', margin: '0 auto 16px', boxShadow: '0 6px 20px rgba(212,217,40,0.35)', display: 'block' }} />
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
            <div className="m-panel-head"><h3>Personal Information</h3></div>
            <div className="row g-3">
              <div className="col-md-6"><label className="m-form-label">Full Name</label><input type="text" className="m-form-control" value={info.name} onChange={setI('name')} /></div>
              <div className="col-md-6"><label className="m-form-label">Email (used to log in)</label><input type="email" className="m-form-control" value={info.email} onChange={setI('email')} /></div>
              <div className="col-md-6"><label className="m-form-label">Phone</label><input type="tel" className="m-form-control" value={info.phone} onChange={setI('phone')} /></div>
              <div className="col-md-6"><label className="m-form-label">Date of Birth</label><input type="date" className="m-form-control" value={info.dob} onChange={setI('dob')} /></div>
              <div className="col-12"><label className="m-form-label">Address</label><input type="text" className="m-form-control" value={info.address} onChange={setI('address')} placeholder="e.g. Thimphu, Bhutan" /></div>
            </div>
            <button className="m-btn m-btn-primary mt-3" onClick={saveInfo}><i className="bi bi-check2"></i> Save Changes</button>
          </div>

          <div className="m-panel mb-4">
            <div className="m-panel-head"><h3>Professional Details</h3></div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="m-form-label">Specialization</label>
                <select className="m-form-control" value={pro.specialization} onChange={setP('specialization')}>
                  {SPECS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-md-6"><label className="m-form-label">Years of Experience</label><input type="number" min={0} className="m-form-control" value={pro.experience} onChange={setP('experience')} /></div>
            </div>
            <button className="m-btn m-btn-primary mt-3" onClick={savePro}><i className="bi bi-check2"></i> Update Details</button>
          </div>

          <div className="m-panel">
            <div className="m-panel-head"><h3>Change Password</h3></div>
            <div className="row g-3">
              <div className="col-md-6"><label className="m-form-label">Current Password</label><input type="password" className="m-form-control" placeholder="••••••••" value={pw.current} onChange={setW('current')} /></div>
              <div className="col-md-6"></div>
              <div className="col-md-6"><label className="m-form-label">New Password</label><input type="password" className="m-form-control" placeholder="••••••••" value={pw.next} onChange={setW('next')} /></div>
              <div className="col-md-6"><label className="m-form-label">Confirm Password</label><input type="password" className="m-form-control" placeholder="••••••••" value={pw.confirm} onChange={setW('confirm')} /></div>
            </div>
            <button className="m-btn m-btn-primary mt-3" onClick={savePassword}><i className="bi bi-shield-lock"></i> Update Password</button>
          </div>
        </div>
      </div>
    </>
  )
}
