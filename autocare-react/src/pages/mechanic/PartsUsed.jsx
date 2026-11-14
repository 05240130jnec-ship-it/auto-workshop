import { useState } from 'react'
import { Link } from 'react-router-dom'
import { nu, fmtDate, daysAgo } from '../../data/store.js'
import { useMechanic } from './MechanicContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import MTopbar from './MTopbar.jsx'

// Parts Used (/mechanic/parts): every spare part I logged on my jobs.
// The parts come from MySQL (repair_parts), sent by the backend with my jobs.
const PERIODS = [['week', 'This week'], ['month', 'This month'], ['all', 'All time']]

export default function PartsUsed() {
  usePageTitle('Parts Used')
  const { data } = useMechanic()
  const [period, setPeriod] = useState('month')
  const [search, setSearch] = useState('')

  const from = period === 'week' ? daysAgo(7) : period === 'month' ? daysAgo(new Date().getDate() - 1) : '0000'
  const all = data.repairs.flatMap((r) => (r.parts || []).map((p) => ({ ...p, vehicle: r.vehicle, plate: r.plate, repairId: r.id })))
  const q = search.trim().toLowerCase()
  const parts = all
    .filter((p) => p.date >= from)
    .filter((p) => !q || (p.name + ' ' + p.vehicle + ' ' + p.plate + ' ' + p.repairId).toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date))

  const count = parts.reduce((s, p) => s + p.qty, 0)
  const cost = parts.reduce((s, p) => s + p.qty * p.price, 0)
  const jobs = new Set(parts.map((p) => p.repairId)).size

  // The part I used most in this period
  const byName = {}
  parts.forEach((p) => { byName[p.name] = (byName[p.name] || 0) + p.qty })
  const top = Object.entries(byName).sort((a, b) => b[1] - a[1])[0]

  return (
    <>
      <MTopbar title="Parts Used" sub="Every spare part you logged on your jobs" />

      <div className="m-tabs">
        {PERIODS.map(([k, label]) => <button key={k} className={period === k ? 'active' : ''} onClick={() => setPeriod(k)}>{label}</button>)}
      </div>

      <section className="m-stats">
        <div className="m-stat">
          <div className="m-stat-icon m-icon-orange"><i className="bi bi-box-seam"></i></div>
          <div><h6>Parts used</h6><div className="m-stat-value">{count}</div><p className="m-stat-foot orange">{PERIODS.find((p) => p[0] === period)[1]}</p></div>
        </div>
        <div className="m-stat">
          <div className="m-stat-icon m-icon-green"><i className="bi bi-cash-stack"></i></div>
          <div><h6>Parts cost</h6><div className="m-stat-value">{nu(cost)}</div><p className="m-stat-foot green">Total value</p></div>
        </div>
        <div className="m-stat">
          <div className="m-stat-icon m-icon-blue"><i className="bi bi-car-front-fill"></i></div>
          <div><h6>Jobs</h6><div className="m-stat-value">{jobs}</div><p className="m-stat-foot blue">With parts logged</p></div>
        </div>
        <div className="m-stat">
          <div className="m-stat-icon m-icon-purple"><i className="bi bi-star-fill"></i></div>
          <div><h6>Most used</h6><div className="m-stat-value" style={{ fontSize: '1.05rem' }}>{top ? top[0] : '—'}</div><p className="m-stat-foot">{top ? top[1] + ' pcs' : 'No parts yet'}</p></div>
        </div>
      </section>

      <div className="m-panel">
        <div className="m-panel-head">
          <h3>Parts list</h3>
          <input className="m-form-control" style={{ maxWidth: 260 }} placeholder="Search part, car or plate"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="m-table">
            <thead>
              <tr><th>Part</th><th>Qty</th><th>Unit price</th><th>Total</th><th>Vehicle</th><th>Job</th><th>Date</th></tr>
            </thead>
            <tbody>
              {parts.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted py-4">
                  {q ? 'No parts match your search.' : 'No parts logged in this period. Open a job to log the parts you used.'}
                </td></tr>
              )}
              {parts.map((p, i) => (
                <tr key={i}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.qty}</td>
                  <td>{nu(p.price)}</td>
                  <td><strong>{nu(p.qty * p.price)}</strong></td>
                  <td>{p.vehicle} — {p.plate}</td>
                  <td><Link to={'/mechanic/repairs/' + p.repairId}>{p.repairId}</Link></td>
                  <td>{fmtDate(p.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}