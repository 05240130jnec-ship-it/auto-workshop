import { useState } from 'react'
import { relDate } from '../../data/store.js'
import { api } from '../../api.js'
import useApi from '../../useApi.js'
import { useDialogs } from '../../ui/DialogContext.js'
import usePageTitle from '../../ui/usePageTitle.js'
import Loading from '../../ui/Loading.jsx'
import ATopbar from './ATopbar.jsx'
import { EmptyRow, IconBtn, TableCard, Tabs } from './parts.jsx'

// admin → Messages: what visitors sent with the form on the Contact page.
// Data: GET /api/contact/admin (MySQL table contact_messages)
const STATUS = { new: ['New', 'pending'], read: ['Read', 'muted'], replied: ['Replied', 'complete'] }

export default function AdminMessages() {
  usePageTitle('Messages')
  const list = useApi('/contact/admin')
  const { toast, confirm, view } = useDialogs()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')

  if (!list.data) return <><ATopbar title="Messages" sub="Sent from the Contact page" /><Loading error={list.error} onRetry={list.reload} /></>

  const all = list.data
  const query = q.trim().toLowerCase()
  const rows = all
    .filter((m) => tab === 'all' || m.status === tab)
    .filter((m) => !query || [m.name, m.email, m.phone, m.subject, m.message].join(' ').toLowerCase().includes(query))
  const count = (st) => all.filter((m) => m.status === st).length

  async function setStatus(m, status, note) {
    try {
      await api('/contact/admin/' + m.id, { method: 'PATCH', body: { status } })
      list.reload()
      window.dispatchEvent(new Event('messages-changed'))   // update the number in the sidebar
      if (note) toast(note)
    } catch (err) { toast(err.message, 'warn') }
  }

  function show(m) {
    if (m.status === 'new') setStatus(m, 'read')
    view(m.subject, (
      <>
        <div className="a-detail-grid">
          <div><span>From</span><strong>{m.name}</strong></div>
          <div><span>Received</span><strong>{new Date(m.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</strong></div>
          <div><span>Email</span><strong><a href={'mailto:' + m.email}>{m.email}</a></strong></div>
          <div><span>Phone</span><strong>{m.phone ? <a href={'tel:' + m.phone}>{m.phone}</a> : '—'}</strong></div>
        </div>
        <div className="a-section-title">Message</div>
        <p style={{ whiteSpace: 'pre-wrap' }} className="mb-3">{m.message}</p>
        <a className="a-btn a-btn-primary" target="_blank" rel="noopener" onClick={() => setStatus(m, 'replied')}
          href={'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(m.email) + '&su=' + encodeURIComponent('Re: ' + m.subject)}>
          <i className="bi bi-reply-fill"></i> Reply by email
        </a>
      </>
    ))
  }

  async function del(m) {
    const ok = await confirm(<>The message from <b>{m.name}</b> will be deleted.</>, { title: 'Delete message?', okText: 'Delete', danger: true })
    if (!ok) return
    try {
      await api('/contact/admin/' + m.id, { method: 'DELETE' })
      list.reload()
      window.dispatchEvent(new Event('messages-changed'))
      toast('Message deleted', 'info')
    } catch (err) { toast(err.message, 'warn') }
  }

  return (
    <>
      <ATopbar title="Messages" sub="Sent from the form on the Contact page" search={q} onSearch={setQ} placeholder="Search messages..." />
      <Tabs value={tab} onChange={setTab} tabs={[['all', 'All', all.length], ['new', 'New', count('new')], ['read', 'Read', count('read')], ['replied', 'Replied', count('replied')]]} />
      <TableCard head={['From', 'Subject', 'Message', 'Received', 'Status', '']} foot={`${rows.length} message${rows.length === 1 ? '' : 's'}`}>
        {rows.length === 0 && <EmptyRow cols={6} text={query ? `No messages match "${q}"` : 'No messages yet'} />}
        {rows.map((m) => {
          const [label, tone] = STATUS[m.status] || [m.status, 'muted']
          return (
            <tr key={m.id} style={m.status === 'new' ? { fontWeight: 600 } : null}>
              <td><strong>{m.name}</strong><small>{m.email}</small></td>
              <td>{m.subject}</td>
              <td style={{ maxWidth: 320 }}><span className="d-block text-truncate">{m.message}</span></td>
              <td>{relDate(String(m.createdAt).slice(0, 10))}</td>
              <td><span className={'a-badge a-badge-' + tone}>{label}</span></td>
              <td><div className="a-actions">
                <IconBtn icon="bi-eye" title="Open" onClick={() => show(m)} />
                {m.status !== 'replied'
                  ? <IconBtn icon="bi-check2-all" title="Mark as replied" onClick={() => setStatus(m, 'replied', 'Marked as replied')} />
                  : <IconBtn icon="bi-envelope" title="Mark as new" onClick={() => setStatus(m, 'new', 'Marked as new')} />}
                <IconBtn icon="bi-trash3" title="Delete" tone="danger" onClick={() => del(m)} />
              </div></td>
            </tr>
          )
        })}
      </TableCard>
    </>
  )
}
