import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api.js'
import usePageTitle from '../../ui/usePageTitle.js'
import useSettings from '../../data/useSettings.js'
import { useAuth } from '../../auth/AuthContext.js'
import '../../styles/login.css'

// /verify-email?token=…&answer=yes|no — opened from the "Is it you?" email after sign-up.
//   yes -> the backend makes the customer account   no -> the sign-up is deleted
// All texts come from MySQL (admin → Website Content → Login & profile).
export default function VerifyEmail() {
  usePageTitle('Confirm Email')
  const s = useSettings() || {}
  const navigate = useNavigate()
  const { start } = useAuth()
  const [params] = useSearchParams()
  const [result, setResult] = useState(null)   // { answer, name } or { error }
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return                     // only once (React runs effects twice in dev mode)
    sent.current = true
    api('/auth/verify-email', { method: 'POST', body: { token: params.get('token'), answer: params.get('answer') } })
      .then((data) => {
        if (data.token) start(data.token, data.user)   // "Yes" -> the customer is logged in now
        setResult(data)
      })
      .catch((err) => setResult({ error: err.message }))
  }, [params, start])

  let icon = 'bi bi-hourglass-split', title = 'Checking your link…', text = '', color = ''
  if (result && result.error) {
    icon = 'bi bi-x-lg'; title = 'This link does not work'; text = result.error; color = ' vf-bad'
  } else if (result && result.answer === 'no') {
    icon = 'bi bi-shield-check'; title = s.verifyNoTitle || 'Thank you for telling us'; text = s.verifyNoText || ''
  } else if (result) {
    icon = 'bi bi-check-lg'; title = s.verifyYesTitle || 'Your email is confirmed!'
    text = String(s.verifyYesText || 'Your account is ready, you can sign in now.').split('{name}').join(String(result.name || '').split(' ')[0])
  }

  return (
    <div className="lg lg-page">
      <div className={'am-card am-success' + color}>
        <span className="am-success-icon"><i className={icon}></i></span>
        <h3>{title}</h3>
        {text && <p>{text}</p>}
        {result && (
          <div className="am-success-btns">
            {result.token ? (
              <>
                <button className="lg-btn" onClick={() => navigate('/booking', { replace: true })}><i className="bi bi-calendar-plus"></i> Book a service</button>
                <button className="am-btn-ghost" onClick={() => navigate('/', { replace: true })}>Go to the website</button>
              </>
            ) : result.answer === 'yes' && !result.error
              ? <button className="lg-btn" onClick={() => navigate('/login', { replace: true })}>Sign in <i className="bi bi-arrow-right"></i></button>
              : <button className="lg-btn" onClick={() => navigate('/', { replace: true })}>Go to the website</button>}
          </div>
        )}
      </div>
    </div>
  )
}
