// ============================================================
// ADMIN ROUTE
// ============================================================
// Works identically to ProtectedRoute but with an additional
// role check on top of the login check.
//
// Three possible states when hitting an admin route:
// 1. Not logged in        → redirect to /login
// 2. Logged in, not admin → redirect to / (home), not /login
//    (they're authenticated, just not authorized — sending them
//     to login would be confusing since they ARE logged in)
// 3. Logged in as admin   → render the page
// ============================================================

import { Navigate } from 'react-router-dom'
import { useAuth }  from '../context/AuthContext'

function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin, isLoading } = useAuth()

  // While AuthContext is checking localStorage on startup,
  // render nothing — prevents a flash of redirect before
  // we know whether the user is actually logged in or not
  if (isLoading) return null

  // Not logged in at all — send to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // Logged in but not admin — send to home
  // We don't send to /login because they ARE logged in —
  // sending them there would be confusing and they'd just
  // get redirected back here in a loop
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  // Logged in AND admin — render the protected content
  return children
}

export default AdminRoute