import { useState } from 'react'
import { nu, fmtDate, relDate } from '../../data/store.js'
import { api } from '../../api.js'
import { useAdmin } from './AdminContext.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import { Badge, Tabs, EmptyRow, TableCard } from './parts.jsx'
import useSettings from '../../data/useSettings.js'
import { shopCategories } from '../../data/content.js'

// Orders customers placed in the shop + parts customers want to sell
export default function AdminShop() {
  usePageTitle('Shop & Listings')
  const store = useAdmin()
  const { Q, act } = store
  const { confirm, view, form } = useDialogs()
  const settings = useSettings()
  const [tab, setTab] = useState('orders')
  const reservations = store.data.reservations || []
  const listings = store.data.listings || []

  function collected(x) {
    act(() => api('/admin/shop/reservations/' + x.id, { method: 'PATCH', body: { status: 'collected' } }),
      `Order #${x.id} collected · ${nu(x.qty * x.price)} paid`)
  }
  // The customer paid through WhatsApp (screenshot checked); the part is still waiting for pickup
  async function markPaid(x) {
    const ok = await confirm(<>Mark order <b>#{x.id}</b> as paid? <b>{nu(x.qty * x.price)}</b> received.</>, { title: 'Payment received?', okText: 'Mark as paid' })
    if (ok) act(() => api('/admin/shop/reservations/' + x.id, { method: 'PATCH', body: { paid: true } }), `Order #${x.id} marked as paid`)
  }
  async function cancel(x) {
    const ok = await confirm(<>Cancel order <b>#{x.id}</b>? The {x.qty} × {x.name} go back into stock.</>, { title: 'Cancel order?', okText: 'Cancel order', danger: true })
    if (ok) act(() => api('/admin/shop/reservations/' + x.id, { method: 'PATCH', body: { status: 'cancelled' } }), `Order #${x.id} cancelled`, 'info')
  }
  // Accept = the workshop wants to buy this part (call the customer). Reject = not interested.
  // The customer sees "Accepted" or "Not accepted" on their Sell a Part page.
  async function decide(l, status) {
    const seller = Q.customer(l.customerId) || {}
    const ok = await confirm(status === 'approved'
      ? <>Accept <b>{l.name}</b> for {nu(l.price)}? Call {seller.name || 'the customer'}{seller.phone ? <> on <b>{seller.phone}</b></> : null} to arrange it.</>
      : <>Reject <b>{l.name}</b>? The customer will see "Not accepted".</>,
    { title: status === 'approved' ? 'Accept this part?' : 'Reject this part?', okText: status === 'approved' ? 'Accept' : 'Reject', danger: status !== 'approved' })
    if (ok) act(() => api('/admin/shop/listings/' + l.id, { method: 'PATCH', body: { status } }),
      `"${l.name}" ${status === 'approved' ? 'accepted' : 'rejected'}`, status === 'approved' ? 'success' : 'info')
  }
  // The workshop paid the customer and has the part: it goes into Inventory (workshop only, not in the shop)
  async function bought(l) {
    const cats = [...new Set([l.category, ...shopCategories(settings).map((c) => c.name),
      ...(store.data.inventory || []).map((p) => p.category)].filter(Boolean))]
    const v = await form({
      title: 'Add "' + l.name + '" to inventory', submitText: 'Add to inventory',
      values: { name: l.name, category: l.category, stock: l.qty || 1, reorder: 1, price: Number(l.price) || '' },
      fields: [
        { name: 'name', label: 'Part name', required: true, col: 8 },
        { name: 'sku', label: 'SKU / code', col: 4, placeholder: 'Made from the name if empty', help: 'Optional' },
        { name: 'category', label: 'Category', type: 'select', options: cats, required: true, col: 6 },
        { name: 'supplierId', label: 'Supplier', type: 'select', empty: 'Bought from a customer', col: 6,
          options: (store.data.suppliers || []).map((s) => ({ value: s.id, label: s.name })) },
        { name: 'stock', label: 'Quantity', type: 'number', min: 1, max: 1000, required: true, col: 4 },
        { name: 'reorder', label: 'Reorder level', type: 'number', min: 0, required: true, col: 4, help: 'Alert when stock falls to this' },
        { name: 'price', label: 'Unit price (Nu.)', type: 'number', min: 0, step: 10, required: true, col: 4 },
      ],
    })
    if (!v) return
    act(() => api('/admin/shop/listings/' + l.id + '/buy', { method: 'POST', body: v }),
      <><b>{v.name}</b> added to inventory (workshop only)</>)
  }
  const photosOf = (l) => String(l.photos || '').split('\n').filter(Boolean)
  // Details pop-up: photos, description and the seller's phone
  function show(l) {
    const seller = Q.customer(l.customerId) || {}
    view('Sell request ' + l.id, (
      <>
        <div className="d-flex flex-wrap gap-2 mb-3">
          {photosOf(l).length === 0 && <span className="text-muted small">No photos</span>}
          {photosOf(l).map((src, i) => <img key={i} src={src} alt={'Photo ' + (i + 1)} style={{ width: 220, maxWidth: '100%', borderRadius: 10 }} />)}
        </div>
        <h5 className="mb-1">{l.name}</h5>
        <p className="text-muted small mb-2">{l.category} · {l.item_condition} · {l.qty} piece(s) · {nu(l.price)}</p>
        <p style={{ whiteSpace: 'pre-line' }}>{l.description || '—'}</p>
        <p className="mb-0"><b>Seller:</b> {seller.name || Q.customerName(l.customerId)} {seller.phone ? <>· <i className="bi bi-telephone"></i> {seller.phone}</> : null} {seller.email ? <>· {seller.email}</> : null}</p>
      </>
    ))
  }

  return (
    <>
      <ATopbar title="Shop & Listings" sub="Part orders from the website and parts customers want to sell" />
      <Tabs value={tab} onChange={setTab} tabs={[
        ['orders', 'Part orders', reservations.filter((x) => x.status === 'ready').length],
        ['listings', 'Sell requests', listings.filter((l) => l.status === 'review').length],
      ]} />

      {tab === 'orders' ? (
        <TableCard head={['Order', 'Customer', 'Item', 'Qty', 'Total', 'Pickup', 'Status', '']} foot={`${reservations.length} order(s)`}>
          {reservations.length === 0 && <EmptyRow cols={8} text='No shop orders yet. They appear here when customers press "Buy Now".' />}
          {reservations.map((x) => (
            <tr key={x.id}>
              <td><span className="a-id">#{x.id}</span><small>{relDate(x.date)}</small></td>
              <td>{Q.customerName(x.customerId)}<small>{(Q.customer(x.customerId) || {}).phone}</small></td>
              <td>{x.name}</td>
              <td>{x.qty}</td>
              <td><strong>{nu(x.qty * x.price)}</strong></td>
              <td>{fmtDate(x.pickup)}</td>
              <td><Badge status={x.status} />
                {x.status !== 'cancelled' && (x.paid
                  ? <small style={{ color: 'var(--a-green)', fontWeight: 600 }}><i className="bi bi-check-circle-fill"></i> Paid</small>
                  : <small style={{ color: 'var(--a-red)', fontWeight: 600 }}>Not paid yet</small>)}
              </td>
              <td>{x.status === 'ready' && <div className="a-actions">
                {!x.paid && <button className="a-btn a-btn-outline a-btn-sm" onClick={() => markPaid(x)}><i className="bi bi-cash-coin"></i> Mark as paid</button>}
                <button className="a-btn a-btn-success a-btn-sm" onClick={() => collected(x)}><i className="bi bi-bag-check"></i> {x.paid ? 'Collected' : 'Collected & paid'}</button>
                <button className="a-btn a-btn-outline a-btn-sm" onClick={() => cancel(x)}>Cancel</button>
              </div>}</td>
            </tr>
          ))}
        </TableCard>
      ) : (
        <TableCard head={['Listing', 'Seller', 'Condition', 'Price', 'Qty', 'Status', '']} foot={`${listings.length} listing(s)`}>
          {listings.length === 0 && <EmptyRow cols={7} text='No sell requests yet. They appear here when customers use "Sell a Spare Part".' />}
          {listings.map((l) => (
            <tr key={l.id}>
              <td><div className="d-flex align-items-center gap-2">
                {photosOf(l)[0] && <img src={photosOf(l)[0]} alt="" style={{ width: 52, height: 40, objectFit: 'cover', borderRadius: 6, flex: '0 0 52px' }} />}
                <div><strong>{l.name}</strong><small>{l.category} · {(l.description || '').length > 40 ? l.description.slice(0, 40) + '…' : l.description}</small></div>
              </div></td>
              <td>{Q.customerName(l.customerId)}<small>{(Q.customer(l.customerId) || {}).phone || relDate(l.date)}</small></td>
              <td>{l.item_condition}</td>
              <td>{nu(l.price)}</td>
              <td>{l.qty}</td>
              <td><Badge status={l.status} label={l.status === 'approved' ? 'Accepted' : undefined} />
                {l.partId && <small>In inventory: {l.partId}</small>}</td>
              <td><div className="a-actions">
                <button className="a-btn a-btn-outline a-btn-sm" onClick={() => show(l)}><i className="bi bi-eye"></i> View</button>
                {l.status === 'approved' && (
                  <button className="a-btn a-btn-primary a-btn-sm" onClick={() => bought(l)}><i className="bi bi-box-seam"></i> Bought, add to inventory</button>
                )}
                {l.status === 'review' && <>
                  <button className="a-btn a-btn-success a-btn-sm" onClick={() => decide(l, 'approved')}><i className="bi bi-check-lg"></i> Accept</button>
                  <button className="a-btn a-btn-outline a-btn-sm" onClick={() => decide(l, 'rejected')}>Reject</button>
                </>}
              </div></td>
            </tr>
          ))}
        </TableCard>
      )}
    </>
  )
}