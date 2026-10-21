// Shown while data is loading from the backend, or when it failed
export default function Loading({ error, onRetry }) {
  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center gap-3 flex-wrap">
        <span><i className="bi bi-exclamation-triangle me-2"></i>{error}</span>
        {onRetry && <button className="btn btn-sm btn-outline-danger" onClick={onRetry}>Try again</button>}
      </div>
    )
  }
  return (
    <div className="text-center text-muted py-5">
      <span className="spinner-border spinner-border-sm me-2"></span> Loading…
    </div>
  )
}
