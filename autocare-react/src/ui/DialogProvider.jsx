import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DialogContext } from './DialogContext.js'

/* Toasts, confirm boxes, form pop-ups and detail pop-ups for the whole app.
   They return Promises so pages can write:
     const ok = await confirm('Delete this?')
     const values = await form({ title, fields })                       */

function Modal({ size, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open') }
  }, [onClose])
  return (
    <>
      <div className="modal fade show d-block a-modal" tabIndex={-1} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <div className={'modal-dialog modal-dialog-centered modal-dialog-scrollable ' + (size || '')}>
          <div className="modal-content">{children}</div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  )
}

function FormModal({ opts, onDone }) {
  const initial = {}
  opts.fields.forEach((f) => {
    const v = opts.values && opts.values[f.name] != null ? opts.values[f.name] : f.default != null ? f.default : ''
    initial[f.name] = v
  })
  const [vals, setVals] = useState(initial)
  const [tried, setTried] = useState(false)
  const formRef = useRef(null)

  useEffect(() => {
    const first = formRef.current && formRef.current.querySelector('input,select,textarea')
    if (first) first.focus()
  }, [])

  function set(name, v) { setVals((p) => ({ ...p, [name]: v })) }

  function submit(e) {
    e.preventDefault()
    if (!formRef.current.checkValidity()) {
      setTried(true)
      const bad = formRef.current.querySelector(':invalid')
      if (bad) bad.focus()
      return
    }
    const out = {}
    opts.fields.forEach((f) => {
      let x = vals[f.name]
      if (typeof x === 'string') x = x.trim()
      if (f.type === 'number') x = x === '' ? 0 : Number(x)
      out[f.name] = x
    })
    if (opts.validate) {
      const err = opts.validate(out)
      if (err) return opts.toast(err, 'error')
    }
    onDone(out)
  }

  return (
    <Modal size={opts.size === 'sm' ? '' : 'modal-lg'} onClose={() => onDone(null)}>
      <form ref={formRef} noValidate onSubmit={submit} className={tried ? 'was-validated' : ''}>
        <div className="modal-header">
          <h5 className="a-modal-title">{opts.title}</h5>
          <button type="button" className="btn-close" onClick={() => onDone(null)}></button>
        </div>
        <div className="modal-body">
          <div className="row g-3">
            {opts.fields.map((f) => {
              const common = {
                className: 'a-form-control', name: f.name, required: f.required, value: vals[f.name],
                onChange: (e) => set(f.name, e.target.value),
              }
              let input
              if (f.type === 'select') {
                input = (
                  <select {...common}>
                    {f.empty && <option value="">{f.empty}</option>}
                    {f.options.map((o) => {
                      const ov = typeof o === 'object' ? o.value : o
                      const ol = typeof o === 'object' ? o.label : o
                      return <option key={ov} value={ov}>{ol}</option>
                    })}
                  </select>
                )
              } else if (f.type === 'textarea') {
                input = <textarea rows={3} placeholder={f.placeholder} {...common} />
              } else {
                input = <input type={f.type || 'text'} min={f.min} max={f.max} step={f.step} placeholder={f.placeholder} pattern={f.pattern} {...common} />
              }
              const help = typeof f.help === 'function' ? f.help(vals) : f.help
              return (
                <div className={'col-md-' + (f.col || 6)} key={f.name}>
                  <label className="a-form-label">{f.label}{f.required && <span className="text-danger"> *</span>}</label>
                  {input}
                  {help && <div className="a-form-help">{help}</div>}
                </div>
              )
            })}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="a-btn a-btn-outline" onClick={() => onDone(null)}>Cancel</button>
          <button type="submit" className="a-btn a-btn-primary"><i className="bi bi-check2"></i> {opts.submitText || 'Save'}</button>
        </div>
      </form>
    </Modal>
  )
}

const TOAST_ICONS = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill', warn: 'bi-exclamation-triangle-fill' }

export default function DialogProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialog, setDialog] = useState(null) // { kind, opts, resolve }
  const [viewer, setViewer] = useState(null) // { title, body, footer }

  const toast = useCallback((msg, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const api = useMemo(() => ({
    toast,
    confirm: (message, opts = {}) => new Promise((resolve) => setDialog({ kind: 'confirm', opts: { ...opts, message }, resolve })),
    form: (opts) => new Promise((resolve) => setDialog({ kind: 'form', opts: { ...opts, toast }, resolve })),
    view: (title, body, footer) => setViewer({ title, body, footer }),
    closeView: () => setViewer(null),
  }), [toast])

  function finish(result) {
    const d = dialog
    setDialog(null)
    d.resolve(result)
  }

  return (
    <DialogContext.Provider value={api}>
      {children}

      {viewer && (
        <Modal size="modal-lg" onClose={() => setViewer(null)}>
          <div className="modal-header">
            <h5 className="a-modal-title">{viewer.title}</h5>
            <button type="button" className="btn-close" onClick={() => setViewer(null)}></button>
          </div>
          <div className="modal-body">{viewer.body}</div>
          <div className="modal-footer">
            {viewer.footer}
            <button className="a-btn a-btn-outline" onClick={() => setViewer(null)}>Close</button>
          </div>
        </Modal>
      )}

      {dialog && dialog.kind === 'confirm' && (
        <Modal size="modal-sm" onClose={() => finish(false)}>
          <div className="modal-body text-center p-4">
            <div className={'a-confirm-icon ' + (dialog.opts.danger ? 'danger' : '')}>
              <i className={'bi ' + (dialog.opts.danger ? 'bi-trash3' : 'bi-question-lg')}></i>
            </div>
            <h5 className="a-modal-title mb-2">{dialog.opts.title || 'Are you sure?'}</h5>
            <p className="text-muted small mb-4">{dialog.opts.message}</p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="a-btn a-btn-outline" onClick={() => finish(false)}>Cancel</button>
              <button className={'a-btn ' + (dialog.opts.danger ? 'a-btn-danger' : 'a-btn-primary')} onClick={() => finish(true)} autoFocus>
                {dialog.opts.okText || 'Confirm'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {dialog && dialog.kind === 'form' && <FormModal opts={dialog.opts} onDone={finish} />}

      <div className="a-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={'a-toast show a-toast-' + t.type}>
            <i className={'bi ' + (TOAST_ICONS[t.type] || TOAST_ICONS.success)}></i><span>{t.msg}</span>
          </div>
        ))}
      </div>
    </DialogContext.Provider>
  )
}
