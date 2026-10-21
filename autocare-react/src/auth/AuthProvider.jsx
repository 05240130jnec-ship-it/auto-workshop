import { useState } from 'react'
import { AuthContext } from './AuthContext.js'
import { ADMIN } from './users.js'
import { useStore, today } from '../data/store.js'

const KEY = 'acp_session'

function readSession() {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}
function saveSession(s) {
  try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY) } catch { /* blocked */ }
}

export default function AuthProvider({ children }) {
  const store = useStore()
  const [user, setUser] = useState(readSession)

  function start(account, role) {
    const session = { id: account.id, name: account.name, email: account.email, role }
    saveSession(session)
    setUser(session)
    return session
  }

  // Returns { user } on success or { error } on failure
  function login(email, password) {
    const e = email.trim().toLowerCase()
    if (e === ADMIN.email && password === ADMIN.password) return { user: start(ADMIN, 'admin') }

    const mech = store.all('mechanics').find((m) => (m.email || '').toLowerCase() === e)
    if (mech) {
      if (mech.password !== password) return { error: 'Incorrect email or password.' }
      return { user: start(mech, 'mechanic') }
    }
    const cust = store.all('customers').find((c) => (c.email || '').toLowerCase() === e)
    if (cust) {
      if (cust.password !== password) return { error: 'Incorrect email or password.' }
      if (cust.status === 'inactive') return { error: 'This account has been deactivated. Please contact the workshop.' }
      return { user: start(cust, 'customer') }
    }
    return { error: 'Incorrect email or password.' }
  }

  // New customer account (from the Sign up page)
  function signup({ name, email, phone, address, password }) {
    const e = email.trim().toLowerCase()
    const taken = store.all('customers').some((c) => (c.email || '').toLowerCase() === e) ||
      store.all('mechanics').some((m) => (m.email || '').toLowerCase() === e) || e === ADMIN.email
    if (taken) return { error: 'An account with this email already exists.' }
    const customer = {
      id: store.nextId('customers', 'C-', 3), name: name.trim(), email: e, phone: phone.trim(),
      address: address.trim(), password, status: 'active', joined: today(),
    }
    store.add('customers', customer)
    return { user: start(customer, 'customer') }
  }

  function logout() {
    saveSession(null)
    setUser(null)
  }

  // Keep the name in the header up to date if it was edited in a profile
  const live = user && user.role !== 'admin'
    ? store.get(user.role === 'mechanic' ? 'mechanics' : 'customers', user.id)
    : null
  // (if the account was deleted by the admin, the session ends)
  const current = !user || (user.role !== 'admin' && !live) ? null : { ...user, name: live ? live.name : user.name }

  return (
    <AuthContext.Provider value={{ user: current, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
