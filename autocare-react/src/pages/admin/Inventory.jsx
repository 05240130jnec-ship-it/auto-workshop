import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { nu, nuShort } from '../../data/store.js'
import useSettings from '../../data/useSettings.js'
import { shopCategories } from '../../data/content.js'
import { api } from '../../api.js'
import { useAdmin } from './AdminContext.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import useOnce from './useOnce.js'
import { Stat, Tabs, EmptyRow, IconBtn, TableCard } from './parts.jsx'

export default function AdminInventory() {
  usePageTitle('Inventory')
  const store = useAdmin()
  const { Q, act } = store
  const { toast, confirm, form } = useDialogs()
  const [params] = useSearchParams()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  const items = store.data.inventory
  // Categories = the standard ones + any others already used in the database (e.g. the shop products)
  // Categories = the shop pages (admin → Website Content → Shop pages) + any others already used
  const settings = useSettings()
  const cats = [...new Set([...shopCategories(settings).map((c) => c.name), ...items.map((p) => p.category).filter(Boolean)])]
  const query = q.trim().toLowerCase()
  // Parts the workshop bought from customers (Orders & Requests → Sell requests → "Bought, add to inventory").
  // Each bought sell request remembers its inventory part (partId), so: part id -> the sell request
  const fromCustomer = {}
  for (const l of store.data.listings || []) if (l.status === 'bought' && l.partId) fromCustomer[l.partId] = l
  const sellerOf = (p) => fromCustomer[p.id] && (fromCustomer[p.id].customerName || Q.customerName(fromCustomer[p.id].customerId))
  const rows = items
    .filter((p) => filter === 'all' || (filter === 'low' ? p.stock <= p.reorder : filter === 'customers' ? !!fromCustomer[p.id] : p.category === filter))
    .filter((p) => !query || [p.name, p.sku, p.category, Q.supplierName(p.supplierId), sellerOf(p) || ''].join(' ').toLowerCase().includes(query))

  const fields = () => [
    { name: 'name', label: 'Part name', required: true, col: 8 },
    { name: 'sku', label: 'SKU / code', col: 4, placeholder: 'Made from the name if empty', help: 'Optional' },
    { name: 'category', label: 'Category', type: 'select', options: cats, required: true },
    { name: 'supplierId', label: 'Supplier', type: 'select', empty: 'No supplier yet', options: store.all('suppliers').map((s) => ({ value: s.id, label: s.name })), help: store.all('suppliers').length ? null : 'Add suppliers on the Suppliers page first' },
    { name: 'stock', label: 'Quantity in stock', type: 'number', min: 0, required: true, col: 4 },
    { name: 'reorder', label: 'Reorder level', type: 'number', min: 0, required: true, col: 4, help: 'Alert when stock falls to this' },
    { name: 'price', label: 'Unit price (Nu.)', type: 'number', min: 0, step: 10, required: true, col: 4 },
    // Shop: products with "Show in shop" = Yes appear on the website shop pages (their category = the shop page)
    { name: 'inShop', label: 'Show in shop?', type: 'select', required: true, col: 4, default: '0',
      options: [{ value: '1', label: 'Yes — on the website' }, { value: '0', label: 'No — workshop only' }] },
    { name: 'image', label: 'Picture', type: 'image', col: 8, help: 'Shown on the shop page when "Show in shop" is Yes. JPG or PNG.' },
  ]
  // Turn the "Show in shop?" answer into 1 / 0 for MySQL
  const forSave = (v) => ({ ...v, inShop: Number(v.inShop) ? 1 : 0, image: v.image || null, supplierId: v.supplierId || null })
  const forForm = (p) => ({ ...p, inShop: p.inShop ? '1' : '0' })
  // An empty SKU is fine: the backend makes one from the part name
  const skuCheck = (id) => (v) => v.sku && store.all('inventory').some((p) => p.id !== id && p.sku.toLowerCase() === v.sku.toLowerCase()) ? 'Another part already uses SKU ' + v.sku : null

  async function add() {
    const v = await form({ title: 'Add part', fields: fields(), submitText: 'Add part', validate: skuCheck() })
    if (!v) return
    act(() => api('/admin/inventory', { method: 'POST', body: forSave({ ...v, sku: v.inShop === '1' ? v.sku.toLowerCase() : v.sku.toUpperCase() }) }),
      <><b>{v.name}</b> added to inventory</>)
  }
  async function edit(p) {
    const v = await form({ title: 'Edit part', fields: fields(), values: forForm(p), submitText: 'Save changes', validate: skuCheck(p.id) })
    if (!v) return
    // (SKU is kept exactly as typed — the shop products use lowercase SKUs like "engine-oil")
    act(() => api('/admin/inventory/' + p.id, { method: 'PATCH', body: forSave(v) }), 'Part updated')
  }
  // New stock arrived (bought from the supplier): add many pieces at once
  async function restock(p) {
    const v = await form({
      title: 'Add stock · ' + p.name, size: 'sm', submitText: 'Add to stock', values: { qty: Math.max(p.reorder * 2 - p.stock, p.reorder, 1) },
      fields: [
        { name: 'qty', label: 'Pieces received', type: 'number', min: 1, max: 10000, required: true, col: 12,
          help: (vals) => <>Stock now {p.stock} → <b>{p.stock + (Number(vals.qty) || 0)}</b>{p.supplierId ? <> · supplier {Q.supplierName(p.supplierId)}</> : null}</> },
      ],
    })
    if (!v) return
    act(() => api('/admin/inventory/' + p.id, { method: 'PATCH', body: { stock: p.stock + Number(v.qty) } }),
      <>{v.qty} × <b>{p.name}</b> added · stock now {p.stock + Number(v.qty)}</>)
  }
  async function del(p) {
    const ok = await confirm(<><b>{p.name}</b> ({p.sku}) will be removed from inventory.</>, { title: 'Delete part?', okText: 'Delete', danger: true })
    if (ok) act(() => api('/admin/inventory/' + p.id, { method: 'DELETE' }), p.name + ' deleted', 'info')
  }
  async function adjust(p, d) {
    if (p.stock + d < 0) return
    const ok = await act(() => api('/admin/inventory/' + p.id, { method: 'PATCH', body: { stock: p.stock + d } }))
    if (!ok) return
    if (d < 0 && p.stock + d === 0) toast(p.name + ' is now out of stock', 'error')
    else if (d < 0 && p.stock + d === p.reorder) toast(p.name + ' reached its reorder level', 'warn')
  }

  useOnce(() => { if (params.get('new')) add() })

  const units = items.reduce((s, p) => s + p.stock, 0)
  const value = items.reduce((s, p) => s + p.stock * p.price, 0)
  const lowN = items.filter((p) => p.stock > 0 && p.stock <= p.reorder).length
  const outN = items.filter((p) => p.stock <= 0).length
  const fromCustomerN = items.filter((p) => fromCustomer[p.id]).length
  const tabs = [['all', 'All', items.length], ...cats.map((c) => [c, c, items.filter((p) => p.category === c).length]),
    ...(fromCustomerN ? [['customers', '♻ From customers', fromCustomerN]] : []),
    ['low', '⚠ Needs reorder', Q.lowStock().length]]

  return (
    <>
      <ATopbar title="Inventory" sub="Spare parts, stock levels and reordering" search={q} onSearch={setQ} placeholder="Search part name or SKU...">
        <button className="a-btn a-btn-primary" onClick={add}><i className="bi bi-plus-lg"></i> Add Part</button>
      </ATopbar>

      <section className="a-stats">
        <Stat icon="bi-box-seam" label="Products" value={items.length} foot={units + ' units in stock'} />
        <Stat icon="bi-exclamation-triangle" tone="orange" label="Low stock" value={lowN} foot="At or below reorder level" footTone="orange" />
        <Stat icon="bi-x-octagon" tone="red" label="Out of stock" value={outN} foot={outN ? 'Order now' : 'None'} footTone={outN ? 'red' : ''} />
        <Stat icon="bi-cash-stack" tone="green" label="Stock value" value={nuShort(value)} foot="At unit price" footTone="green" />
      </section>

      <Tabs tabs={tabs} value={filter} onChange={setFilter} />

      <TableCard head={['Part', 'Category', 'In Stock', 'Reorder At', 'Unit Price', 'Stock Value', 'Supplier', 'Status', '']} foot={`Showing ${rows.length} of ${items.length} products`}>
        {rows.length === 0 && <EmptyRow cols={9} text={query ? `No parts match "${q}"` : 'No parts in this category'} />}
        {rows.map((p) => {
          const st = Q.stockState(p)
          return (
            <tr key={p.id} className={fromCustomer[p.id] ? 'a-row-from-customer' : undefined}>
              <td>
                <div className="d-flex align-items-center gap-2">
                  {p.image
                    ? <img src={p.image} alt="" style={{ width: 44, height: 34, objectFit: 'cover', borderRadius: 6, flex: '0 0 44px' }} />
                    : fromCustomer[p.id] && <span className="a-from-customer-icon"><i className="bi bi-recycle"></i></span>}
                  <div><strong>{p.name}</strong>
                    <small>{p.sku}{p.inShop ? <> · <i className="bi bi-shop"></i> in shop</> : null}</small>
                    {fromCustomer[p.id] && <span className="a-from-customer"><i className="bi bi-recycle"></i> Bought from {sellerOf(p)} · {fromCustomer[p.id].item_condition || 'used'}</span>}
                  </div>
                </div>
              </td>
              <td>{p.category}</td>
              <td>
                <div className="a-stepper">
                  <button onClick={() => adjust(p, -1)} title="Use 1">−</button>
                  <span className={'a-stock ' + st.key}>{p.stock}</span>
                  <button onClick={() => adjust(p, 1)} title="Add 1">+</button>
                </div>
              </td>
              <td>{p.reorder}</td>
              <td>{nu(p.price)}</td>
              <td>{nu(p.stock * p.price)}</td>
              <td>{p.supplierId ? Q.supplierName(p.supplierId) : fromCustomer[p.id] ? <span className="text-muted">Customer</span> : Q.supplierName(p.supplierId)}</td>
              <td><span className={'a-badge a-badge-' + st.cls}>{st.label}</span></td>
              <td><div className="a-actions">
                <IconBtn icon="bi-box-arrow-in-down" title="Add stock" onClick={() => restock(p)} />
                <IconBtn icon="bi-pencil" title="Edit" onClick={() => edit(p)} />
                <IconBtn icon="bi-trash3" title="Delete" tone="danger" onClick={() => del(p)} />
              </div></td>
            </tr>
          )
        })}
      </TableCard>
    </>
  )
}