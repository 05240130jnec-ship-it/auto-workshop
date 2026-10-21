import { STATUS_LABEL } from './helpers.js'

export default function Badge({ status }) {
  if (status === 'cancelled') return <span className="m-badge" style={{ background: '#eef0f4', color: '#6b7280' }}>Cancelled</span>
  return <span className={'m-badge m-badge-' + status}>{STATUS_LABEL[status]}</span>
}
