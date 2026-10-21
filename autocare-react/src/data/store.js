import { createContext, useContext } from 'react'

export const StoreContext = createContext(null)

// const { data, Q, add, update, remove, ... } = useStore()
export function useStore() {
  return useContext(StoreContext)
}

/* ---------- small formatting helpers ---------- */
const DAY = 86400000

export function daysAgo(n) {
  const d = new Date(Date.now() - n * DAY)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
export const today = () => daysAgo(0)

export const nu = (n) => 'Nu. ' + Number(n || 0).toLocaleString('en-IN')

export function nuShort(n) {
  n = Number(n || 0)
  if (n >= 100000) return 'Nu. ' + (n / 100000).toFixed(1).replace(/\.0$/, '') + 'L'
  if (n >= 1000) return 'Nu. ' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return 'Nu. ' + n
}

export function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function relDate(iso) {
  if (!iso) return '—'
  const diff = Math.round((new Date(today() + 'T00:00:00') - new Date(iso + 'T00:00:00')) / DAY)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff > 1 && diff < 7) return diff + ' days ago'
  if (diff === -1) return 'Tomorrow'
  return fmtDate(iso)
}

export function initials(name) {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

export const SERVICES = ['Engine Diagnostics', 'Brake Service', 'Oil Change', 'Car Wash & Detailing', 'Wheel Alignment', 'Battery Replacement', 'AC Service', 'General Service', 'Body & Paint']
export const SPECS = ['Engine & Diagnostics', 'Brake Systems', 'General Repairs', 'Electrical Systems', 'Body & Paint', 'AC & Cooling', 'Tyres & Alignment']
export const CATEGORIES = ['Auto Parts', 'Cleaning', 'Safety', 'Accessories']
export const PRIORITY = { normal: 'Normal', high: 'High', urgent: 'Urgent' }
