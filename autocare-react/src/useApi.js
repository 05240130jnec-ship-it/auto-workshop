import { useEffect, useState } from 'react'
import { api } from './api.js'

// Load data from the backend inside a component:
//   const { data, loading, error, reload } = useApi('/repairs')
// Call reload() after you change something so the page shows the new data.
// Pass null as the path to skip loading.
export default function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!path) return
    let alive = true // ignore the answer if the page was closed meanwhile
    api(path)
      .then((data) => { if (alive) setState({ data, loading: false, error: null }) })
      .catch((err) => { if (alive) setState({ data: null, loading: false, error: err.message }) })
    return () => { alive = false }
  }, [path, version])

  return { ...state, reload: () => setVersion((v) => v + 1) }
}
