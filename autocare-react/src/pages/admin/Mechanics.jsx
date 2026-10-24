import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore, nu, relDate, today, SPECS } from '../../data/store.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import Avatar from './Avatar.jsx'
import useOnce from './useOnce.js'
import { Badge, Stat } from './parts.jsx'

export default function AdminMechanics() {
  usePageTitle('Mechanics')
  const store = useStore()
  const { Q } = store
  const { toast, confirm, form, view } = useDialogs()
  const [params] = useSearchParams()
  const [q, setQ] = useState('')
  const ms = store.data.mechanics
  const states = ms.map(Q.mechanicState)
  const query = q.trim().toLowerCase()
  const list = ms.filter((m) => !query || [m.id, m.name, m.specialization, m.phone, m.email].join(' ').toLowerCase().includes(query))

  const fields = [
    { name: 'name', label: 'Full name', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+975 17XXXXXX' },
    { name: 'email', label: 'Email (used to log in)', type: 'email', required: true, placeholder: 'name@autocare.bt' },
    { name: 'specialization', label: 'Specialization', type: 'select', required: true, options: SPECS },
    { name: 'experience', label: 'Experience (years)', type: 'number', min: 0, max: 50, required: true },
    { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Working' }, { value: 'busy', label: 'Busy' }, { value: 'leave', label: 'On leave' }], default: 'active' },
    { name: 'joined', label: 'Joined on', type: 'date', default: today() },
  ]
  const emailCheck = (id) => (v) => store.all('mechanics').some((m) => m.id !== id && (m.email || '').toLowerCase() === v.email.toLowerCase()) ? 'Another mechanic already uses that email' : null

  async function add() {
    const v = await form({ title: 'Add mechanic', fields: [...fields, { name: 'password', label: 'Temporary password', required: true, default: 'mech123', help: 'They log in at /login with their email and this password' }], submitText: 'Add mechanic', validate: emailCheck() })
    if (!v) return
    const res = await store.send('/mechanics', { method: 'POST', body: { ...v, email: v.email.toLowerCase() } })
    if (res) toast(<><b>{v.name}</b> joined the team as #{res.id}</>)
  }
  async function edit(m) {
    const v = await form({ title: 'Edit ' + m.name, fields, values: m, submitText: 'Save', validate: emailCheck(m.id) })
    if (!v) return
    if (v.status === 'leave' && m.status !== 'leave' && Q.activeJobs(m.id)) { toast('Use the Leave button so active jobs get handed back', 'warn'); v.status = m.status }
    const body = { name: v.name, phone: v.phone, email: v.email.toLowerCase(), specialization: v.specialization, experience: v.experience, status: v.status, joined: v.joined }
    if (await store.send('/mechanics/' + m.id, { method: 'PATCH', body })) toast('Saved')
  }
  async function toggleLeave(m) {
    const jobs = Q.activeJobs(m.id)
    if (m.status !== 'leave' && jobs) {
      const ok = await confirm(<>{m.name} still has {jobs} active job(s). Those jobs will go back to <b>Pending</b> so you can reassign them.</>, { title: 'Put on leave?', okText: 'Put on leave' })
      if (!ok) return
    }
    // Going on leave: the backend hands their open jobs back to Pending in the same step
    const res = await store.send('/mechanics/' + m.id, { method: 'PATCH', body: { status: m.status === 'leave' ? 'active' : 'leave' } })
    if (res) toast(m.name + (m.status === 'leave' ? ' is back at work' : ' is now on leave'), 'info')
  }
  async function del(m) {
    if (Q.activeJobs(m.id)) return toast(`Reassign ${m.name}'s ${Q.activeJobs(m.id)} active job(s) first`, 'warn')
    const ok = await confirm(<><b>{m.name}</b> will be removed from the team. Their completed jobs stay in the records.</>, { title: 'Remove mechanic?', okText: 'Remove', danger: true })
    if (ok && (await store.send('/mechanics/' + m.id, { method: 'DELETE' }))) toast(m.name + ' removed', 'info')
  }
  function jobs(m) {
    const list = store.data.repairs.filter((r) => r.mechanicId === m.id).sort((a, b) => b.date.localeCompare(a.date))
    view(m.name + ' — jobs', list.length ? (
      <table className="a-mini-table">
        <thead><tr><th>Job</th><th>Date</th><th>Vehicle</th><th>Service</th><th>Status</th><th className="text-end">Amount</th></tr></thead>
        <tbody>{list.map((r) => <tr key={r.id}><td><Link className="a-id" to={'/admin/repairs?open=' + r.id}>#{r.id}</Link></td><td>{relDate(r.date)}</td><td>{r.vehicle}<br /><small className="text-muted">{r.plate}</small></td><td>{r.service}</td><td><Badge status={r.status} /></td><td className="text-end">{nu(r.cost)}</td></tr>)}</tbody>
      </table>
    ) : <div className="a-empty"><i className="bi bi-inbox"></i><p>No jobs assigned yet.</p></div>)
  }

  useOnce(() => { if (params.get('new')) add() })

  return (
    <>
      <ATopbar title="Mechanics" sub="Your workshop team, their workload and availability" search={q} onSearch={setQ} placeholder="Search mechanics...">
        <button className="a-btn a-btn-primary" onClick={add}><i className="bi bi-plus-lg"></i> Add Mechanic</button>
      </ATopbar>

      <section className="a-stats">
        <Stat icon="bi-people" label="Team size" value={ms.length} foot="Mechanics on staff" />
        <Stat icon="bi-person-check" tone="green" label="Available" value={states.filter((s) => s.key === 'available').length} foot="Can take new jobs" />
        <Stat icon="bi-hourglass-split" tone="orange" label="Busy" value={states.filter((s) => s.key === 'busy').length} foot="3+ active jobs or marked busy" />
        <Stat icon="bi-gear-wide-connected" tone="blue" label="Jobs in progress" value={store.data.repairs.filter((r) => r.status === 'progress').length} foot="Across the workshop" />
      </section>

      <div className="a-cards">
        {list.length === 0 && <div className="a-panel"><div className="a-empty"><i className="bi bi-search"></i><p>No mechanics match your search.</p></div></div>}
        {list.map((m) => {
          const st = Q.mechanicState(m), active = Q.activeJobs(m.id), done = Q.completedJobs(m.id)
          const earned = store.data.repairs.filter((r) => r.mechanicId === m.id && r.status === 'complete').reduce((s, r) => s + r.cost, 0)
          const pct = Math.min(active * 25, 100)
          return (
            <div className={'a-mcard' + (st.key === 'leave' ? ' off' : '')} key={m.id}>
              <div className="a-mcard-head">
                <Avatar name={m.name} photo={m.photo} />
                <div style={{ flex: 1, minWidth: 0 }}><h4>{m.name}</h4><p>{m.specialization}</p><p>{m.phone}</p></div>
                <span className={'a-badge a-badge-' + st.cls}>{st.label}</span>
              </div>
              <div className="a-mcard-stats">
                <div><strong>{active}</strong><small>Active</small></div>
                <div><strong>{done}</strong><small>Done</small></div>
                <div><strong>{m.experience}y</strong><small>Exp.</small></div>
              </div>
              <div>
                <div className="d-flex justify-content-between small mb-1"><span className="text-muted">Workload</span><span className="fw-semibold">{pct}%</span></div>
                <div className="a-bar"><span style={{ width: pct + '%', background: active >= 3 ? '#ea580c' : 'var(--a-purple)' }}></span></div>
              </div>
              <div className="small text-muted">Login: <b className="text-dark">{m.email}</b><br />Revenue from completed jobs: <b className="text-dark">{nu(earned)}</b></div>
              <div className="a-mcard-foot">
                <button className="a-btn a-btn-outline a-btn-sm" onClick={() => jobs(m)}><i className="bi bi-list-task"></i> Jobs</button>
                <button className="a-btn a-btn-outline a-btn-sm" onClick={() => edit(m)}><i className="bi bi-pencil"></i> Edit</button>
                <button className="a-btn a-btn-outline a-btn-sm" onClick={() => toggleLeave(m)}>
                  {m.status === 'leave' ? <><i className="bi bi-person-check"></i> Back</> : <><i className="bi bi-calendar-x"></i> Leave</>}
                </button>
                <button className="a-icon-action danger" title="Remove" onClick={() => del(m)}><i className="bi bi-trash3"></i></button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
