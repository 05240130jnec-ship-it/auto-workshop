import { useMemo, useRef, useState } from 'react'
import { StoreContext, daysAgo } from './store.js'
import { buildSeed } from './seed.js'

const KEY = 'acp_data_v1'

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY))
    if (d && d.repairs) return { reservations: [], listings: [], ...d }
  } catch { /* ignore */ }
  return buildSeed(daysAgo)
}

// One shared "database" for the whole app, saved in the browser.
// Customer bookings, mechanic updates and admin changes all go through here,
// so every area sees the same data.
export default function StoreProvider({ children }) {
  const [data, setData] = useState(load)
  // Always holds the newest data, so several changes in one click don't overwrite each other
  const latest = useRef(data)

  const value = useMemo(() => {
    const cur = () => latest.current
    function commit(next) {
      latest.current = next
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage full or blocked */ }
      setData(next)
    }

    const api = {
      data,
      all: (c) => data[c] || [],
      get: (c, id) => (data[c] || []).find((x) => x.id === id),
      add(c, obj) { const d = cur(); commit({ ...d, [c]: [obj, ...(d[c] || [])] }); return obj },
      update(c, id, patch) { const d = cur(); commit({ ...d, [c]: d[c].map((x) => (x.id === id ? { ...x, ...patch } : x)) }) },
      remove(c, id) { const d = cur(); commit({ ...d, [c]: d[c].filter((x) => x.id !== id) }) },
      // Several changes at once, e.g. receive an order AND add stock
      batch(fn) {
        const next = structuredClone(cur())
        fn(next)
        commit(next)
      },
      nextId(c, prefix, width = 3) {
        let max = 0
        const list = cur()[c] || []
        list.forEach((x) => { const n = parseInt(String(x.id).replace(/\D/g, ''), 10); if (n > max) max = n })
        return prefix + String(max + 1).padStart(width, '0')
      },
      reset() {
        try { localStorage.removeItem(KEY) } catch { /* ignore */ }
        const fresh = buildSeed(daysAgo)
        latest.current = fresh
        setData(fresh)
      },
    }

    // Lookups & business rules used across pages
    const get = api.get
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
      partsTotal: (r) => (r.parts || []).reduce((s, p) => s + p.qty * p.price, 0),
      servicesTotal: (r) => (r.services || []).reduce((s, x) => s + x.qty * x.cost, 0),
    }
    api.Q = Q
    return api
  }, [data])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
