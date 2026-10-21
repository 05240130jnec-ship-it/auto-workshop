import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.js'
import { useStore, nu, fmtDate, daysAgo } from '../../data/store.js'
import usePageTitle from '../../ui/usePageTitle.js'
import MTopbar from './MTopbar.jsx'
import Badge from './Badge.jsx'
import { daysBetween } from './helpers.js'

const PERIODS = [['month', 'This month'], ['week', 'This week'], ['all', 'All time']]

export default function Reports() {
  usePageTitle('My Reports')
  const { user } = useAuth()
  const { data, Q } = useStore()
  const { hash } = useLocation()
  const [period, setPeriod] = useState('month')

  // Scroll to #parts / #performance when coming from the sidebar
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  const from = period === 'week' ? daysAgo(7) : period === 'month' ? daysAgo(new Date().getDate() - 1) : '0000'
  const mine = data.repairs.filter((r) => r.mechanicId === user.id && r.status !== 'cancelled' && (r.completedOn || r.date) >= from)
  const done = mine.filter((r) => r.status === 'complete')
  const parts = mine.flatMap((r) => (r.parts || []).map((p) => ({ ...p, vehicle: r.vehicle, plate: r.plate })))
  const services = mine.reduce((s, r) => s + (r.services || []).length, 0)
  const avgDays = done.length ? done.reduce((s, r) => s + daysBetween(r.date, r.completedOn || r.due), 0) / done.length : 0
  const onTime = done.filter((r) => (r.completedOn || r.due) <= r.due).length
  const revenue = done.reduce((s, r) => s + r.cost, 0)
  const allMine = data.repairs.filter((r) => r.mechanicId === user.id && r.status !== 'cancelled')
  const rate = allMine.length ? Math.round(allMine.filter((r) => r.status === 'complete').length / allMine.length * 100) : 0

  function exportCsv() {
    const rows = [['Job', 'Vehicle', 'Plate', 'Customer', 'Service', 'Parts cost', 'Amount', 'Status', 'Booked']]
    mine.forEach((r) => rows.push([r.id, r.vehicle, r.plate, Q.customerName(r.customerId), r.service, Q.partsTotal(r), r.cost, r.status, r.date]))
    const csv = rows.map((row) => row.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `my-report-${period}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <MTopbar title="My Reports" sub="Summary of your repair activities">
        <button className="m-btn m-btn-outline" onClick={exportCsv}><i className="bi bi-download"></i> Export</button>
      </MTopbar>

      <div className="m-tabs">
        {PERIODS.map(([k, label]) => <button key={k} className={period === k ? 'active' : ''} onClick={() => setPeriod(k)}>{label}</button>)}
      </div>

      <section className="m-stats">
        <div className="m-stat">
          <div className="m-stat-icon m-icon-purple"><i className="bi bi-check-circle-fill"></i></div>
          <div><h6>Total completed</h6><div className="m-stat-value">{done.length}</div><p className="m-stat-foot">{PERIODS.find((p) => p[0] === period)[1]}</p></div>
        </div>
        <div className="m-stat">
          <div className="m-stat-icon m-icon-blue"><i className="bi bi-box-seam"></i></div>
          <div><h6>Parts logged</h6><div className="m-stat-value">{parts.reduce((s, p) => s + p.qty, 0)}</div><p className="m-stat-foot blue">{nu(parts.reduce((s, p) => s + p.qty * p.price, 0))}</p></div>
        </div>
        <div className="m-stat">
          <div className="m-stat-icon m-icon-green"><i className="bi bi-tools"></i></div>
          <div><h6>Services recorded</h6><div className="m-stat-value">{services}</div><p className="m-stat-foot green">Labour lines</p></div>
        </div>
        <div className="m-stat">
          <div className="m-stat-icon m-icon-orange"><i className="bi bi-clock-history"></i></div>
          <div><h6>Avg. repair time</h6><div className="m-stat-value">{avgDays < 1 ? 'Same day' : avgDays.toFixed(1) + 'd'}</div><p className="m-stat-foot orange">Per job</p></div>
        </div>
      </section>

      <div className="m-panel mb-4">
        <div className="m-panel-head"><h3>Repair Summary</h3></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="m-table">
            <thead>
              <tr><th>Vehicle</th><th>Customer</th><th>Service</th><th>Parts Cost</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {mine.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">No jobs in this period.</td></tr>}
              {mine.map((r) => (
                <tr key={r.id}>
                  <td>{r.vehicle} — {r.plate}</td>
                  <td>{Q.customerName(r.customerId)}</td>
                  <td>{r.service}</td>
                  <td>{nu(Q.partsTotal(r))}</td>
                  <td>{nu(r.cost)}</td>
                  <td><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="m-panel h-100" id="parts">
            <div className="m-panel-head"><h3>Parts Used</h3></div>
            <div style={{ overflowX: 'auto' }}>
              <table className="m-table">
                <thead><tr><th>Part</th><th>Qty</th><th>Vehicle</th><th>Date</th><th>Cost</th></tr></thead>
                <tbody>
                  {parts.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-4">No parts logged in this period.</td></tr>}
                  {parts.map((p, i) => (
                    <tr key={i}><td>{p.name}</td><td>{p.qty}</td><td>{p.vehicle}</td><td>{fmtDate(p.date)}</td><td>{nu(p.qty * p.price)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="m-panel h-100" id="performance">
            <div className="m-panel-head"><h3>Performance</h3></div>
            {[
              ['Completion rate (all time)', rate + '%', rate],
              ['Finished on time', done.length ? Math.round(onTime / done.length * 100) + '%' : '—', done.length ? onTime / done.length * 100 : 0],
            ].map(([label, value, pct]) => (
              <div className="mb-3" key={label}>
                <div className="d-flex justify-content-between small mb-1"><span>{label}</span><strong>{value}</strong></div>
                <div style={{ height: 8, background: '#eef0f4', borderRadius: 6 }}>
                  <div style={{ width: pct + '%', height: '100%', borderRadius: 6, background: 'var(--m-purple)' }}></div>
                </div>
              </div>
            ))}
            <div className="d-flex justify-content-between small py-2 border-top"><span>Revenue from your jobs</span><strong>{nu(revenue)}</strong></div>
            <div className="d-flex justify-content-between small py-2 border-top"><span>Jobs waiting to start</span><strong>{allMine.filter((r) => r.status === 'pending').length}</strong></div>
            <div className="d-flex justify-content-between small py-2 border-top"><span>Jobs in progress</span><strong>{allMine.filter((r) => r.status === 'progress').length}</strong></div>
          </div>
        </div>
      </div>
    </>
  )
}
