import { Navigate } from 'react-router-dom'
import { useAuth }  from '../context/AuthContext'

// This component wraps any page that requires login
// If user is logged in → show the page
// If user is not logged in → redirect to login
// Usage: <ProtectedRoute><SearchPage /></ProtectedRoute>

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()

  if (!isLoggedIn) {
    // Navigate component redirects without rendering anything
    // replace means the login page replaces current history entry
    // so pressing back doesn't loop them back to the protected page
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute