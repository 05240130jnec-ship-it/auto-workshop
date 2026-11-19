import { useState } from 'react'
import { api } from '../../api.js'
import { fmtDate, daysAgo } from '../../data/store.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import useSettings from '../../data/useSettings.js'
import { useMechanic } from './MechanicContext.js'
import MTopbar from './MTopbar.jsx'
import { mt } from './texts.js'

// My Leave (/mechanic/leave): the mechanic asks the admin for leave and sees the answer.
// Saved in MySQL (leave_requests) through /api/mechanic/leaves. When the admin approves it,
// the mechanic shows as "On leave" from the first day and his open jobs go back to the admin.
const LEAVE_STATUS = {
  pending: ['m-badge-pending', 'Waiting for admin'],
  approved: ['m-badge-complete', 'Approved'],
  rejected: ['m-badge-cancelled', 'Not approved'],
  finished: ['m-badge-progress', 'Finished'],
  cancelled: ['m-badge-cancelled', 'Cancelled'],
}
const days = (l) => (new Date(l.toDate) - new Date(l.fromDate)) / 86400000 + 1

export default function MechanicLeave() {
  usePageTitle('My Leave')
  const { data, act } = useMechanic()
  const { confirm, toast } = useDialogs()
  const s = useSettings()
  const tomorrow = daysAgo(-1)
  const [f, setF] = useState({ fromDate: tomorrow, toDate: tomorrow, reason: '' })
  const leaves = data.leaves || []
  const jobs = data.repairs.filter((r) => r.status === 'pending' || r.status === 'progress').length

  async function send(e) {
    e.preventDefault()
    if (!f.fromDate || !f.toDate) return toast('Please choose the first and the last day', 'error')
    if (f.toDate < f.fromDate) return toast('The last day must be on or after the first day', 'error')
    if (f.reason.trim().length < 3) return toast('Please write a short reason', 'error')
    const ok = await act(() => api('/mechanic/leaves', { method: 'POST', body: { ...f, reason: f.reason.trim() } }),
      'Leave request sent — the admin will answer soon')
    if (ok) setF({ fromDate: tomorrow, toDate: tomorrow, reason: '' })
  }

  async function cancel(l) {
    const yes = await confirm(`Take back your leave request for ${fmtDate(l.fromDate)} – ${fmtDate(l.toDate)}?`, { title: 'Cancel request?', okText: 'Yes, cancel', danger: true })
    if (yes) act(() => api('/mechanic/leaves/' + l.id, { method: 'DELETE' }), 'Leave request cancelled', 'info')
  }

  return (
    <>
      <MTopbar title={mt(s, 'mLeaveTitle')} sub={mt(s, 'mLeaveText')} />

      <div className="row g-4">
        <div className="col-lg-5">
          <form className="m-panel" onSubmit={send} noValidate>
            <div className="m-panel-head"><h3><i className="bi bi-calendar2-plus"></i> Ask for leave</h3></div>
            {data.profile.status === 'leave' && <p className="small mb-3" style={{ color: '#b45309' }}><i className="bi bi-info-circle"></i> You are on leave now.</p>}
            <div className="row g-3">
              <div className="col-6">
                <label className="m-form-label" htmlFor="lv-from">First day</label>
                <input id="lv-from" type="date" className="m-form-control" min={daysAgo(0)} value={f.fromDate}
                  onChange={(e) => setF({ ...f, fromDate: e.target.value, toDate: f.toDate < e.target.value ? e.target.value : f.toDate })} />
              </div>
              <div className="col-6">
                <label className="m-form-label" htmlFor="lv-to">Last day</label>
                <input id="lv-to" type="date" className="m-form-control" min={f.fromDate || daysAgo(0)} value={f.toDate}
                  onChange={(e) => setF({ ...f, toDate: e.target.value })} />
              </div>
              <div className="col-12">
                <label className="m-form-label" htmlFor="lv-reason">Reason</label>
                <textarea id="lv-reason" className="m-form-control" rows={3} maxLength={300} placeholder="e.g. Family function in Trashigang"
                  value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })}></textarea>
              </div>
            </div>
            {jobs > 0 && <p className="small text-muted mt-2 mb-0"><i className="bi bi-wrench-adjustable"></i> You have {jobs} open job{jobs > 1 ? 's' : ''}. If they are not finished when your leave starts, the admin gives them to another mechanic.</p>}
            <button className="m-btn m-btn-primary w-100 mt-3"><i className="bi bi-send"></i> Send to admin</button>
          </form>
        </div>

        <div className="col-lg-7">
          <div className="m-panel">
            <div className="m-panel-head"><h3><i className="bi bi-clock-history"></i> My leave requests</h3></div>
            <div style={{ overflowX: 'auto' }}>
              <table className="m-table">
                <thead><tr><th>Dates</th><th>Reason</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {leaves.length === 0 && <tr><td colSpan={4} className="text-center text-muted py-4">No leave requests yet.</td></tr>}
                  {leaves.map((l) => {
                    const [cls, label] = LEAVE_STATUS[l.status] || ['m-badge-pending', l.status]
                    return (
                      <tr key={l.id}>
                        <td><strong>{fmtDate(l.fromDate)}</strong>{l.toDate !== l.fromDate && <> – <strong>{fmtDate(l.toDate)}</strong></>}
                          <br /><small className="text-muted">{days(l)} day{days(l) > 1 ? 's' : ''} · asked {fmtDate(l.date)}</small></td>
                        <td style={{ maxWidth: 240 }}>{l.reason}{l.adminNote && <><br /><small className="text-muted">Admin: {l.adminNote}</small></>}</td>
                        <td><span className={'m-badge ' + cls}>{label}</span></td>
                        <td>{l.status === 'pending' && <button type="button" className="m-btn m-btn-outline" style={{ padding: '4px 10px', fontSize: '.8rem' }} onClick={() => cancel(l)}>Cancel</button>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
