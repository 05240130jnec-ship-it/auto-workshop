import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.js'
import { nu, nuShort, relDate, today } from '../../data/store.js'
import { useAdmin } from './AdminContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import Avatar from './Avatar.jsx'
import { Badge, Priority, Stat } from './parts.jsx'

const ICON = { pending: ['bi-hourglass-split', 'orange'], progress: ['bi-gear-wide-connected', 'blue'], complete: ['bi-check-lg', 'green'], cancelled: ['bi-x-lg', 'red'] }

// Every number on this page is calculated from the shared data
export default function AdminDashboard() {
  usePageTitle('Admin Dashboard')
  const { user } = useAuth()
    const { data, Q } = useAdmin()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [grow, setGrow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setGrow(true), 60); return () => clearTimeout(t) }, [])

  const repairs = data.repairs
  const now = new Date()
  const month = (d) => d.slice(0, 7)
  const thisMonth = today().slice(0, 7)
  const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = lm.getFullYear() + '-' + String(lm.getMonth() + 1).padStart(2, '0')
  const doneDate = (r) => r.completedOn || r.date

  const active = repairs.filter((r) => r.status === 'pending' || r.status === 'progress')
  const unassigned = Q.unassigned()
  const doneThis = repairs.filter((r) => r.status === 'complete' && month(doneDate(r)) === thisMonth)
  const revThis = doneThis.reduce((s, r) => s + r.cost, 0)
  const revLast = repairs.filter((r) => r.status === 'complete' && month(doneDate(r)) === lastMonth).reduce((s, r) => s + r.cost, 0)
  const trend = revLast ? Math.round((revThis - revLast) / revLast * 100) : 0
  const low = Q.lowStock()

  // Revenue chart — last 6 months
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    months.push({ key, label: d.toLocaleDateString('en-GB', { month: 'short' }), total: repairs.filter((r) => r.status === 'complete' && month(doneDate(r)) === key).reduce((s, r) => s + r.cost, 0) })
  }
  const max = Math.max(...months.map((m) => m.total), 1)

  // Status donut
  const groups = [['pending', 'Pending', '#d4d928'], ['progress', 'In progress', '#2563eb'], ['complete', 'Complete', '#16a34a'], ['cancelled', 'Cancelled', '#cbd5e1']]
    .map(([key, label, color]) => ({ key, label, color, n: repairs.filter((r) => r.status === key).length }))
  let acc = 0
  const total = repairs.length || 1
  const stops = groups.map((g) => { const from = acc / total * 360; acc += g.n; return `${g.color} ${from}deg ${acc / total * 360}deg` }).join(',')

  const recent = [...repairs].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 5)
  const attention = [
    ...unassigned.map((r) => ({ key: r.id, to: '/admin/repairs?open=' + r.id, icon: 'bi-person-exclamation', tone: 'orange', title: <>Assign a mechanic to {r.id}<Priority p={r.priority} /></>, sub: `${r.vehicle} · ${r.service} · booked ${relDate(r.date).toLowerCase()}` })),
    ...Q.pendingOrders().map((o) => ({ key: o.id, to: '/admin/orders', icon: 'bi-bag', tone: 'blue', title: `Approve ${o.id} — ${(Q.part(o.partId) || {}).name || ''}`, sub: `${o.qty} units · ${nu(Q.poCost(o))} · by ${Q.mechanicName(o.requestedBy)}` })),
    ...low.map((p) => ({ key: p.id, to: '/admin/inventory', icon: 'bi-box-seam', tone: 'red', title: p.name + (p.stock ? ' running low' : ' out of stock'), sub: `${p.stock} left · reorder level ${p.reorder}` })),
    ...(data.listings || []).filter((l) => l.status === 'review').map((l) => ({ key: l.id, to: '/admin/shop', icon: 'bi-tag', tone: 'purple', title: `Review listing: ${l.name}`, sub: `${Q.customerName(l.customerId)} · ${nu(l.price)}` })),
  ]
  const h = now.getHours()

  return (
    <>
      <ATopbar
        title="Dashboard"
        sub={`${h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'}, ${user.name} · ${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
        search={q} onSearch={setQ} placeholder="Search repairs, plates… (Enter)"
        onEnter={(v) => { if (v.trim()) navigate('/admin/repairs?q=' + encodeURIComponent(v.trim())) }}
      />
      {q && <p className="small text-muted" style={{ marginTop: -16 }}>Press <b>Enter</b> or <Link to={'/admin/repairs?q=' + encodeURIComponent(q)}>search repairs for “{q}”</Link></p>}

      <section className="a-stats">
        <Stat icon="bi-wrench-adjustable" label="Active jobs" value={active.length}
          foot={unassigned.length ? `${unassigned.length} waiting for a mechanic` : 'All jobs assigned'} footTone={unassigned.length ? 'orange' : 'green'} />
        <Stat icon="bi-check2-circle" tone="green" label="Completed this month" value={doneThis.length} foot={repairs.filter((r) => r.status === 'complete').length + ' all time'} footTone="green" />
        <Stat icon="bi-cash-stack" tone="blue" label="Revenue this month" value={nuShort(revThis)} footTone="blue"
          foot={revLast ? <><span className={'a-trend ' + (trend >= 0 ? 'up' : 'down')}>{trend >= 0 ? '▲ ' : '▼ '}{Math.abs(trend)}%</span> vs last month</> : 'From completed jobs'} />
        <Stat icon="bi-exclamation-triangle" tone="red" label="Low stock items" value={low.length} foot={low.length ? 'Reorder soon' : 'Stock looks healthy'} footTone={low.length ? 'red' : 'green'} />
      </section>

      <div className="a-grid">
        <div className="a-panel">
          <div className="a-panel-head"><h3>Revenue — last 6 months</h3><span className="small text-muted">Total {nu(months.reduce((s, m) => s + m.total, 0))}</span></div>
          <div className="a-chart">
            {months.map((m, i) => (
              <div className="a-chart-col" key={m.key} title={`${m.label}: ${nu(m.total)}`}>
                <div className={'a-chart-bar' + (i === 5 ? ' current' : '')} style={{ height: grow ? Math.max(m.total / max * 100, 2) + '%' : 0 }}>
                  <span>{nuShort(m.total).replace('Nu. ', '')}</span>
                </div>
                <div className="a-chart-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="a-panel">
          <div className="a-panel-head"><h3>Repairs by status</h3><Link to="/admin/repairs">All repairs →</Link></div>
          <div className="a-donut-wrap">
            <div className="a-donut" style={{ background: `conic-gradient(${stops})` }}>
              <div className="a-donut-center"><strong>{repairs.length}</strong><small>total jobs</small></div>
            </div>
            <ul className="a-legend">
              {groups.map((g) => <li key={g.key}><i style={{ background: g.color }}></i>{g.label}<b>{g.n}</b></li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="a-grid">
        <div className="a-panel">
          <div className="a-panel-head"><h3>Recent repair jobs</h3><Link to="/admin/repairs">View all →</Link></div>
          <div className="a-panel-list">
            {recent.map((r) => (
              <Link className="a-panel-item" to={'/admin/repairs?open=' + r.id} key={r.id}>
                <div className={'a-item-icon a-icon-' + ICON[r.status][1]}><i className={'bi ' + ICON[r.status][0]}></i></div>
                <div className="a-item-body">
                  <strong>{r.vehicle} · {r.service}<Priority p={r.priority} /></strong>
                  <small>{r.id} · {Q.customerName(r.customerId)} · {relDate(r.date)}</small>
                </div>
                <Badge status={r.status} />
              </Link>
            ))}
          </div>
        </div>
        <div className="a-panel">
          <div className="a-panel-head"><h3>Needs your attention</h3></div>
          <div className="a-panel-list">
            {attention.length === 0 && <div className="a-empty"><i className="bi bi-emoji-smile"></i><p>Nothing needs attention right now.</p></div>}
            {attention.slice(0, 6).map((a) => (
              <Link className="a-panel-item" to={a.to} key={a.key}>
                <div className={'a-item-icon a-icon-' + a.tone}><i className={'bi ' + a.icon}></i></div>
                <div className="a-item-body"><strong>{a.title}</strong><small>{a.sub}</small></div>
                <i className="bi bi-chevron-right text-muted"></i>
              </Link>
            ))}
            {attention.length > 6 && <div className="small text-muted text-center pt-1">+{attention.length - 6} more in notifications</div>}
          </div>
        </div>
      </div>

      <div className="a-grid">
        <div className="a-panel">
          <div className="a-panel-head"><h3>Mechanic workload</h3><Link to="/admin/mechanics">Team →</Link></div>
          <div className="a-workload">
            {data.mechanics.map((m) => {
              const jobs = Q.activeJobs(m.id)
              const st = Q.mechanicState(m)
              const color = st.key === 'leave' ? '#cbd5e1' : jobs >= 3 ? '#ea580c' : 'var(--a-purple)'
              return (
                <div className="a-workload-row" key={m.id}>
                  <Avatar name={m.name} photo={m.photo} />
                  <div className="a-workload-body">
                    <div><span>{m.name}</span><small>{st.key === 'leave' ? 'On leave' : `${jobs} active job${jobs === 1 ? '' : 's'}`}</small></div>
                    <div className="a-bar"><span style={{ width: Math.min(jobs / 4 * 100, 100) + '%', background: color }}></span></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="a-panel">
          <div className="a-panel-head"><h3>Quick actions</h3></div>
          <div className="a-quick-grid">
            <Link to="/admin/repairs?new=1" className="a-quick-btn a-quick-primary"><i className="bi bi-plus-circle"></i> New repair job</Link>
            <Link to="/admin/customers?new=1" className="a-quick-btn"><i className="bi bi-person-plus"></i> Add customer</Link>
            <Link to="/admin/inventory?new=1" className="a-quick-btn"><i className="bi bi-box-seam"></i> Add part</Link>
            <Link to="/admin/orders" className="a-quick-btn"><i className="bi bi-bag-check"></i> Review orders</Link>
            <Link to="/admin/mechanics?new=1" className="a-quick-btn"><i className="bi bi-person-badge"></i> Add mechanic</Link>
            <Link to="/admin/suppliers?new=1" className="a-quick-btn"><i className="bi bi-truck"></i> Add supplier</Link>
          </div>
        </div>
      </div>
    </>
  )
}
