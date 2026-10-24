import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StoreContext } from './store.js'
import { useAuth } from '../auth/AuthContext.js'
import { useDialogs } from '../ui/DialogContext.js'
import { api } from '../api.js'

// The admin panel and the mechanic portal read their data from here.
// It loads everything from the backend (MySQL) and turns the backend's
// snake_case rows (customer_id) into the shape the pages use (customerId),
// so the pages can keep reading data.repairs, Q.customerName(...) etc.
//
// Saving:  await store.send('/inventory/P-101', { method: 'PATCH', body: { stock: 5 } })
//   → calls the backend, then reloads the data so every page shows the change.
//   → returns the backend's answer, or null if it failed (the error is shown as a toast).

const EMPTY = { repairs: [], customers: [], mechanics: [], inventory: [], suppliers: [], orders: [], reservations: [], listings: [] }
const num = (v) => Number(v || 0)
const day = (v) => (v ? String(v).slice(0, 10) : null)

/* ---------- backend row → page object ---------- */
const toRepair = (r) => ({
  id: r.id,
  customerId: r.customer_id,
  mechanicId: r.mechanic_id || null,
  vehicle: r.vehicle,
  plate: r.plate,
  service: r.service,
  status: r.status,
  priority: r.priority || 'normal',
  date: day(r.booked_on),
  due: day(r.due),
  startedOn: day(r.started_on),
  completedOn: day(r.completed_on),
  cost: num(r.cost),
  notes: r.notes || '',
  apptDate: day(r.appt_date),
  apptTime: r.appt_time || null,
  delivery: r.delivery || null,
  appointment: r.appt_time ? { date: day(r.appt_date), time: r.appt_time, delivery: r.delivery } : null,
  customerName: r.customer_name,
  customerPhone: r.customer_phone,
  parts: (r.parts || []).map((p) => ({ lineId: p.id, partId: p.part_id, name: p.name, qty: num(p.qty), price: num(p.price), date: day(p.used_on) })),
  services: (r.services || []).map((s) => ({ lineId: s.id, name: s.name, qty: num(s.qty), cost: num(s.cost) })),
  workNotes: (r.notes_list || []).map((n) => `[${fmt(day(n.created_at))}] ${n.author}: ${n.note}`),
})
function fmt(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
const toCustomer = (c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address || '', status: c.status, joined: day(c.joined) })
const toMechanic = (m) => ({
  id: m.id, name: m.name, email: m.email, phone: m.phone, specialization: m.specialization,
  experience: num(m.experience), status: m.status, photo: m.photo || '', dob: day(m.dob), address: m.address || '', joined: day(m.joined),
})
const toPart = (p) => ({ id: p.id, sku: p.sku, name: p.name, category: p.category, stock: num(p.stock), reorder: num(p.reorder_level), price: num(p.price), supplierId: p.supplier_id })
const toSupplier = (s) => ({ id: s.id, name: s.name, person: s.person, phone: s.phone, email: s.email || '', address: s.address })
const toOrder = (o) => ({ id: o.id, partId: o.part_id, qty: num(o.qty), supplierId: o.supplier_id, requestedBy: o.requested_by, status: o.status, date: day(o.order_date), note: o.note || '' })
const toReservation = (x) => ({ id: x.id, customerId: x.customer_id, customerName: x.customer_name, slug: x.slug, name: x.name, price: num(x.price), qty: num(x.qty), pickup: day(x.pickup), status: x.status, date: day(x.created_on) })
const toListing = (l) => ({
  id: l.id, customerId: l.customer_id, customerName: l.customer_name, name: l.name, category: l.category, condition: l.item_condition,
  price: num(l.price), qty: num(l.qty), description: l.description || '', status: l.status, date: day(l.created_on), photos: [],
})

// What each role is allowed to load
async function loadFor(role) {
  if (role === 'admin') {
    const [repairs, customers, mechanics, inventory, suppliers, orders, reservations, listings] = await Promise.all([
      api('/repairs'), api('/customers'), api('/mechanics'), api('/inventory'), api('/suppliers'),
      api('/orders'), api('/shop/reservations'), api('/shop/listings'),
    ])
    return {
      repairs: repairs.map(toRepair), customers: customers.map(toCustomer), mechanics: mechanics.map(toMechanic),
      inventory: inventory.map(toPart), suppliers: suppliers.map(toSupplier), orders: orders.map(toOrder),
      reservations: reservations.map(toReservation), listings: listings.map(toListing),
    }
  }
  if (role === 'mechanic') {
    const [repairs, mechanics, inventory, suppliers, orders] = await Promise.all([
      api('/repairs'), api('/mechanics'), api('/inventory'), api('/suppliers'), api('/orders'),
    ])
    // Mechanics may not list all customers, so we build the few they need from their own jobs
    const customers = []
    repairs.forEach((r) => {
      if (!customers.some((c) => c.id === r.customer_id)) customers.push({ id: r.customer_id, name: r.customer_name, phone: r.customer_phone, email: '', address: '', status: 'active' })
    })
    return {
      ...EMPTY, repairs: repairs.map(toRepair), customers, mechanics: mechanics.map(toMechanic),
      inventory: inventory.map(toPart), suppliers: suppliers.map(toSupplier), orders: orders.map(toOrder),
    }
  }
  return EMPTY // customers use their own pages, which call the backend directly
}

export default function ApiStoreProvider({ children }) {
  const { user } = useAuth()
  const { toast } = useDialogs()
  const role = user ? user.role : null
  const [data, setData] = useState(EMPTY)
  const [state, setState] = useState({ ready: false, error: null })
  const latest = useRef(data)
  latest.current = data

  const reload = useCallback(async () => {
    if (role !== 'admin' && role !== 'mechanic') { setData(EMPTY); setState({ ready: true, error: null }); return }
    try {
      const next = await loadFor(role)
      setData(next)
      setState({ ready: true, error: null })
    } catch (err) {
      setState((s) => ({ ready: s.ready, error: err.message }))
    }
  }, [role])

  useEffect(() => {
    setState({ ready: false, error: null })
    reload()
  }, [reload, user && user.id])

  const value = useMemo(() => {
    const get = (c, id) => (data[c] || []).find((x) => x.id === id)
    const store = {
      data,
      ready: state.ready,
      error: state.error,
      reload,
      all: (c) => data[c] || [],
      get,
      // Save something through the backend, then reload. Returns the answer, or null on error.
      async send(path, opts = {}) {
        try {
          const res = await api(path, opts)
          await reload()
          return res || { ok: true }
        } catch (err) {
          toast(err.message, 'error')
          return null
        }
      },
      // Guess the next ID (the backend makes the real one the same way)
      nextId(c, prefix, width = 3) {
        let max = 0
        ;(latest.current[c] || []).forEach((x) => { const n = parseInt(String(x.id).replace(/\D/g, ''), 10); if (n > max) max = n })
        return prefix + String(max + 1).padStart(width, '0')
      },
    }

    // Lookups & business rules used across pages (same as before)
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
    store.Q = Q
    return store
  }, [data, state, reload, toast])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
