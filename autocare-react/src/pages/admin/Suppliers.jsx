import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore, nu, relDate } from '../../data/store.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import useOnce from './useOnce.js'
import { Badge, EmptyRow, IconBtn, TableCard } from './parts.jsx'

export default function AdminSuppliers() {
  usePageTitle('Suppliers')
  const store = useStore()
  const { Q } = store
  const { toast, confirm, form, view } = useDialogs()
  const [params] = useSearchParams()
  const [q, setQ] = useState('')
  const partsOf = (id) => store.data.inventory.filter((p) => p.supplierId === id)
  const ordersOf = (id) => store.data.orders.filter((o) => o.supplierId === id)
  const query = q.trim().toLowerCase()
  const rows = store.data.suppliers.filter((s) => !query || [s.name, s.person, s.phone, s.email, s.address].join(' ').toLowerCase().includes(query))

  const fields = [
    { name: 'name', label: 'Company name', required: true },
    { name: 'person', label: 'Contact person', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+975 17XXXXXX' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'address', label: 'Address', required: true, col: 12, placeholder: 'e.g. Norzin Lam, Thimphu' },
  ]
  const supplierBody = (v) => ({ name: v.name, person: v.person, phone: v.phone, email: v.email || '', address: v.address })
  async function add() {
    const v = await form({ title: 'Add supplier', fields, submitText: 'Add supplier' })
    if (!v) return
    if (await store.send('/suppliers', { method: 'POST', body: supplierBody(v) })) toast(<><b>{v.name}</b> added</>)
  }
  async function edit(s) {
    const v = await form({ title: 'Edit supplier', fields, values: s, submitText: 'Save changes' })
    if (!v) return
    if (await store.send('/suppliers/' + s.id, { method: 'PATCH', body: supplierBody(v) })) toast('Supplier updated')
  }
  function show(s) {
    const parts = partsOf(s.id), orders = ordersOf(s.id).sort((a, b) => b.date.localeCompare(a.date))
    view(s.name, (
      <>
        <div className="a-detail-grid">
          <div><span>Contact</span><strong>{s.person}</strong></div>
          <div><span>Phone</span><strong>{s.phone}</strong></div>
          <div><span>Email</span><strong>{s.email || '—'}</strong></div>
          <div><span>Address</span><strong>{s.address}</strong></div>
        </div>
        <div className="a-section-title">Products supplied ({parts.length})</div>
        {parts.length ? (
          <table className="a-mini-table mb-3">
            <thead><tr><th>Part</th><th>SKU</th><th>Stock</th><th className="text-end">Price</th></tr></thead>
            <tbody>{parts.map((p) => { const st = Q.stockState(p); return <tr key={p.id}><td>{p.name}</td><td>{p.sku}</td><td><span className={'a-badge a-badge-' + st.cls}>{p.stock}</span></td><td className="text-end">{nu(p.price)}</td></tr> })}</tbody>
          </table>
        ) : <p className="text-muted small">No products linked.</p>}
        <div className="a-section-title">Order history ({orders.length})</div>
        {orders.length ? (
          <table className="a-mini-table">
            <thead><tr><th>PO</th><th>Date</th><th>Part</th><th>Qty</th><th>Status</th><th className="text-end">Cost</th></tr></thead>
            <tbody>{orders.map((o) => <tr key={o.id}><td className="a-id">#{o.id}</td><td>{relDate(o.date)}</td><td>{(Q.part(o.partId) || {}).name}</td><td>{o.qty}</td><td><Badge status={o.status} /></td><td className="text-end">{nu(Q.poCost(o))}</td></tr>)}</tbody>
          </table>
        ) : <p className="text-muted small mb-0">No orders yet.</p>}
      </>
    ))
  }
  async function del(s) {
    const parts = partsOf(s.id)
    if (parts.length) return toast(`${s.name} still supplies ${parts.length} product(s). Move them to another supplier first.`, 'warn')
    const ok = await confirm(<><b>{s.name}</b> will be removed.</>, { title: 'Delete supplier?', okText: 'Delete', danger: true })
    if (ok && (await store.send('/suppliers/' + s.id, { method: 'DELETE' }))) toast(s.name + ' deleted', 'info')
  }

  useOnce(() => { if (params.get('new')) add() })

  return (
    <>
      <ATopbar title="Suppliers" sub="Companies you buy parts and supplies from" search={q} onSearch={setQ} placeholder="Search suppliers...">
        <button className="a-btn a-btn-primary" onClick={add}><i className="bi bi-plus-lg"></i> Add Supplier</button>
      </ATopbar>
      <TableCard head={['Supplier', 'Contact', 'Address', 'Parts Supplied', 'Orders', '']} foot={`${rows.length} supplier${rows.length === 1 ? '' : 's'}`}>
        {rows.length === 0 && <EmptyRow cols={6} text={query ? `No suppliers match "${q}"` : 'No suppliers yet'} />}
        {rows.map((s) => {
          const parts = partsOf(s.id), orders = ordersOf(s.id)
          const received = orders.filter((o) => o.status === 'received').reduce((t, o) => t + Q.poCost(o), 0)
          return (
            <tr key={s.id}>
              <td><strong>{s.name}</strong><small>{s.person}</small></td>
              <td><a href={'tel:' + (s.phone || '').replace(/\s/g, '')}>{s.phone}</a><small>{s.email}</small></td>
              <td>{s.address}</td>
              <td>{parts.length} product{parts.length === 1 ? '' : 's'}<small>{parts.slice(0, 2).map((p) => p.name).join(', ')}{parts.length > 2 ? '…' : ''}</small></td>
              <td>{orders.length}<small>{nu(received)} received</small></td>
              <td><div className="a-actions">
                <IconBtn icon="bi-eye" title="View" onClick={() => show(s)} />
                <IconBtn icon="bi-pencil" title="Edit" onClick={() => edit(s)} />
                <IconBtn icon="bi-trash3" title="Delete" tone="danger" onClick={() => del(s)} />
              </div></td>
            </tr>
          )
        })}
      </TableCard>
    </>
  )
}
