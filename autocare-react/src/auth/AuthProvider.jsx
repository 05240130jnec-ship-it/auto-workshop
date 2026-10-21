import { useEffect, useState } from 'react'
import { AuthContext } from './AuthContext.js'
import { useStore } from '../data/store.js'
import { api, getToken, setToken } from '../api.js'

const KEY = 'acp_session'

function readSession() {
  // A session only counts if we also have a token from the backend
  if (!getToken()) return null
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}
function saveSession(s) {
  try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY) } catch { /* blocked */ }
}

// Login now goes to the backend: it checks the password in MySQL and gives us a token.
export default function AuthProvider({ children }) {
  const store = useStore()
  const [user, setUser] = useState(readSession)

  function start(token, u) {
    setToken(token)
    saveSession(u)
    setUser(u)
    return u
  }

  // Returns { user } on success or { error } on failure
  async function login(email, password) {
    try {
      const { token, user: u } = await api('/auth/login', { method: 'POST', body: { email, password } })
      return { user: start(token, u) }
    } catch (err) {
      return { error: err.message }
    }
  }

  // New customer account (from the Sign up page) — saved in MySQL
  async function signup({ name, email, phone, address, password }) {
    try {
      const { token, user: u } = await api('/auth/signup', { method: 'POST', body: { name, email, phone, address, password } })
      return { user: start(token, u) }
    } catch (err) {
      return { error: err.message }
    }
  }

  function logout() {
    setToken(null)
    saveSession(null)
    setUser(null)
  }

  // When the app opens, ask the backend if our saved token is still valid.
  // If it expired (tokens last 1 day), log out so the user can log in again.
  useEffect(() => {
    if (!getToken()) return
    api('/auth/me').catch((err) => {
      if (err.status === 401 || err.status === 404) {
        setToken(null)
        saveSession(null)
        setUser(null)
      }
    })
  }, [])

  // Show the latest name if it was edited in a profile
  const live = user && user.role !== 'admin'
    ? store.get(user.role === 'mechanic' ? 'mechanics' : 'customers', user.id)
    : null
  const current = user ? { ...user, name: live ? live.name : user.name } : null

  return (
    <AuthContext.Provider value={{ user: current, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
