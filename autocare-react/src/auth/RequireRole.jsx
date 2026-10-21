import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.js'

// Wrap any page:  <RequireRole roles={['admin']}> ... </RequireRole>
// - not logged in      → sent to /login (and brought back after login)
// - wrong role         → sent to /no-access
export default function RequireRole({ roles, children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (!roles.includes(user.role)) {
    return <Navigate to="/no-access" replace />
  }
  return children
}
