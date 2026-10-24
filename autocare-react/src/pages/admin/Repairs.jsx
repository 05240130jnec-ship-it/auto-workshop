import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore, nu, fmtDate, relDate, today, daysAgo, SERVICES } from '../../data/store.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import Avatar from './Avatar.jsx'
import useOnce from './useOnce.js'
import { Badge, Priority, Tabs, EmptyRow, IconBtn, TableCard } from './parts.jsx'

const STATUSES = [['pending', 'Pending'], ['progress', 'In Progress'], ['complete', 'Complete'], ['cancelled', 'Cancelled']]
const statusLabel = (s) => STATUSES.find((x) => x[0] === s)[1]

// Repairs — create jobs, assign mechanics, move jobs through their status.
// Every change is saved in MySQL with store.send(...) → /api/repairs
export default function AdminRepairs() {
  usePageTitle('Manage Repairs')
  const store = useStore()
  const { Q } = store
  const { toast, confirm, form, view, closeView } = useDialogs()
  const [params] = useSearchParams()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState(params.get('q') || '')

  const all = store.data.repairs
  const query = q.trim().toLowerCase()
  const rows = all
    .filter((r) => filter === 'all' || r.status === filter)
    .filter((r) => !query || [r.id, r.vehicle, r.plate, r.service, Q.customerName(r.customerId), Q.mechanicName(r.mechanicId)].join(' ').toLowerCase().includes(query))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))

  async function setStatus(id, status) {
    const r = store.get('repairs', id)
    if (status === 'progress' && !r.mechanicId) { toast('Assign a mechanic before starting the job', 'warn'); return false }
    if (!(await store.send('/repairs/' + id, { method: 'PATCH', body: { status } }))) return false
    toast(<>#{id} marked as <b>{statusLabel(status)}</b></>)
    return true
  }

  async function assign(r, mechanicId) {
    if (!mechanicId) {
      if (await store.send('/repairs/' + r.id, { method: 'PATCH', body: { mechanic_id: null, status: 'pending' } })) toast('#' + r.id + ' unassigned', 'info')
      return
    }
    const body = { mechanic_id: mechanicId }
    if (r.status === 'pending') body.status = 'progress'
    if (await store.send('/repairs/' + r.id, { method: 'PATCH', body })) {
      toast(<>#{r.id} assigned to <b>{Q.mechanicName(mechanicId)}</b>{body.status ? ' · now In Progress' : ''}</>)
    }
  }

  const fields = () => [
    { name: 'customerId', label: 'Customer', type: 'select', required: true, empty: 'Select customer…', options: store.all('customers').map((c) => ({ value: c.id, label: `${c.name} — ${c.phone}` })) },
    { name: 'service', label: 'Service', type: 'select', required: true, empty: 'Select service…', options: SERVICES },
    { name: 'vehicle', label: 'Vehicle (make & model)', required: true, placeholder: 'e.g. Toyota Corolla' },
    { name: 'plate', label: 'Plate number', required: true, placeholder: 'e.g. BP-1-A1234', help: 'Format: BP-1-A1234' },
    { name: 'mechanicId', label: 'Assign mechanic', type: 'select', empty: 'Assign later', options: store.all('mechanics').filter((m) => m.status !== 'leave').map((m) => ({ value: m.id, label: `${m.name} — ${m.specialization} (${Q.activeJobs(m.id)} jobs)` })) },
    { name: 'priority', label: 'Priority', type: 'select', options: [{ value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }], default: 'normal' },
    { name: 'date', label: 'Booked on', type: 'date', required: true, default: today() },
    { name: 'due', label: 'Promised by', type: 'date', required: true, default: daysAgo(-1) },
    { name: 'cost', label: 'Estimated cost (Nu.)', type: 'number', min: 0, step: 50, required: true },
    { name: 'status', label: 'Status', type: 'select', options: STATUSES.map(([value, label]) => ({ value, label })), default: 'pending' },
    { name: 'notes', label: 'Customer complaint / notes', type: 'textarea', col: 12, placeholder: 'What did the customer report?' },
  ]
  const validate = (v) => {
    if (v.due < v.date) return "The promised date can't be before the booking date"
    if (v.status === 'progress' && !v.mechanicId) return 'Assign a mechanic to mark the job In Progress'
    return null
  }

  async function addJob() {
    const v = await form({ title: 'New repair job', fields: fields(), submitText: 'Create job', validate })
    if (!v) return
    const res = await store.send('/repairs', {
      method: 'POST',
      body: { customer_id: v.customerId, mechanic_id: v.mechanicId || null, vehicle: v.vehicle, plate: v.plate, service: v.service, priority: v.priority, due: v.due, cost: v.cost, notes: v.notes },
    })
    if (!res) return
    // The backend starts a job as pending (or in progress with a mechanic); finish/cancel it if asked
    if (v.status === 'complete' || v.status === 'cancelled') await store.send('/repairs/' + res.id, { method: 'PATCH', body: { status: v.status } })
    setFilter('all')
    toast(<>Job <b>#{res.id}</b> created for {Q.customerName(v.customerId)}</>)
  }

  async function editJob(r) {
    const v = await form({ title: 'Edit job #' + r.id, fields: fields(), values: { ...r, mechanicId: r.mechanicId || '' }, submitText: 'Save changes', validate })
    if (!v) return
    const body = { customer_id: v.customerId, mechanic_id: v.mechanicId || null, vehicle: v.vehicle, plate: v.plate, service: v.service, priority: v.priority, due: v.due, cost: v.cost, notes: v.notes || '' }
    if (v.status !== r.status) body.status = v.status
    if (await store.send('/repairs/' + r.id, { method: 'PATCH', body })) toast('Job #' + r.id + ' updated')
  }

  async function completeJob(r) {
    const logged = Q.partsTotal(r) + Q.servicesTotal(r)
    const v = await form({
      title: 'Complete job #' + r.id, size: 'sm', submitText: 'Mark complete', values: { cost: logged || r.cost },
      fields: [{ name: 'cost', label: 'Final amount charged (Nu.)', type: 'number', min: 0, step: 50, required: true, col: 12, help: `Estimate was ${nu(r.cost)}${logged ? ` · mechanic logged ${nu(logged)}` : ''}` }],
    })
    if (!v) return
    if (await store.send('/repairs/' + r.id, { method: 'PATCH', body: { cost: v.cost, status: 'complete' } })) toast(`#${r.id} completed · ${nu(v.cost)} charged`)
  }

  async function deleteJob(r) {
    const ok = await confirm(<>Job <b>#{r.id}</b> will be permanently removed.</>, { title: 'Delete this job?', okText: 'Delete', danger: true })
    if (ok && (await store.send('/repairs/' + r.id, { method: 'DELETE' }))) toast('Job #' + r.id + ' deleted', 'info')
  }

  function viewJob(id) {
    const r = store.get('repairs', id)
    if (!r) return
    const c = Q.customer(r.customerId) || {}
    const m = Q.mechanic(r.mechanicId)
    const idx = ['pending', 'progress', 'complete'].indexOf(r.status)
    const history = all.filter((x) => x.plate === r.plate && x.id !== r.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
    const act = async (status) => { if (await setStatus(r.id, status)) closeView() }
    view(<>Job <span className="a-id">#{r.id}</span></>, (
      <>
        {r.status === 'cancelled'
          ? <div className="a-note mb-3" style={{ borderColor: '#fca5a5', color: '#b91c1c' }}><i className="bi bi-x-circle"></i> This job was cancelled.</div>
          : <div className="a-steps">{['Booked', 'In progress', 'Complete'].map((s, i) => <div key={s} className={i <= idx ? 'done' : ''}>{s}</div>)}</div>}
        <div className="a-detail-grid">
          <div><span>Vehicle</span><strong>{r.vehicle}</strong><br /><small className="text-muted">{r.plate}</small></div>
          <div><span>Customer</span><strong>{c.name}</strong><br /><small className="text-muted">{c.phone}</small></div>
          <div><span>Service</span><strong>{r.service}</strong><Priority p={r.priority} /></div>
          <div><span>Mechanic</span><strong>{m ? m.name : <span className="text-warning">Not assigned</span>}</strong></div>
          <div><span>Booked</span><strong>{fmtDate(r.date)}</strong></div>
          <div><span>{r.appointment ? 'Appointment' : 'Promised by'}</span><strong>{r.appointment ? `${fmtDate(r.appointment.date)}, ${r.appointment.time}` : fmtDate(r.due)}</strong>{r.appointment && <><br /><small className="text-muted">{r.appointment.delivery === 'pickup' ? 'Home pickup' : 'Drop-off'} · booked online</small></>}</div>
          <div><span>Status</span><Badge status={r.status} /></div>
          <div><span>{r.status === 'complete' ? 'Amount charged' : 'Estimate'}</span><strong>{nu(r.cost)}</strong></div>
        </div>
        {r.notes && <><div className="a-section-title">Notes</div><div className="a-note mb-3">{r.notes}</div></>}
        {(r.workNotes || []).length > 0 && <><div className="a-section-title">Mechanic notes</div><div className="a-note mb-3">{r.workNotes.map((n, i) => <div key={i}>{n}</div>)}</div></>}
        {((r.parts || []).length > 0 || (r.services || []).length > 0) && (
          <>
            <div className="a-section-title">Parts &amp; services logged</div>
            <table className="a-mini-table mb-3"><tbody>
              {(r.parts || []).map((p, i) => <tr key={'p' + i}><td><i className="bi bi-box-seam me-1"></i>{p.name} × {p.qty}</td><td className="text-end">{nu(p.qty * p.price)}</td></tr>)}
              {(r.services || []).map((s, i) => <tr key={'s' + i}><td><i className="bi bi-tools me-1"></i>{s.name} × {s.qty}</td><td className="text-end">{nu(s.qty * s.cost)}</td></tr>)}
            </tbody></table>
          </>
        )}
        <div className="a-section-title">Previous visits for {r.plate}</div>
        {history.length ? (
          <table className="a-mini-table">
            <thead><tr><th>Job</th><th>Date</th><th>Service</th><th>Status</th><th className="text-end">Cost</th></tr></thead>
            <tbody>{history.map((h) => <tr key={h.id}><td className="a-id">#{h.id}</td><td>{fmtDate(h.date)}</td><td>{h.service}</td><td><Badge status={h.status} /></td><td className="text-end">{nu(h.cost)}</td></tr>)}</tbody>
          </table>
        ) : <p className="text-muted small mb-0">First visit for this vehicle.</p>}
      </>
    ), (
      <>
        {r.status === 'pending' && <>
          <button className="a-btn a-btn-outline" onClick={() => act('cancelled')}>Cancel job</button>
          <button className="a-btn a-btn-primary" onClick={() => act('progress')}><i className="bi bi-play-fill"></i> Start job</button>
        </>}
        {r.status === 'progress' && <button className="a-btn a-btn-success" onClick={() => { closeView(); completeJob(r) }}><i className="bi bi-check2-circle"></i> Mark complete</button>}
      </>
    ))
  }

  useOnce(() => {
    if (params.get('new')) addJob()
    if (params.get('open')) viewJob(params.get('open'))
  })

  const tabs = [['all', 'All', all.length], ...STATUSES.map(([k, l]) => [k, l, all.filter((r) => r.status === k).length])]

  return (
    <>
      <ATopbar title="Repair Jobs" sub="Assign mechanics and track every job from booking to hand-over"
        search={q} onSearch={setQ} placeholder="Search job ID, plate, customer...">
        <button className="a-btn a-btn-primary" onClick={addJob}><i className="bi bi-plus-lg"></i> New Job</button>
      </ATopbar>

      <Tabs tabs={tabs} value={filter} onChange={setFilter} />

      <TableCard head={['Job', 'Vehicle', 'Customer', 'Service', 'Mechanic', 'Status', 'Est. Cost', '']} foot={`Showing ${rows.length} of ${all.length} jobs`}>
        {rows.length === 0 && <EmptyRow cols={8} text={query ? `No jobs match "${q}"` : 'No jobs in this list'} />}
        {rows.map((r) => {
          const c = Q.customer(r.customerId) || {}
          const open = r.status === 'pending' || r.status === 'progress'
          const overdue = open && r.due && r.due < today()
          return (
            <tr key={r.id}>
              <td><span className="a-id">#{r.id}</span><small>{relDate(r.date)}{r.appointment ? ' · online' : ''}</small></td>
              <td><strong>{r.vehicle}</strong><small>{r.plate}</small></td>
              <td>{c.name || 'Unknown'}<small>{c.phone}</small></td>
              <td>{r.service}<Priority p={r.priority} />
                {open && <small style={overdue ? { color: 'var(--a-red)', fontWeight: 600 } : undefined}>Due {relDate(r.due).toLowerCase()}{overdue ? ' · overdue' : ''}</small>}
              </td>
              <td>
                {open ? (
                  <select className={'a-select-sm' + (r.mechanicId ? '' : ' unassigned')} value={r.mechanicId || ''} onChange={(e) => assign(r, e.target.value)}>
                    <option value="">— Assign —</option>
                    {store.all('mechanics').map((m) => {
                      const st = Q.mechanicState(m)
                      return <option key={m.id} value={m.id} disabled={st.key === 'leave'}>{m.name} ({st.key === 'leave' ? 'on leave' : Q.activeJobs(m.id) + ' jobs'})</option>
                    })}
                  </select>
                ) : r.mechanicId ? (
                  <div className="a-person"><Avatar name={Q.mechanicName(r.mechanicId)} photo={(Q.mechanic(r.mechanicId) || {}).photo} /><span>{Q.mechanicName(r.mechanicId)}</span></div>
                ) : <span className="text-muted">—</span>}
              </td>
              <td><Badge status={r.status} /></td>
              <td>{r.cost ? nu(r.cost) : '—'}</td>
              <td>
                <div className="a-actions">
                  {r.status === 'progress' && <IconBtn icon="bi-check2-circle" title="Mark complete" tone="success" onClick={() => completeJob(r)} />}
                  <IconBtn icon="bi-eye" title="View details" onClick={() => viewJob(r.id)} />
                  <IconBtn icon="bi-pencil" title="Edit" onClick={() => editJob(r)} />
                  <IconBtn icon="bi-trash3" title="Delete" tone="danger" onClick={() => deleteJob(r)} />
                </div>
              </td>
            </tr>
          )
        })}
      </TableCard>
    </>
  )
}
