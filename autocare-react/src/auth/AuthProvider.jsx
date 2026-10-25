// import { useState } from 'react'
// import { AuthContext } from './AuthContext.js'
// import { ADMIN } from './users.js'
// import { useStore, today } from '../data/store.js'

// const KEY = 'acp_session'

// function readSession() {
//   try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
// }
// function saveSession(s) {
//   try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY) } catch { /* blocked */ }
// }

// export default function AuthProvider({ children }) {
//   const store = useStore()
//   const [user, setUser] = useState(readSession)

//   function start(account, role) {
//     const session = { id: account.id, name: account.name, email: account.email, role }
//     saveSession(session)
//     setUser(session)
//     return session
//   }

//   // Returns { user } on success or { error } on failure
//   function login(email, password) {
//     const e = email.trim().toLowerCase()
//     if (e === ADMIN.email && password === ADMIN.password) return { user: start(ADMIN, 'admin') }

//     const mech = store.all('mechanics').find((m) => (m.email || '').toLowerCase() === e)
//     if (mech) {
//       if (mech.password !== password) return { error: 'Incorrect email or password.' }
//       return { user: start(mech, 'mechanic') }
//     }
//     const cust = store.all('customers').find((c) => (c.email || '').toLowerCase() === e)
//     if (cust) {
//       if (cust.password !== password) return { error: 'Incorrect email or password.' }
//       if (cust.status === 'inactive') return { error: 'This account has been deactivated. Please contact the workshop.' }
//       return { user: start(cust, 'customer') }
//     }
//     return { error: 'Incorrect email or password.' }
//   }

//   // New customer account (from the Sign up page)
//   function signup({ name, email, phone, address, password }) {
//     const e = email.trim().toLowerCase()
//     const taken = store.all('customers').some((c) => (c.email || '').toLowerCase() === e) ||
//       store.all('mechanics').some((m) => (m.email || '').toLowerCase() === e) || e === ADMIN.email
//     if (taken) return { error: 'An account with this email already exists.' }
//     const customer = {
//       id: store.nextId('customers', 'C-', 3), name: name.trim(), email: e, phone: phone.trim(),
//       address: address.trim(), password, status: 'active', joined: today(),
//     }
//     store.add('customers', customer)
//     return { user: start(customer, 'customer') }
//   }

//   function logout() {
//     saveSession(null)
//     setUser(null)
//   }

//   // Keep the name in the header up to date if it was edited in a profile
//   const live = user && user.role !== 'admin'
//     ? store.get(user.role === 'mechanic' ? 'mechanics' : 'customers', user.id)
//     : null
//   // (if the account was deleted by the admin, the session ends)
//   const current = !user || (user.role !== 'admin' && !live) ? null : { ...user, name: live ? live.name : user.name }

//   return (
//     <AuthContext.Provider value={{ user: current, login, signup, logout }}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

import { useEffect, useState } from 'react'
import { AuthContext } from './AuthContext.js'
import { api, getToken, setToken } from '../api.js'

const KEY = 'acp_session'

function readSession() {
  if (!getToken()) return null              // no token = not logged in
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}
function saveSession(s) {
  try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY) } catch { /* blocked */ }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  // Save the token from the backend and remember who is logged in
  function start(token, account) {
    setToken(token)
    saveSession(account)
    setUser(account)
    return account
  }

  function logout() {
    setToken(null)
    saveSession(null)
    setUser(null)
  }

  // When the site opens, ask the backend if the saved token is still valid
  useEffect(() => {
    if (!getToken()) return
    api('/auth/me')
      .then((data) => { saveSession(data.user); setUser(data.user) })
      .catch((err) => {
        if (err.status === 401) { setToken(null); saveSession(null); setUser(null) }  // expired
      })
  }, [])

  // Returns { user } on success or { error } on failure
  async function login(email, password) {
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), password },
      })
      return { user: start(data.token, data.user) }
    } catch (err) {
      return { error: err.message }
    }
  }

  // New customer account (from the Sign up page)
  async function signup({ name, email, phone, address, password }) {
    try {
      const data = await api('/auth/signup', {
        method: 'POST',
        body: { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), address: address.trim(), password },
      })
      return { user: start(data.token, data.user) }
    } catch (err) {
      return { error: err.message }
    }
  }

  // Lets a profile page update the name shown in the header
  function updateUser(patch) {
    const next = { ...user, ...patch }
    saveSession(next)
    setUser(next)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
