import { api } from '../../api.js'
import { useDialogs } from '../../ui/DialogContext.js'
import Loading from '../../ui/Loading.jsx'
import usePageTitle from '../../ui/usePageTitle.js'
import ATopbar from './ATopbar.jsx'
import { TableCard } from './parts.jsx'
import useSettings, { reloadSettings } from '../../data/useSettings.js'
import { MECHANIC_GROUPS } from './mechanicGroups.js'

// Mechanic Portal — the words mechanics see in THEIR portal (titles, notifications, menus).
// Kept apart from "Website Content" (which is only for the customer website),
// so the admin never mixes them up. Saved in the same MySQL table `settings`.
export default function AdminMechanicPortal() {
  usePageTitle('Mechanic Portal')
  const { toast, form } = useDialogs()
  const settings = useSettings()

  async function editGroup(g) {
    const v = await form({ title: 'Edit ' + g.label, fields: g.fields, values: settings, submitText: 'Save changes' })
    if (!v) return
    try {
      await api('/content/admin/settings', { method: 'PATCH', body: v })
      await reloadSettings()           // the mechanic pages show the new words straight away
      toast(g.label + ' saved')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <ATopbar title="Mechanic Portal" sub="The words mechanics see in their portal (not the customer website)" />
      <p className="text-muted small mb-3">
        <i className="bi bi-info-circle me-1"></i>
        Words in <b>{'{curly brackets}'}</b> are filled in by the system, e.g. <b>{'{name}'}</b> becomes the mechanic’s name. Keep them in the text.
      </p>

      {!settings ? <Loading /> : MECHANIC_GROUPS.map((g) => (
        <div className="mb-4" key={g.key}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0"><i className={'bi ' + g.icon + ' me-2'}></i>{g.label}</h5>
            <button className="a-btn a-btn-primary a-btn-sm" onClick={() => editGroup(g)}><i className="bi bi-pencil"></i> Edit</button>
          </div>
          <TableCard head={['Text', 'What mechanics see now']}>
            {g.fields.map((f) => (
              <tr key={f.name}>
                <td style={{ width: '32%' }}><strong>{f.label}</strong>{f.help && <small>{f.help}</small>}</td>
                <td>{settings[f.name] || '—'}</td>
              </tr>
            ))}
          </TableCard>
        </div>
      ))}
    </>
  )
}
