import { useCallback, useEffect, useMemo, useState } from 'react'
import { MechanicContext } from './MechanicContext.js'
import { api } from '../../api.js'
import { useDialogs } from '../../ui/DialogContext.js'
import Loading from '../../ui/Loading.jsx'

// What the mechanic portal needs, loaded from the backend
const LISTS = {
  repairs: '/mechanic/repairs',   // my jobs, each with its parts + services
  profile: '/mechanic/profile',   // my own mechanic record
  parts: '/mechanic/parts',       // inventory to pick parts from
}

// Make numbers real numbers and give fields the names the pages already use
function cleanRepair(r) {
  return {
    ...r,
    cost: Number(r.cost) || 0,
    parts: (r.parts || []).map((p) => ({ ...p, price: Number(p.price) || 0 })),
    services: (r.services || []).map((s) => ({ ...s, cost: Number(s.cost) || 0 })),
    workNotes: r.workNotes ? r.workNotes.split('\n') : [],
    appointment: r.apptDate ? { date: r.apptDate, time: r.apptTime, delivery: r.delivery } : null,
  }
}

export default function MechanicDataProvider({ children }) {
  const { toast } = useDialogs()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    try {
      const [repairs, profile, parts] = await Promise.all([api(LISTS.repairs), api(LISTS.profile), api(LISTS.parts)])
      setData({
        repairs: repairs.map(cleanRepair),
        profile,
        parts: parts.map((p) => ({ ...p, price: Number(p.price) || 0 })),
      })
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  // Send a change to the backend, then reload. Shows the backend's error if it fails.
  const act = useCallback(async (fn, okMsg, tone) => {
    try {
      await fn()
      await reload()
      if (okMsg) toast(okMsg, tone)
      return true
    } catch (err) {
      toast(err.message, 'error')
      return false
    }
  }, [reload, toast])

  const value = useMemo(() => {
    if (!data) return null
    const get = (c, id) => (data[c] || []).find((x) => x.id === id)
    const Q = {
      partsTotal: (r) => (r.parts || []).reduce((s, p) => s + p.qty * p.price, 0),
      servicesTotal: (r) => (r.services || []).reduce((s, x) => s + x.qty * x.cost, 0),
      activeJobs: () => data.repairs.filter((r) => r.status === 'pending' || r.status === 'progress').length,
    }
    return { data, get, Q, act, reload }
  }, [data, act, reload])

  if (!data) {
    return (
      <div style={{ padding: 32 }}>
        <Loading error={error} onRetry={reload} />
      </div>
    )
  }
  return <MechanicContext.Provider value={value}>{children}</MechanicContext.Provider>
}