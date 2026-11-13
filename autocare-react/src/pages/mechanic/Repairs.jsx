import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { relDate, fmtDate } from '../../data/store.js'
import { api } from '../../api.js'
import { useMechanic } from './MechanicContext.js'
import { imageFor } from '../../data/services.js'
import usePageTitle from '../../ui/usePageTitle.js'
import MTopbar from './MTopbar.jsx'
import Badge from './Badge.jsx'

const TABS = [['all', 'All'], ['pending', 'Pending'], ['progress', 'In Progress'], ['complete', 'Complete']]

// My Repairs — the jobs the backend says are assigned to me
export default function MechanicRepairs() {
  usePageTitle('My Repairs')
  const store = useMechanic()
  const { act } = store
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const mine = store.data.repairs.filter((r) => r.status !== 'cancelled')
  const order = { progress: 0, pending: 1, complete: 2 }
  const list = mine.filter((r) => tab === 'all' || r.status === tab)
    .sort((a, b) => order[a.status] - order[b.status] || b.date.localeCompare(a.date))

  async function start(r) {
    const ok = await act(() => api('/mechanic/repairs/' + r.id, { method: 'PATCH', body: { status: 'progress' } }),
      'Started work on ' + r.vehicle)
    if (ok) navigate('/mechanic/repairs/' + r.id)
  }

  return (
    <>
      <MTopbar title="My Repairs" sub="All repair orders assigned to you" />

      <div className="m-tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
            {label} <span className="opacity-50">({k === 'all' ? mine.length : mine.filter((r) => r.status === k).length})</span>
          </button>
        ))}
      </div>

      {list.length === 0 && <div className="m-panel text-center text-muted">No repairs in this list.</div>}

      {list.map((r) => {
        return (
          <div className="m-repair-card" key={r.id}>
            <img src={imageFor(r.service)} className="m-repair-img" alt="" />
            <div className="m-repair-info">
              <Badge status={r.status} />
              {r.priority !== 'normal' && <span className="m-badge ms-1" style={{ background: 'rgba(220,38,38,.1)', color: '#dc2626' }}>{r.priority}</span>}
              <h6 className="mt-2">{r.vehicle} — {r.plate}</h6>
              <p>Customer: {r.customerName || 'Unknown'} · {r.service}</p>
              <p>
                {r.status === 'complete'
                  ? <><i className="bi bi-check-circle me-1"></i> Completed {fmtDate(r.completedOn || r.due)}</>
                  : <><i className="bi bi-clock me-1"></i> Booked {relDate(r.date).toLowerCase()} · due {relDate(r.due).toLowerCase()}{r.appointment ? ' · ' + r.appointment.time : ''}</>}
              </p>
            </div>
            <div className="m-repair-actions">
              {r.status === 'progress' && <Link to={'/mechanic/repairs/' + r.id} className="m-btn m-btn-primary m-btn-sm"><i className="bi bi-play-fill"></i> Continue</Link>}
              {r.status === 'pending' && <button className="m-btn m-btn-yellow m-btn-sm" onClick={() => start(r)}><i className="bi bi-play-fill"></i> Start Work</button>}
              {r.status === 'complete' && <Link to={'/mechanic/repairs/' + r.id} className="m-btn m-btn-outline m-btn-sm"><i className="bi bi-eye"></i> View</Link>}
            </div>
          </div>
        )
      })}
    </>
  )
}