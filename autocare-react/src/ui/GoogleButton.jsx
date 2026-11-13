import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'

// ---------- "Continue with Google" button ----------
// Our own button (same font as the website). When clicked, Google's sign-in window opens;
// after the person picks an account Google gives us an access token, and the backend checks
// it with Google (POST /api/auth/google) before logging the person in.
// Shown only when GOOGLE_CLIENT_ID is set in autocare-backend/.env (GET /api/auth/google-config).
// Props: label  = the text on the button
//        orLine = 'before' (an "or" line above the button) or 'after' (below it)
// Google's official "G" logo for sign-in buttons (provided by Google for this purpose)
const GOOGLE_G = 'https://developers.google.com/identity/images/g-logo.png'

export default function GoogleButton({ onCredential, label = 'Continue with Google', orLine = 'before', orText = 'or' }) {
  const [clientId, setClientId] = useState(null)
  const [ready, setReady] = useState(false)       // Google's script has loaded
  const [busy, setBusy] = useState(false)
  const callback = useRef(onCredential)           // always the newest function
  callback.current = onCredential

  // 1. Ask the backend if Google login is set up
  useEffect(() => {
    api('/auth/google-config').then((r) => setClientId(r.clientId)).catch(() => {})
  }, [])

  // 2. Load Google's script once
  useEffect(() => {
    if (!clientId) return
    if (window.google && window.google.accounts) return setReady(true)
    let tag = document.getElementById('google-gsi')
    if (!tag) {
      tag = document.createElement('script')
      tag.id = 'google-gsi'
      tag.src = 'https://accounts.google.com/gsi/client'
      tag.async = true
      document.body.appendChild(tag)
    }
    const onLoad = () => setReady(true)
    tag.addEventListener('load', onLoad)
    return () => tag.removeEventListener('load', onLoad)
  }, [clientId])

  // 3. On click: open Google's window and ask for the person's name + email
  function start() {
    if (!ready || !window.google) return
    setBusy(true)
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (r) => {
        if (r && r.access_token) await callback.current({ accessToken: r.access_token })
        setBusy(false)
      },
      error_callback: () => setBusy(false),          // the person closed the window
    })
    client.requestAccessToken()
  }

  if (!clientId) return null
  return (
    <>
      {orLine === 'before' && <div className="lg-or"><span>{orText}</span></div>}
      <button type="button" className="lg-google-btn" onClick={start} disabled={!ready || busy}>
        {busy
          ? <span className="spinner-border spinner-border-sm"></span>
          : <img src={GOOGLE_G} alt="" width="18" height="18" />}
        <span>{label}</span>
      </button>
      {orLine === 'after' && <div className="lg-or"><span>{orText}</span></div>}
    </>
  )
}
