import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.js'
import { useStore, relDate, fmtDate, today, daysAgo } from '../../data/store.js'
import usePageTitle from '../../ui/usePageTitle.js'
import MTopbar from './MTopbar.jsx'
import Badge from './Badge.jsx'
import { STATUS_ICON } from './helpers.js'

const PART_ICON = ['bi-gear-fill', 'bi-droplet-fill', 'bi-funnel-fill', 'bi-lightning-fill']
const PART_TONE = ['m-icon-blue', 'm-icon-orange', 'm-icon-green', 'm-icon-purple']

export default function MechanicDashboard() {
  usePageTitle('Mechanic Dashboard')
  const { user } = useAuth()
  const { data } = useStore()
  const mine = data.repairs.filter((r) => r.mechanicId === user.id)
  const pending = mine.filter((r) => r.status === 'pending')
  const progress = mine.filter((r) => r.status === 'progress')
  const doneToday = mine.filter((r) => r.status === 'complete' && (r.completedOn || r.due) === today())
  const weekAgo = daysAgo(7)
  const parts = mine.flatMap((r) => (r.parts || []).map((p) => ({ ...p, vehicle: r.vehicle, repairId: r.id })))
  const partsWeek = parts.filter((p) => p.date >= weekAgo).reduce((s, p) => s + p.qty, 0)
  const recentParts = parts.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)

  const order = { progress: 0, pending: 1, complete: 2, cancelled: 3 }
  const list = [...mine].sort((a, b) => order[a.status] - order[b.status] || b.date.localeCompare(a.date)).slice(0, 4)
  const next = progress[0] || pending[0]
  const first = user.name.split(' ')[0]

  return (
    <>
      <MTopbar title="Dashboard" sub={`Welcome back, ${user.name} 👋 Here's your workload today.`} />

      <section className="m-stats">
        <div className="m-stat">
          <div className="m-stat-icon m-icon-purple"><i className="bi bi-clipboard-check"></i></div>
          <div><h6>Assigned orders</h6><div className="m-stat-value">{pending.length + progress.length}</div><p className="m-stat-foot">{pending.length} pending</p></div>
        </div>
        <div className="m-stat">
          <div className="m-stat-icon m-icon-blue"><i className="bi bi-hourglass-split"></i></div>
          <div><h6>In progress</h6><div className="m-stat-value">{progress.length}</div><p className="m-stat-foot blue">Active now</p></div>
        </div>
        <div className="m-stat">
          <div className="m-stat-icon m-icon-green"><i className="bi bi-check-circle-fill"></i></div>
          <div><h6>Completed today</h6><div className="m-stat-value">{doneToday.length}</div><p className="m-stat-foot green">{doneToday.length ? 'Well done' : 'Nothing yet today'}</p></div>
        </div>
        <div className="m-stat">
          <div className="m-stat-icon m-icon-orange"><i className="bi bi-box-seam"></i></div>
          <div><h6>Parts logged</h6><div className="m-stat-value">{partsWeek}</div><p className="m-stat-foot orange">This week</p></div>
        </div>
      </section>

      <section className="m-grid">
        <div className="m-panel">
          <div className="m-panel-head">
            <h3>My repair orders</h3>
            <Link to="/mechanic/repairs">View all →</Link>
          </div>
          <div className="m-panel-list">
            {list.length === 0 && <p className="text-muted small mb-0">No jobs assigned to you yet, {first}.</p>}
            {list.map((r) => (
              <Link to={'/mechanic/repairs/' + r.id} className="m-panel-item" key={r.id}>
                <div className={'m-item-icon ' + STATUS_ICON[r.status]}><i className="bi bi-car-front-fill"></i></div>
                <div className="m-item-body">
                  <strong>{r.vehicle} — {r.plate}</strong>
                  <small>{r.service} · {relDate(r.date)}</small>
                </div>
                <Badge status={r.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="m-panel">
          <div className="m-panel-head">
            <h3>Parts used recently</h3>
            <Link to="/mechanic/reports#parts">View all →</Link>
          </div>
          <div className="m-panel-list">
            {recentParts.length === 0 && <p className="text-muted small mb-0">No parts logged yet. Open a job to log parts.</p>}
            {recentParts.map((p, i) => (
              <Link to={'/mechanic/repairs/' + p.repairId} className="m-panel-item" key={i}>
                <div className={'m-item-icon ' + PART_TONE[i % 4]}><i className={'bi ' + PART_ICON[i % 4]}></i></div>
                <div className="m-item-body">
                  <strong>{p.name}</strong>
                  <small>Qty: {p.qty} · {fmtDate(p.date)} · {p.vehicle}</small>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="m-panel">
        <div className="m-panel-head">
          <h3>Quick actions</h3>
        </div>
        <div className="m-quick-grid">
          <Link to={next ? '/mechanic/repairs/' + next.id : '/mechanic/repairs'} className="m-quick-btn m-quick-primary"><i className="bi bi-wrench-adjustable"></i> {progress[0] ? 'Continue current repair' : 'Start next repair'}</Link>
          <Link to={next ? '/mechanic/repairs/' + next.id : '/mechanic/repairs'} className="m-quick-btn"><i className="bi bi-box-seam"></i> Log parts used</Link>
          <Link to="/mechanic/reports" className="m-quick-btn"><i className="bi bi-file-earmark-bar-graph"></i> My reports</Link>
          <Link to="/mechanic/profile" className="m-quick-btn"><i className="bi bi-person-badge"></i> Update availability</Link>
        </div>
      </section>
    </>
  )
}
