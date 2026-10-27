import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminContext } from './AdminContext.js'
import { api } from '../../api.js'
import { useDialogs } from '../../ui/DialogContext.js'
import Loading from '../../ui/Loading.jsx'

// Everything the admin panel shows, loaded from the backend
const LISTS = {
  repairs: '/admin/repairs',
  mechanics: '/admin/mechanics',
  customers: '/admin/customers',
  inventory: '/admin/inventory',
  suppliers: '/admin/suppliers',
  orders: '/admin/orders',
  listings: '/admin/shop/listings',
  reservations: '/admin/shop/reservations',
}

// MySQL sends DECIMAL numbers as text ("1500.00"), so turn them into real numbers.
// Also give a few fields the names the pages already use.
function clean(name, rows) {
  return rows.map((row) => {
    const x = { ...row }
    if ('cost' in x) x.cost = Number(x.cost) || 0
    if ('price' in x) x.price = Number(x.price) || 0
    if (name === 'listings') x.condition = x.item_condition
    if (name === 'repairs' && x.apptDate) x.appointment = { date: x.apptDate, time: x.apptTime, delivery: x.delivery }
    return x
  })
}

// Lookups and business rules used across the admin pages (same names as before)
function helpers(data) {
  const get = (c, id) => (data[c] || []).find((x) => x.id === id)
  const Q = {
    customer: (id) => get('customers', id),
    mechanic: (id) => get('mechanics', id),
    supplier: (id) => get('suppliers', id),
    part: (id) => get('inventory', id),
    customerName: (id) => (get('customers', id) || {}).name || 'Unknown',
    mechanicName: (id) => (id === 'admin' ? 'Admin' : (get('mechanics', id) || {}).name || '—'),
    supplierName: (id) => (get('suppliers', id) || {}).name || '—',
    activeJobs: (mid) => data.repairs.filter((r) => r.mechanicId === mid && (r.status === 'pending' || r.status === 'progress')).length,
    completedJobs: (mid) => data.repairs.filter((r) => r.mechanicId === mid && r.status === 'complete').length,
    mechanicState(m) {
      if (m.status === 'leave') return { key: 'leave', label: 'On leave', cls: 'danger' }
      if (m.status === 'busy' || Q.activeJobs(m.id) >= 3) return { key: 'busy', label: 'Busy', cls: 'pending' }
      return { key: 'available', label: 'Available', cls: 'complete' }
    },
    stockState(p) {
      if (p.stock <= 0) return { key: 'out', label: 'Out of stock', cls: 'danger' }
      if (p.stock <= p.reorder) return { key: 'low', label: 'Low stock', cls: 'pending' }
      return { key: 'ok', label: 'In stock', cls: 'complete' }
    },
    poCost: (o) => { const p = get('inventory', o.partId); return p ? p.price * o.qty : 0 },
    lowStock: () => data.inventory.filter((p) => p.stock <= p.reorder),
    pendingOrders: () => data.orders.filter((o) => o.status === 'pending'),
    unassigned: () => data.repairs.filter((r) => !r.mechanicId && r.status === 'pending'),
    partsTotal: (r) => (r.parts || []).reduce((s, p) => s + p.qty * Number(p.price), 0),
    servicesTotal: (r) => (r.services || []).reduce((s, x) => s + x.qty * Number(x.cost), 0),
  }
  return { get, all: (c) => data[c] || [], Q }
}

export default function AdminDataProvider({ children }) {
  const { toast } = useDialogs()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  // Load (or load again) all lists at the same time
  const reload = useCallback(async () => {
    try {
      const names = Object.keys(LISTS)
      const results = await Promise.all(names.map((n) => api(LISTS[n])))
      const next = {}
      names.forEach((n, i) => { next[n] = clean(n, results[i]) })
      setData(next)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  // Send a change to the backend, then load the lists again.
  //   await act(() => api('/admin/suppliers', { method: 'POST', body: v }), 'Supplier added')
  // Shows the backend's error message if it fails. Returns true when it worked.
  const act = useCallback(async (fn, okMsg, tone) => {
    try {
      await fn()
      await reload()
      if (okMsg) toast(okMsg, tone)
      return true
    } catch (err) {
      toast(err.message, 'error')
      return false
    }
  }, [reload, toast])

  const value = useMemo(() => (data ? { data, ...helpers(data), act, reload } : null), [data, act, reload])

  if (!data) {
    return (
      <div style={{ padding: 32 }}>
        <Loading error={error} onRetry={reload} />
      </div>
    )
  }
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}