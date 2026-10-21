import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="c-center">
      <div className="text-center">
        <h1 className="display-3 fw-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--a-purple)' }}>404</h1>
        <p className="text-muted">That page doesn’t exist.</p>
        <Link to="/" className="a-btn a-btn-primary">Back to home</Link>
      </div>
    </div>
  )
}
