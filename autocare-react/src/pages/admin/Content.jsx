import { useState } from 'react'
import { nu, fmtDate, today } from '../../data/store.js'
import { lines } from '../../data/content.js'
import { api } from '../../api.js'
import useApi from '../../useApi.js'
import { useDialogs } from '../../ui/DialogContext.js'
import Loading from '../../ui/Loading.jsx'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import { Tabs, EmptyRow, IconBtn, TableCard } from './parts.jsx'
import useSettings, { reloadSettings } from '../../data/useSettings.js'
import { SETTINGS_GROUPS } from './settingsGroups.js'

// Website Content — the admin changes everything the customer website shows:
// offers, services + prices, page text (Home, About, Contact, footer), booking rules,
// shop pages and lists. Everything is saved in MySQL.
// Shop products are inventory parts: edit them on the Inventory page ("Show in shop").
export default function AdminContent() {
  usePageTitle('Website Content')
  const { toast, confirm, form } = useDialogs()
  const [tab, setTab] = useState('offers')
  const offers = useApi('/content/admin/offers')
  const services = useApi('/content/admin/services')
  const settings = useSettings()
  const group = SETTINGS_GROUPS.find((g) => g.key === tab)

  // Edit one group of settings (Home page, Contact & footer, Booking rules …)
  async function editSettings(g) {
    const v = await form({ title: 'Edit ' + g.label, fields: g.fields, values: settings, submitText: 'Save changes' })
    if (!v) return
    try {
      await api('/content/admin/settings', { method: 'PATCH', body: v })
      await reloadSettings()           // every open page shows the new text straight away
      toast(g.label + ' saved')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const YES_NO = [{ value: 'yes', label: 'Yes — show on the website' }, { value: 'no', label: 'No — hide it' }]
  const toForm = (row) => ({ ...row, active: row.active ? 'yes' : 'no' })

  // Send a change to the backend, show a message, then load the list again
  async function save(fn, msg, list) {
    try {
      await fn()
      toast(msg)
      list.reload()
      return true
    } catch (err) {
      toast(err.message, 'error')
      return false
    }
  }

  /* ---------- offers ---------- */
  const offerFields = () => [
    { name: 'title', label: 'Offer title', required: true, col: 8, placeholder: 'e.g. Brake Pad Replacement' },
    { name: 'percent', label: 'Discount %', type: 'number', min: 1, max: 90, required: true, col: 4 },
    { name: 'serviceSlug', label: 'Service it is for', type: 'select', empty: 'Select service…', required: true,
      options: (services.data || []).map((s) => ({ value: s.slug, label: s.title })), help: 'Book Now on the slide opens this service, and Booking takes the % off.' },
    { name: 'endDate', label: 'Ends on', type: 'date', help: 'The offer hides itself the day after.' },
    { name: 'tag', label: 'Small label', placeholder: 'Limited time offer' },
    { name: 'image', label: 'Picture', placeholder: '/media/banner1.jpg', help: 'A file in autocare-react/public/media' },
    { name: 'text', label: 'Text under the title', type: 'textarea', col: 12, placeholder: 'Free inspection included with every booking.' },
    { name: 'points', label: 'Points (one per line)', type: 'textarea', col: 12, placeholder: '20% off brake pads\nFree inspection' },
    { name: 'active', label: 'Show on website?', type: 'select', options: YES_NO, required: true, default: 'yes' },
  ]
  async function addOffer() {
    const v = await form({ title: 'Add offer', fields: offerFields(), submitText: 'Add offer', values: { tag: 'Limited time offer', image: '/media/banner1.jpg' } })
    if (v) save(() => api('/content/admin/offers', { method: 'POST', body: v }), <><b>{v.title}</b> offer added</>, offers)
  }
  async function editOffer(o) {
    const v = await form({ title: 'Edit offer', fields: offerFields(), values: toForm(o), submitText: 'Save changes' })
    if (v) save(() => api('/content/admin/offers/' + o.id, { method: 'PATCH', body: v }), 'Offer updated', offers)
  }
  async function delOffer(o) {
    const ok = await confirm(<>The <b>{o.percent}% {o.title}</b> offer will be removed.</>, { title: 'Delete offer?', okText: 'Delete', danger: true })
    if (ok) save(() => api('/content/admin/offers/' + o.id, { method: 'DELETE' }), 'Offer deleted', offers)
  }
  const offerState = (o) => {
    if (!o.active) return ['Hidden', 'muted']
    if (o.endDate && o.endDate < today()) return ['Ended', 'danger']
    return ['On website', 'complete']
  }

  /* ---------- services ---------- */
  const serviceFields = (editing) => [
    { name: 'title', label: 'Service title', required: true, col: 8, placeholder: 'e.g. Wheel Alignment' },
    { name: 'price', label: 'Price from (Nu.)', type: 'number', min: 0, step: 10, required: true, col: 4 },
    { name: 'slug', label: 'Short code (for links)', required: true, pattern: '[a-z0-9-]+', placeholder: 'wheel-alignment',
      help: editing ? 'Changing it breaks old links to this service.' : 'Lowercase letters, numbers and dashes only.' },
    { name: 'serviceName', label: 'Name on repair jobs', placeholder: 'Same as the title if empty' },
    { name: 'image', label: 'Picture', placeholder: '/media/engine/engine3.jpg', help: 'A file in autocare-react/public/media' },
    { name: 'page', label: 'Page address (optional)', placeholder: '/services/brake', help: 'Leave empty to use /services/<short code>.' },
    { name: 'shortText', label: 'Short description (cards)', type: 'textarea', col: 12 },
    // ----- details page -----
    { name: 'intro', label: 'Details page: first sentence', col: 12, placeholder: 'Safe, quiet and reliable stopping power…' },
    { name: 'description', label: 'Details page: text (one paragraph per line)', type: 'textarea', col: 12 },
    { name: 'points', label: 'Details page: ✓ points (one per line)', type: 'textarea', col: 12, placeholder: 'Free inspection with every booking' },
    { name: 'gallery', label: 'Details page: pictures (one path per line, max 3)', type: 'textarea', col: 12, placeholder: '/media/brake/brake1.png\n/media/brake/brake2.jpg' },
    { name: 'sortOrder', label: 'Order on the page', type: 'number', min: 0, col: 4, default: 10 },
    { name: 'active', label: 'Show on website?', type: 'select', options: YES_NO, required: true, default: 'yes', col: 8 },
  ]
  async function addService() {
    const v = await form({ title: 'Add service', fields: serviceFields(false), submitText: 'Add service' })
    if (v) save(() => api('/content/admin/services', { method: 'POST', body: v }), <><b>{v.title}</b> added</>, services)
  }
  async function editService(s) {
    const v = await form({ title: 'Edit service', fields: serviceFields(true), values: toForm(s), submitText: 'Save changes' })
    if (v) save(() => api('/content/admin/services/' + s.id, { method: 'PATCH', body: v }), 'Service updated', services)
  }
  async function delService(s) {
    const used = (offers.data || []).filter((o) => o.serviceSlug === s.slug)
    if (used.length) return toast(`${s.title} is used by ${used.length} offer(s). Delete or change the offer first.`, 'warn')
    const ok = await confirm(<><b>{s.title}</b> will be removed from the website. Old repair jobs keep their service name.</>, { title: 'Delete service?', okText: 'Delete', danger: true })
    if (ok) save(() => api('/content/admin/services/' + s.id, { method: 'DELETE' }), s.title + ' deleted', services)
  }

  const list = tab === 'offers' ? offers : services
  const tabs = [['offers', 'Offers (home slideshow)', (offers.data || []).length], ['services', 'Services & prices', (services.data || []).length],
    ...SETTINGS_GROUPS.map((g) => [g.key, g.label])]

  return (
    <>
      <ATopbar title="Website Content" sub="Offers, services and prices shown on the customer website">
        {tab === 'offers' && <button className="a-btn a-btn-primary" onClick={addOffer}><i className="bi bi-plus-lg"></i> Add Offer</button>}
        {tab === 'services' && <button className="a-btn a-btn-primary" onClick={addService}><i className="bi bi-plus-lg"></i> Add Service</button>}
        {group && settings && <button className="a-btn a-btn-primary" onClick={() => editSettings(group)}><i className="bi bi-pencil"></i> Edit {group.label}</button>}
      </ATopbar>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      <p className="text-muted small mb-3"><i className="bi bi-info-circle me-1"></i>Shop products and their prices are edited on the <b>Inventory</b> page (edit a part → “Show in shop”).</p>

      {group ? (
        !settings ? <Loading /> : (
          <TableCard head={['Setting', 'What the website shows now']} foot={<>Click <b>Edit {group.label}</b> to change these</>}>
            {group.fields.map((f) => (
              <tr key={f.name}>
                <td style={{ width: '28%' }}><strong>{f.label}</strong>{f.help && <small>{f.help}</small>}</td>
                <td style={{ whiteSpace: 'pre-wrap' }}>{settings[f.name] || '—'}</td>
              </tr>
            ))}
          </TableCard>
        )
      ) : (list.loading || list.error) ? <Loading error={list.error} onRetry={list.reload} /> : tab === 'offers' ? (
        <TableCard head={['Offer', 'Service', 'Ends', 'Points', 'Status', '']} foot={`${offers.data.length} offer${offers.data.length === 1 ? '' : 's'}`}>
          {offers.data.length === 0 && <EmptyRow cols={6} text="No offers yet — the home page shows only the welcome slide" />}
          {offers.data.map((o) => {
            const [label, cls] = offerState(o)
            const svc = (services.data || []).find((s) => s.slug === o.serviceSlug)
            return (
              <tr key={o.id}>
                <td><strong>{o.percent}% off · {o.title}</strong><small>{o.tag}</small></td>
                <td>{svc ? svc.title : (o.serviceSlug || '—')}{svc && <small>{nu(svc.price)} → {nu(Math.round(svc.price * (100 - o.percent) / 100))}</small>}</td>
                <td>{o.endDate ? fmtDate(o.endDate) : 'No end date'}</td>
                <td><small>{lines(o.points).join(' · ') || '—'}</small></td>
                <td><span className={'a-badge a-badge-' + cls}>{label}</span></td>
                <td><div className="a-actions">
                  <IconBtn icon="bi-pencil" title="Edit" onClick={() => editOffer(o)} />
                  <IconBtn icon="bi-trash3" title="Delete" tone="danger" onClick={() => delOffer(o)} />
                </div></td>
              </tr>
            )
          })}
        </TableCard>
      ) : (
        <TableCard head={['Service', 'Price from', 'Details page', 'Order', 'Status', '']} foot={`${services.data.length} service${services.data.length === 1 ? '' : 's'}`}>
          {services.data.length === 0 && <EmptyRow cols={6} text="No services yet" />}
          {services.data.map((s) => (
            <tr key={s.id}>
              <td><strong>{s.title}</strong><small>{s.slug}{s.serviceName !== s.title ? ' · ' + s.serviceName : ''}</small></td>
              <td>{nu(s.price)}</td>
              <td>{s.active ? <a href={s.page || '/services/' + s.slug} target="_blank" rel="noreferrer">{s.page || '/services/' + s.slug}</a> : '—'}</td>
              <td>{s.sortOrder}</td>
              <td><span className={'a-badge a-badge-' + (s.active ? 'complete' : 'muted')}>{s.active ? 'On website' : 'Hidden'}</span></td>
              <td><div className="a-actions">
                <IconBtn icon="bi-pencil" title="Edit" onClick={() => editService(s)} />
                <IconBtn icon="bi-trash3" title="Delete" tone="danger" onClick={() => delService(s)} />
              </div></td>
            </tr>
          ))}
        </TableCard>
      )}
    </>
  )
}
