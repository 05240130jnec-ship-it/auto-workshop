import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { nu, fmtDate, relDate } from '../../data/store.js'
import { api } from '../../api.js'
import { useAdmin } from './AdminContext.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import Avatar from './Avatar.jsx'
import useOnce from './useOnce.js'
import { Badge, Tabs, EmptyRow, IconBtn, TableCard } from './parts.jsx'

export default function AdminCustomers() {
  usePageTitle('Customers')
  const store = useAdmin()
  const { act } = store
  const { toast, confirm, form, view } = useDialogs()
  const [params] = useSearchParams()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  const repairs = store.data.repairs
  const jobsOf = (id) => repairs.filter((r) => r.customerId === id)
  const spentOf = (id) => jobsOf(id).filter((r) => r.status === 'complete').reduce((s, r) => s + r.cost, 0)
  const vehiclesOf = (id) => { const m = {}; jobsOf(id).forEach((r) => { m[r.plate] = r.vehicle }); return Object.entries(m).map(([plate, vehicle]) => ({ plate, vehicle })) }

  const all = store.data.customers
  const query = q.trim().toLowerCase()
  const rows = all.filter((c) => filter === 'all' || c.status === filter)
    .filter((c) => !query || [c.id, c.name, c.phone, c.email, c.address].join(' ').toLowerCase().includes(query))

  const fields = [
    { name: 'name', label: 'Full name', required: true, placeholder: 'e.g. Karma Dorji' },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+975 17XXXXXX', pattern: '^\\+?[0-9 ]{8,15}$', help: '8-digit Bhutan mobile, with or without +975' },
    { name: 'email', label: 'Email (used to log in)', type: 'email', required: true, placeholder: 'name@example.com' },
    { name: 'address', label: 'Address', placeholder: 'e.g. Motithang, Thimphu' },
    { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }], default: 'active' },
  ]
  const normPhone = (p) => { const d = (p || '').replace(/\D/g, ''); return d.length === 8 ? '+975 ' + d : d.startsWith('975') ? '+975 ' + d.slice(3) : p }
  const check = (id) => (v) => {
    if (store.all('customers').some((c) => c.id !== id && (c.phone || '').replace(/\D/g, '').endsWith(v.phone.replace(/\D/g, '').slice(-8)))) return 'A customer with this phone number already exists'
    if (store.all('customers').some((c) => c.id !== id && (c.email || '').toLowerCase() === v.email.toLowerCase())) return 'A customer with this email already exists'
    return null
  }

  async function add() {
    const v = await form({ title: 'Add customer', fields: [...fields, { name: 'password', label: 'Temporary password', required: true, default: 'welcome123', help: 'Tell the customer so they can log in and change it' }], submitText: 'Add customer', validate: check() })
    if (!v) return
    act(() => api('/admin/customers', { method: 'POST', body: { ...v, phone: normPhone(v.phone), email: v.email.toLowerCase() } }),
      <><b>{v.name}</b> added as a customer</>)
  }
  async function edit(c) {
    const v = await form({ title: 'Edit customer', fields, values: c, submitText: 'Save changes', validate: check(c.id) })
    if (!v) return
    act(() => api('/admin/customers/' + c.id, { method: 'PATCH', body: { ...v, phone: normPhone(v.phone), email: v.email.toLowerCase() } }),
      'Customer details saved')
  }
  function show(c) {
    const jobs = jobsOf(c.id).sort((a, b) => b.date.localeCompare(a.date))
    const veh = vehiclesOf(c.id)
    view('Customer details', (
      <>
        <div className="d-flex align-items-center gap-3 mb-4">
          <Avatar name={c.name} size={56} />
          <div><h5 className="a-modal-title">{c.name}</h5><small className="text-muted">Customer #{c.id} · since {fmtDate(c.joined)}</small></div>
          <div className="ms-auto"><Badge status={c.status} /></div>
        </div>
        <div className="a-detail-grid">
          <div><span>Phone</span><strong>{c.phone ? <a href={'tel:' + c.phone.replace(/\s/g, '')}>{c.phone}</a> : '—'}</strong></div>
          <div><span>Email</span><strong>{c.email ? <a href={'mailto:' + c.email}>{c.email}</a> : '—'}</strong></div>
          <div><span>Address</span><strong>{c.address || '—'}</strong></div>
          <div><span>Total spent</span><strong>{nu(spentOf(c.id))}</strong></div>
        </div>
        <div className="a-section-title">Vehicles</div>
        {veh.length ? <div className="d-flex flex-wrap gap-2 mb-3">{veh.map((v) => <span key={v.plate} className="a-badge a-badge-muted" style={{ textTransform: 'none', fontSize: '.8rem' }}><i className="bi bi-car-front"></i> {v.vehicle} · {v.plate}</span>)}</div>
          : <p className="text-muted small">No vehicles on record yet.</p>}
        <div className="a-section-title">Service history ({jobs.length})</div>
        {jobs.length ? (
          <table className="a-mini-table">
            <thead><tr><th>Job</th><th>Date</th><th>Vehicle</th><th>Service</th><th>Status</th><th className="text-end">Amount</th></tr></thead>
            <tbody>{jobs.map((r) => <tr key={r.id}><td><Link className="a-id" to={'/admin/repairs?open=' + r.id}>#{r.id}</Link></td><td>{relDate(r.date)}</td><td>{r.vehicle}</td><td>{r.service}</td><td><Badge status={r.status} /></td><td className="text-end">{nu(r.cost)}</td></tr>)}</tbody>
          </table>
        ) : <p className="text-muted small mb-0">No repairs yet.</p>}
      </>
    ), <Link className="a-btn a-btn-primary" to="/admin/repairs?new=1"><i className="bi bi-plus-lg"></i> New job</Link>)
  }
  async function del(c) {
    const jobs = jobsOf(c.id)
    const open = jobs.filter((r) => r.status === 'pending' || r.status === 'progress').length
    if (open) return toast(`${c.name} has ${open} open job(s). Finish or cancel them first.`, 'warn')
    if (jobs.length) {
      const ok = await confirm(<>{c.name} has {jobs.length} past job(s). To keep service records, they will be marked <b>inactive</b> instead of deleted.</>, { title: 'Deactivate customer?', okText: 'Deactivate' })
      if (ok) act(() => api('/admin/customers/' + c.id, { method: 'PATCH', body: { status: 'inactive' } }), c.name + ' marked inactive', 'info')
      return
    }
    const ok = await confirm(<><b>{c.name}</b> will be permanently removed.</>, { title: 'Delete customer?', okText: 'Delete', danger: true })
    if (ok) act(() => api('/admin/customers/' + c.id, { method: 'DELETE' }), c.name + ' deleted', 'info')
  }

  useOnce(() => { if (params.get('new')) add() })

  return (
    <>
      <ATopbar title="Customers" sub="Everyone who has an account or booked a service" search={q} onSearch={setQ} placeholder="Search name, phone, email...">
        <button className="a-btn a-btn-primary" onClick={add}><i className="bi bi-plus-lg"></i> Add Customer</button>
      </ATopbar>
      <Tabs value={filter} onChange={setFilter} tabs={[['all', 'All', all.length], ['active', 'Active', all.filter((c) => c.status === 'active').length], ['inactive', 'Inactive', all.filter((c) => c.status === 'inactive').length]]} />
      <TableCard head={['ID', 'Customer', 'Contact', 'Vehicles', 'Repairs', 'Total Spent', 'Status', '']} foot={`Showing ${rows.length} of ${all.length} customers`}>
        {rows.length === 0 && <EmptyRow cols={8} text={query ? `No customers match "${q}"` : 'No customers yet'} />}
        {rows.map((c) => {
          const jobs = jobsOf(c.id), veh = vehiclesOf(c.id)
          const open = jobs.filter((r) => r.status === 'pending' || r.status === 'progress').length
          return (
            <tr key={c.id}>
              <td><span className="a-id">#{c.id}</span></td>
              <td><div className="a-person"><Avatar name={c.name} /><div><strong>{c.name}</strong><small>Since {fmtDate(c.joined)}</small></div></div></td>
              <td>{c.phone}<small>{c.email}</small></td>
              <td>{veh.length}{veh.length > 0 && <small>{veh.slice(0, 2).map((v) => v.plate).join(', ')}{veh.length > 2 ? '…' : ''}</small>}</td>
              <td>{jobs.length}{open > 0 && <small style={{ color: 'var(--a-blue)' }}>{open} open</small>}</td>
              <td><strong>{nu(spentOf(c.id))}</strong></td>
              <td><Badge status={c.status} /></td>
              <td><div className="a-actions">
                <IconBtn icon="bi-eye" title="View" onClick={() => show(c)} />
                <IconBtn icon="bi-pencil" title="Edit" onClick={() => edit(c)} />
                <IconBtn icon="bi-trash3" title="Delete" tone="danger" onClick={() => del(c)} />
              </div></td>
            </tr>
          )
        })}
      </TableCard>
    </>
  )
}