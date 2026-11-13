import { useEffect, useState } from 'react'
import { api } from '../api.js'

// The website text, contact details and booking rules — loaded ONCE from MySQL
// (GET /api/content/settings) and shared by every page.
//   const settings = useSettings()     → null while loading, then { homeTitle: '...', ... }
// After the admin saves, reloadSettings() updates every page that is open.

let cache = null
let loading = null
const listeners = new Set()

export function reloadSettings() {
  loading = api('/content/settings')
    .then((s) => { cache = s; listeners.forEach((fn) => fn(s)); return s })
    .catch((err) => { loading = null; throw err })
  return loading
}

export default function useSettings() {
  const [settings, setSettings] = useState(cache)
  useEffect(() => {
    listeners.add(setSettings)
    if (cache) setSettings(cache)
    else if (!loading) reloadSettings().catch(() => {})
    return () => { listeners.delete(setSettings) }
  }, [])
  return settings
}
