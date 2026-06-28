import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth }              from '../context/AuthContext'

function Navbar() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-logo">
        🎁 GiftMap
      </NavLink>

      <div className="nav-links">
        <NavLink
          to="/"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          end
        >
          Home
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          Find a Gift
        </NavLink>

              {/* Only show these links if logged in */}
              {isLoggedIn && (
                <NavLink
                  to="/history"
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  History
                </NavLink>
              )}

              <NavLink
                to="/about"
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                About
              </NavLink>
            </div>
              {isLoggedIn && isAdmin && (
        <NavLink
          to="/admin"
          className={({ isActive }) => isActive ? 'nav-link active admin-link' : 'nav-link admin-link'}
        >
          ⚙️ Admin
        </NavLink>
      )}
      {/* Right side — show user info or login button */}
      <div className="nav-auth">
        {isLoggedIn ? (
          // Logged in state
          <div className="nav-user">
            <span className="nav-email">{user?.email}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        ) : (
          // Logged out state
          <div className="nav-auth-links">
            <NavLink to="/login" className="nav-link">
              Sign In
            </NavLink>
            <NavLink to="/register" className="cta-button-small">
              Get Started
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar