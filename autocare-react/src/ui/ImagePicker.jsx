import { useRef, useState } from 'react'

// Picture upload used in admin forms (FormModal types 'image' and 'images').
// The chosen picture is made smaller in the browser (max 900 px wide, JPG) and kept as text
// ("data:image/jpeg;base64,…"), which is saved in MySQL together with the form.
// Old pictures saved as a path (/media/brake/brake1.png) keep working.

function shrinkImage(file, maxW = 900) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose a picture (JPG, PNG or WEBP).'))
    if (file.size > 10 * 1024 * 1024) return reject(new Error('This picture is too big (10 MB at most).'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read this file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('This file is not a picture.'))
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// value: one picture ('image') or several pictures, one per line ('images')
export default function ImagePicker({ value, onChange, multiple, max = 3, onError }) {
  const box = useRef(null)
  const [busy, setBusy] = useState(false)
  const list = multiple ? String(value || '').split('\n').map((x) => x.trim()).filter(Boolean) : (value ? [value] : [])
  const full = multiple ? list.length >= max : false

  async function pick(e) {
    const files = [...e.target.files].slice(0, multiple ? max - list.length : 1)
    e.target.value = ''                       // so the same file can be chosen again
    if (!files.length) return
    setBusy(true)
    try {
      const pics = []
      for (const f of files) pics.push(await shrinkImage(f))
      onChange(multiple ? [...list, ...pics].join('\n') : pics[0])
    } catch (err) {
      if (onError) onError(err.message)
    }
    setBusy(false)
  }

  function remove(i) {
    const next = list.filter((_, k) => k !== i)
    onChange(multiple ? next.join('\n') : '')
  }

  return (
    <div className="a-img-picker">
      <div className="a-img-list">
        {list.map((src, i) => (
          <div className="a-img-thumb" key={i}>
            <img src={src} alt="" />
            <button type="button" className="a-img-remove" onClick={() => remove(i)} title="Remove picture" aria-label="Remove picture">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        ))}
        {!full && (
          <button type="button" className="a-img-add" onClick={() => box.current.click()} disabled={busy}>
            {busy ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-image"></i>}
            <span>{list.length && !multiple ? 'Change picture' : 'Upload picture'}</span>
          </button>
        )}
      </div>
      <input ref={box} type="file" accept="image/jpeg,image/png,image/webp" hidden multiple={multiple} onChange={pick} />
    </div>
  )
}
