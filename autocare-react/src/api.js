// The ONE place where the React app talks to the backend.
// Every page calls api('/something') instead of using fetch directly.
//
//   const repairs = await api('/repairs')                                   → GET
//   await api('/repairs', { method: 'POST', body: { vehicle, plate, ... } }) → POST
//
// The backend address can be changed in a .env file:  VITE_API_URL=http://localhost:3000/api
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const TOKEN_KEY = 'acp_token'

// The login is kept in sessionStorage = ONE BROWSER TAB.
// So a customer, a mechanic and the admin can each be logged in in their own tab at the same time,
// and closing the tab logs that person out. (Refreshing the page keeps the login.)
try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem('acp_session') } catch { /* old shared login */ }

export function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(token) {
  try { token ? sessionStorage.setItem(TOKEN_KEY, token) : sessionStorage.removeItem(TOKEN_KEY) } catch { /* storage blocked */ }
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = 'Bearer ' + token // the "entry pass" from login

  let res
  try {
    res = await fetch(API_URL + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    // fetch only fails like this when the server can't be reached at all
    throw new Error("Can't reach the server. Is the backend running (npm run dev in autocare-backend) and MySQL started in XAMPP?")
  }

  if (res.status === 204) return null // deleted, nothing to read
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`)
    err.status = res.status
    err.data = data          // the full answer, e.g. { error, wait } after too many wrong passwords
    throw err
  }
  return data
}
