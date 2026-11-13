import { useState } from 'react'
import { nu, nuShort, fmtDate, relDate, today } from '../../data/store.js'
import { api } from '../../api.js'
import { useAdmin } from './AdminContext.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import { Badge, Stat, Tabs, EmptyRow, IconBtn, TableCard } from './parts.jsx'

const STATUSES = [['pending', 'Pending'], ['approved', 'Approved'], ['received', 'Received'], ['rejected', 'Rejected']]

// Purchase orders — approve/reject requests, receive deliveries into stock
export default function AdminOrders() {
  usePageTitle('Purchase Orders')
  const store = useAdmin()
  const { Q, act } = store
  const { toast, confirm, form, view } = useDialogs()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  const os = store.data.orders
  const query = q.trim().toLowerCase()
  const rows = os.filter((o) => filter === 'all' || o.status === filter)
    .filter((o) => { const p = Q.part(o.partId) || {}; return !query || [o.id, p.name, p.sku, Q.supplierName(o.supplierId), Q.mechanicName(o.requestedBy)].join(' ').toLowerCase().includes(query) })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  const sum = (list) => list.reduce((s, o) => s + Q.poCost(o), 0)
  const pend = os.filter((o) => o.status === 'pending'), appr = os.filter((o) => o.status === 'approved')
  const spent = os.filter((o) => o.status === 'received' && o.date.slice(0, 7) === today().slice(0, 7))

  // PATCH /api/admin/orders/:id — the backend checks the order of steps and adds stock on "received"
  const patchOrder = (id, body) => api('/admin/orders/' + id, { method: 'PATCH', body })

  function approve(o) {
    act(() => patchOrder(o.id, { status: 'approved' }),
      `${o.id} approved · ${nu(Q.poCost(o))} order sent to ${Q.supplierName(o.supplierId)}`)
  }
  async function reject(o) {
    const v = await form({ title: 'Reject ' + o.id, size: 'sm', submitText: 'Reject order', fields: [{ name: 'note', label: 'Reason (shown to the mechanic)', type: 'textarea', col: 12, required: true }] })
    if (!v) return
    act(() => patchOrder(o.id, { status: 'rejected', note: v.note }), o.id + ' rejected', 'info')
  }
  async function receive(o) {
    const p = Q.part(o.partId) || {}
    const ok = await confirm(<>Add <b>{o.qty} × {p.name}</b> to inventory? Stock will go from {p.stock} to {p.stock + o.qty}.</>, { title: 'Receive delivery', okText: 'Add to stock' })
    if (!ok) return
    act(() => patchOrder(o.id, { status: 'received' }), `${o.qty} × ${p.name} added to stock`)
  }
  function show(o) {
    const p = Q.part(o.partId) || {}, s = Q.supplier(o.supplierId) || {}
    view(<>Purchase order <span className="a-id">#{o.id}</span></>, (
      <>
        <div className="a-detail-grid">
          <div><span>Part</span><strong>{p.name}</strong><br /><small className="text-muted">{p.sku}</small></div>
          <div><span>Quantity</span><strong>{o.qty} × {nu(p.price)}</strong></div>
          <div><span>Total</span><strong>{nu(Q.poCost(o))}</strong></div>
          <div><span>Status</span><Badge status={o.status} /></div>
          <div><span>Supplier</span><strong>{s.name}</strong><br /><small className="text-muted">{s.phone}</small></div>
          <div><span>Requested by</span><strong>{Q.mechanicName(o.requestedBy)}</strong></div>
          <div><span>Date</span><strong>{fmtDate(o.date)}</strong></div>
        </div>
        {o.note && <div className="a-note">{o.note}</div>}
      </>
    ))
  }
  async function add() {
    const parts = store.all('inventory')
    const v = await form({
      title: 'New purchase order', submitText: 'Create order',
      fields: [
        { name: 'partId', label: 'Part', type: 'select', required: true, empty: 'Select part…', col: 12, options: parts.map((p) => ({ value: p.id, label: `${p.name} — ${p.stock} in stock (${nu(p.price)})` })) },
        { name: 'qty', label: 'Quantity', type: 'number', min: 1, required: true,
          help: (vals) => { const p = Q.part(vals.partId); return p ? <b>Total: {nu((Number(vals.qty) || 0) * p.price)} · supplier: {Q.supplierName(p.supplierId)}</b> : null } },
        { name: 'requestedBy', label: 'Requested by', type: 'select', options: [{ value: 'admin', label: 'Admin' }, ...store.all('mechanics').map((m) => ({ value: m.id, label: m.name }))] },
        { name: 'note', label: 'Note', type: 'textarea', col: 12 },
      ],
    })
    if (!v) return
    let id = ''
    const ok = await act(async () => {
      // Admin orders are approved straight away; orders for a mechanic wait for approval
      const res = await api('/admin/orders', { method: 'POST', body: { partId: v.partId, qty: v.qty, requestedBy: v.requestedBy, note: v.note } })
      id = res.id
    })
    if (!ok) return
    setFilter('all')
    toast(<>Order <b>{id}</b> created</>)
  }

  return (
    <>
      <ATopbar title="Purchase Orders" sub="Approve part requests and receive deliveries into stock" search={q} onSearch={setQ} placeholder="Search PO, part, supplier...">
        <button className="a-btn a-btn-primary" onClick={add}><i className="bi bi-plus-lg"></i> New Order</button>
      </ATopbar>

      <section className="a-stats">
        <Stat icon="bi-hourglass-split" tone="orange" label="Awaiting approval" value={pend.length} foot={nu(sum(pend)) + ' requested'} footTone="orange" />
        <Stat icon="bi-truck" tone="blue" label="On the way" value={appr.length} foot={nu(sum(appr)) + ' approved'} footTone="blue" />
        <Stat icon="bi-box-arrow-in-down" tone="green" label="Received this month" value={spent.length} foot={nu(sum(spent)) + ' spent'} footTone="green" />
        <Stat icon="bi-receipt" label="All orders" value={os.length} foot={nuShort(sum(os.filter((o) => o.status !== 'rejected'))) + ' total value'} />
      </section>

      <Tabs tabs={[['all', 'All', os.length], ...STATUSES.map(([k, l]) => [k, l, os.filter((o) => o.status === k).length])]} value={filter} onChange={setFilter} />

      <TableCard head={['Order', 'Part', 'Qty', 'Supplier', 'Requested By', 'Cost', 'Status', '']} foot={`Showing ${rows.length} of ${os.length} orders`}>
        {rows.length === 0 && <EmptyRow cols={8} text="No purchase orders here" />}
        {rows.map((o) => {
          const p = Q.part(o.partId) || { name: '(deleted part)', sku: '', stock: 0 }
          return (
            <tr key={o.id}>
              <td><span className="a-id">#{o.id}</span><small>{relDate(o.date)}</small></td>
              <td><strong>{p.name}</strong><small>{p.sku} · {p.stock} in stock</small></td>
              <td>{o.qty}</td>
              <td>{Q.supplierName(o.supplierId)}</td>
              <td>{Q.mechanicName(o.requestedBy)}{o.note && <small title={o.note}><i className="bi bi-chat-left-text"></i> {o.note.length > 28 ? o.note.slice(0, 28) + '…' : o.note}</small>}</td>
              <td><strong>{nu(Q.poCost(o))}</strong></td>
              <td><Badge status={o.status} /></td>
              <td><div className="a-actions">
                {o.status === 'pending' && <>
                  <button className="a-btn a-btn-success a-btn-sm" onClick={() => approve(o)}><i className="bi bi-check-lg"></i> Approve</button>
                  <button className="a-btn a-btn-outline a-btn-sm" onClick={() => reject(o)}>Reject</button>
                </>}
                {o.status === 'approved' && <button className="a-btn a-btn-primary a-btn-sm" onClick={() => receive(o)}><i className="bi bi-box-arrow-in-down"></i> Mark received</button>}
                {(o.status === 'received' || o.status === 'rejected') && <IconBtn icon="bi-eye" title="View" onClick={() => show(o)} />}
              </div></td>
            </tr>
          )
        })}
      </TableCard>
    </>
  )
}