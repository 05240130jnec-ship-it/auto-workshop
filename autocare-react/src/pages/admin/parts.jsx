// Small building blocks shared by the admin pages
const STATUS = {
  pending: ['Pending', 'pending'], progress: ['In Progress', 'progress'], complete: ['Complete', 'complete'],
  cancelled: ['Cancelled', 'muted'], approved: ['Approved', 'progress'], received: ['Received', 'complete'],
  rejected: ['Rejected', 'danger'], active: ['Active', 'complete'], inactive: ['Inactive', 'muted'],
  review: ['In review', 'pending'], ready: ['Ready for pickup', 'progress'], collected: ['Collected', 'complete'],
}

export function Badge({ status, label }) {
  const [text, cls] = STATUS[status] || [status, 'muted']
  return <span className={'a-badge a-badge-' + cls}>{label || text}</span>
}

export function Priority({ p }) {
  if (!p || p === 'normal') return null
  return <span className={'a-priority a-priority-' + p}>{p === 'high' ? 'High' : 'Urgent'}</span>
}

export function Stat({ icon, tone = 'purple', label, value, foot, footTone = '' }) {
  return (
    <div className="a-stat">
      <div className={'a-stat-icon a-icon-' + tone}><i className={'bi ' + icon}></i></div>
      <div>
        <h6>{label}</h6>
        <div className="a-stat-value">{value}</div>
        {foot && <p className={'a-stat-foot ' + footTone}>{foot}</p>}
      </div>
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="a-tabs">
      {tabs.map(([k, label, count]) => (
        <button key={k} className={value === k ? 'active' : ''} onClick={() => onChange(k)}>
          {label}{count != null && <span className="a-tab-count">{count}</span>}
        </button>
      ))}
    </div>
  )
}

export function EmptyRow({ cols, text }) {
  return (
    <tr><td colSpan={cols}><div className="a-empty"><i className="bi bi-inbox"></i><p>{text || 'Nothing found'}</p></div></td></tr>
  )
}

export function IconBtn({ icon, title, tone = '', onClick }) {
  return <button className={'a-icon-action ' + tone} title={title} aria-label={title} onClick={onClick}><i className={'bi ' + icon}></i></button>
}

export function TableCard({ head, children, foot }) {
  return (
    <div className="a-panel p-0" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="a-table">
          <thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {foot && <div className="a-table-foot"><span>{foot}</span></div>}
    </div>
  )
}
