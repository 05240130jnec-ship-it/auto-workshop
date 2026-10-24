import { useState } from 'react'
import { useStore, nu, fmtDate, relDate } from '../../data/store.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import { Badge, Tabs, EmptyRow, TableCard } from './parts.jsx'

// Customer Orders — parts customers bought on the website ("Buy Now").
// They pay when they collect; the admin clicks "Collected & paid".
// Data: MySQL table `reservations` (GET /api/shop/reservations).
export default function AdminCustomerOrders() {
  usePageTitle('Customer Orders')
  const store = useStore()
  const { Q } = store
  const { toast } = useDialogs()
  const [tab, setTab] = useState('ready')
  const all = store.data.reservations || []
  const rows = all.filter((x) => tab === 'all' || x.status === tab)

  async function collected(x) {
    if (!(await store.send('/shop/reservations/' + x.id + '/collected', { method: 'PATCH' }))) return
    toast(`Order #${x.id} collected · ${nu(x.qty * x.price)} paid`)
  }

  return (
    <>
      <ATopbar title="Customer Orders" sub="Parts customers ordered on the website — they pay when they collect" />
      <Tabs value={tab} onChange={setTab} tabs={[
        ['ready', 'Ready for pickup', all.filter((x) => x.status === 'ready').length],
        ['collected', 'Collected', all.filter((x) => x.status === 'collected').length],
        ['all', 'All', all.length],
      ]} />
      <TableCard head={['Order', 'Customer', 'Item', 'Qty', 'Total', 'Pickup', 'Status', '']} foot={`${rows.length} order(s)`}>
        {rows.length === 0 && <EmptyRow cols={8} text='No orders here. They appear when customers press "Buy Now" in the shop.' />}
        {rows.map((x) => (
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
    </>
  )
}
