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
