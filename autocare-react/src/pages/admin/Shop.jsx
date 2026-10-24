import { useState } from 'react'
import { useStore, nu, relDate } from '../../data/store.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import { Badge, Tabs, EmptyRow, TableCard } from './parts.jsx'

// Shop & Listings — parts customers want to SELL to the workshop.
// The admin decides which ones to buy: Accept (the workshop buys it) or Reject.
// Customer purchases ("Buy Now") are on the separate Customer Orders page.
export default function AdminShop() {
  usePageTitle('Shop & Listings')
  const store = useStore()
  const { Q } = store
  const { toast } = useDialogs()
  const [tab, setTab] = useState('review')
  const all = store.data.listings || []
  const listings = all.filter((l) => tab === 'all' || l.status === tab)

  async function decide(l, status) {
    if (!(await store.send('/shop/listings/' + l.id, { method: 'PATCH', body: { status } }))) return
    toast(`"${l.name}" ${status === 'approved' ? 'accepted — the workshop will buy it' : 'rejected'}`, status === 'approved' ? 'success' : 'info')
  }

  return (
    <>
      <ATopbar title="Shop & Listings" sub="Parts customers offered to sell — choose what the workshop will buy" />
      <Tabs value={tab} onChange={setTab} tabs={[
        ['review', 'To decide', all.filter((l) => l.status === 'review').length],
        ['approved', 'Buying', all.filter((l) => l.status === 'approved').length],
        ['rejected', 'Rejected', all.filter((l) => l.status === 'rejected').length],
        ['all', 'All', all.length],
      ]} />
      <TableCard head={['Part offered', 'Seller', 'Condition', 'Asking price', 'Qty', 'Status', '']} foot={`${listings.length} listing(s)`}>
        {listings.length === 0 && <EmptyRow cols={7} text='Nothing here. Parts appear when customers use "Sell a Spare Part".' />}
        {listings.map((l) => (
          <tr key={l.id}>
            <td><strong>{l.name}</strong><small>{l.category} · {l.description.length > 40 ? l.description.slice(0, 40) + '…' : l.description}</small></td>
            <td>{Q.customerName(l.customerId)}<small>{relDate(l.date)}</small></td>
            <td>{l.condition}</td>
            <td>{nu(l.price)}</td>
            <td>{l.qty}</td>
            <td><Badge status={l.status} label={l.status === 'approved' ? 'Buying' : l.status === 'review' ? 'To decide' : undefined} /></td>
            <td>{l.status === 'review' && <div className="a-actions">
              <button className="a-btn a-btn-success a-btn-sm" onClick={() => decide(l, 'approved')}><i className="bi bi-cart-check"></i> Accept</button>
              <button className="a-btn a-btn-outline a-btn-sm" onClick={() => decide(l, 'rejected')}>Reject</button>
            </div>}</td>
          </tr>
        ))}
      </TableCard>
    </>
  )
}
