import { useState } from 'react'
import { useStore, nu, fmtDate, relDate } from '../../data/store.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import { Badge, Tabs, EmptyRow, TableCard } from './parts.jsx'

// Orders customers placed in the shop + parts customers want to sell
export default function AdminShop() {
  usePageTitle('Shop & Listings')
  const store = useStore()
  const { Q } = store
  const { toast } = useDialogs()
  const [tab, setTab] = useState('orders')
  const reservations = store.data.reservations || []
  const listings = store.data.listings || []

  function collected(x) {
    store.update('reservations', x.id, { status: 'collected' })
    toast(`Order #${x.id} collected · ${nu(x.qty * x.price)} paid`)
  }
  function decide(l, status) {
    store.update('listings', l.id, { status })
    toast(`Listing "${l.name}" ${status === 'approved' ? 'published' : 'rejected'}`, status === 'approved' ? 'success' : 'info')
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
              <td><Badge status={x.status} /></td>
              <td>{x.status === 'ready' && <button className="a-btn a-btn-success a-btn-sm" onClick={() => collected(x)}><i className="bi bi-bag-check"></i> Collected &amp; paid</button>}</td>
            </tr>
          ))}
        </TableCard>
      ) : (
        <TableCard head={['Listing', 'Seller', 'Condition', 'Price', 'Qty', 'Status', '']} foot={`${listings.length} listing(s)`}>
          {listings.length === 0 && <EmptyRow cols={7} text='No sell requests yet. They appear here when customers use "Sell a Spare Part".' />}
          {listings.map((l) => (
            <tr key={l.id}>
              <td><strong>{l.name}</strong><small>{l.category} · {l.description.length > 40 ? l.description.slice(0, 40) + '…' : l.description}</small></td>
              <td>{Q.customerName(l.customerId)}<small>{relDate(l.date)}</small></td>
              <td>{l.condition}</td>
              <td>{nu(l.price)}</td>
              <td>{l.qty}</td>
              <td><Badge status={l.status} label={l.status === 'approved' ? 'Published' : undefined} /></td>
              <td>{l.status === 'review' && <div className="a-actions">
                <button className="a-btn a-btn-success a-btn-sm" onClick={() => decide(l, 'approved')}><i className="bi bi-check-lg"></i> Publish</button>
                <button className="a-btn a-btn-outline a-btn-sm" onClick={() => decide(l, 'rejected')}>Reject</button>
              </div>}</td>
            </tr>
          ))}
        </TableCard>
      )}
    </>
  )
}
