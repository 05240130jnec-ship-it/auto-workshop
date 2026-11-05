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
  const onOrder = (id) => store.data.orders.filter((o) => o.partId === id && (o.status === 'pending' || o.status === 'approved')).reduce((s, o) => s + o.qty, 0)
  const rows = items
    .filter((p) => filter === 'all' || (filter === 'low' ? p.stock <= p.reorder : p.category === filter))
    .filter((p) => !query || [p.name, p.sku, p.category, Q.supplierName(p.supplierId)].join(' ').toLowerCase().includes(query))

  const fields = () => [
    { name: 'name', label: 'Part name', required: true, col: 8 },
    { name: 'sku', label: 'SKU / code', required: true, col: 4, placeholder: 'e.g. BRK-FR-01' },
    { name: 'category', label: 'Category', type: 'select', options: cats, required: true },
    { name: 'supplierId', label: 'Supplier', type: 'select', empty: 'No supplier yet', options: store.all('suppliers').map((s) => ({ value: s.id, label: s.name })), help: store.all('suppliers').length ? null : 'Add suppliers on the Suppliers page first' },
    { name: 'stock', label: 'Quantity in stock', type: 'number', min: 0, required: true, col: 4 },
    { name: 'reorder', label: 'Reorder level', type: 'number', min: 0, required: true, col: 4, help: 'Alert when stock falls to this' },
    { name: 'price', label: 'Unit price (Nu.)', type: 'number', min: 0, step: 10, required: true, col: 4 },
    // Shop: products with "Show in shop" = Yes appear on the website shop pages (their category = the shop page)
    { name: 'inShop', label: 'Show in shop?', type: 'select', required: true, col: 4, default: '0',
      options: [{ value: '1', label: 'Yes — on the website' }, { value: '0', label: 'No — workshop only' }] },
    { name: 'image', label: 'Shop picture', col: 8, placeholder: '/media/oil/oil2.jpg',
      help: (v) => v.image
        ? <span className="d-flex align-items-center gap-2"><img src={v.image} alt="" style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 6 }} /> Preview · a file in autocare-react/public/media</span>
        : 'A file in autocare-react/public/media, e.g. /media/oil/oil2.jpg' },
  ]
  // Turn the "Show in shop?" answer into 1 / 0 for MySQL
  const forSave = (v) => ({ ...v, inShop: Number(v.inShop) ? 1 : 0, image: v.image || null, supplierId: v.supplierId || null })
  const forForm = (p) => ({ ...p, inShop: p.inShop ? '1' : '0' })
  const skuCheck = (id) => (v) => store.all('inventory').some((p) => p.id !== id && p.sku.toLowerCase() === v.sku.toLowerCase()) ? 'Another part already uses SKU ' + v.sku : null

  async function add() {
    const v = await form({ title: 'Add part', fields: fields(), submitText: 'Add part', validate: skuCheck() })
    if (!v) return
    act(() => api('/admin/inventory', { method: 'POST', body: forSave({ ...v, sku: v.inShop === '1' ? v.sku : v.sku.toUpperCase() }) }),
      <><b>{v.name}</b> added to inventory</>)
  }
  async function edit(p) {
    const v = await form({ title: 'Edit part', fields: fields(), values: forForm(p), submitText: 'Save changes', validate: skuCheck(p.id) })
    if (!v) return
    // (SKU is kept exactly as typed — the shop products use lowercase SKUs like "engine-oil")
    act(() => api('/admin/inventory/' + p.id, { method: 'PATCH', body: forSave(v) }), 'Part updated')
  }
  async function reorder(p) {
    if (!p.supplierId) return toast(<><b>{p.name}</b> has no supplier yet. Edit the part and choose a supplier first.</>, 'warn')
    const v = await form({
      title: 'Reorder ' + p.name, size: 'sm', submitText: 'Create purchase order', values: { qty: Math.max(p.reorder * 2 - p.stock, p.reorder, 1) },
      fields: [
        { name: 'qty', label: 'Quantity', type: 'number', min: 1, required: true, col: 12, help: (vals) => <>Unit price {nu(p.price)} · supplier {Q.supplierName(p.supplierId)}<br /><b>Total: {nu((Number(vals.qty) || 0) * p.price)}</b></> },
        { name: 'note', label: 'Note (optional)', type: 'textarea', col: 12 },
      ],
    })
    if (!v) return
    let id = ''
    const ok = await act(async () => {
      const res = await api('/admin/orders', { method: 'POST', body: { partId: p.id, qty: v.qty, note: v.note } })
      id = res.id
    })
    if (ok) toast(<>Purchase order <b>{id}</b> sent to {Q.supplierName(p.supplierId)}</>)
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
  const tabs = [['all', 'All', items.length], ...cats.map((c) => [c, c, items.filter((p) => p.category === c).length]), ['low', '⚠ Needs reorder', Q.lowStock().length]]

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
          const st = Q.stockState(p), incoming = onOrder(p.id)
          return (
            <tr key={p.id}>
              <td>
                <div className="d-flex align-items-center gap-2">
                  {p.image && <img src={p.image} alt="" style={{ width: 44, height: 34, objectFit: 'cover', borderRadius: 6, flex: '0 0 44px' }} />}
                  <div><strong>{p.name}</strong><small>{p.sku}{p.inShop ? <> · <i className="bi bi-shop"></i> in shop</> : null}</small></div>
                </div>
              </td>
              <td>{p.category}</td>
              <td>
                <div className="a-stepper">
                  <button onClick={() => adjust(p, -1)} title="Use 1">−</button>
                  <span className={'a-stock ' + st.key}>{p.stock}</span>
                  <button onClick={() => adjust(p, 1)} title="Add 1">+</button>
                </div>
                {incoming > 0 && <small style={{ color: 'var(--a-blue)' }}>+{incoming} on order</small>}
              </td>
              <td>{p.reorder}</td>
              <td>{nu(p.price)}</td>
              <td>{nu(p.stock * p.price)}</td>
              <td>{Q.supplierName(p.supplierId)}</td>
              <td><span className={'a-badge a-badge-' + st.cls}>{st.label}</span></td>
              <td><div className="a-actions">
                <IconBtn icon="bi-cart-plus" title="Reorder" onClick={() => reorder(p)} />
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