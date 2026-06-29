// ============================================================
// ADMIN LAYOUT
// ============================================================
// This is a SHELL component — it provides the persistent
// structure (sidebar + header) that wraps every admin page.
//
// The key concept here is LAYOUT COMPOSITION:
// Instead of every admin page building its own navigation,
// we define navigation ONCE in this layout and pass the
// page's actual content in as {children}.
//
// Think of it like a picture frame — the frame stays the same,
// only the picture inside changes. AdminDashboard, AdminUsers,
// and AdminSearches are the "pictures" — they slot into the
// frame without knowing or caring about the sidebar around them.
//
// This is also why we wrap admin routes in AdminLayout in
// App.jsx rather than importing it inside each admin page —
// the layout is the PARENT's concern, not the child's.
// ============================================================

import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Navigation items for the admin sidebar.
// Defined as data (an array of objects) rather than hardcoded JSX,
// so adding a new admin section later is a one-line change here,
// not a new block of JSX to write and style.
const ADMIN_NAV_ITEMS = [
  {
    path:  '/admin',
    label: 'Dashboard',
    icon:  '📊',
    // end: true means this link only shows as "active" when the URL
    // is EXACTLY /admin — not /admin/users or /admin/searches.
    // Without end: true, the Dashboard link would always appear
    // active because /admin is a prefix of every other admin route.
    end:   true
  },
  {
    path:  '/admin/users',
    label: 'Users',
    icon:  '👥',
    end:   false
  },
  {
    path:  '/admin/searches',
    label: 'Gift Searches',
    icon:  '🎁',
    end:   false
  }
]

function AdminLayout({ children }) {
  // We need user info for the header (show who's logged in as admin)
  // and navigate for the "back to app" button
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    // Log out and send to home — not to /admin/login since
    // we're using the same login flow for both admin and regular users
    logout()
    navigate('/')
  }

  return (
    // The outermost div is the full-screen container.
    // We use CSS Grid to create the sidebar + content layout —
    // Grid is better than Flexbox here because we need precise
    // control over column widths across the full viewport height.
    <div className="admin-shell">

      {/* ── SIDEBAR ─────────────────────────────────────────
          The sidebar is fixed in position — it doesn't scroll
          with the content area. This is standard admin panel
          behavior and keeps navigation always accessible
          regardless of how long the content area is.
      ──────────────────────────────────────────────────────── */}
      <aside className="admin-sidebar">

        {/* Sidebar header — brand identity for the admin section */}
        <div className="admin-sidebar-header">
          <span className="admin-brand">⚙️ GiftMap</span>
          <span className="admin-badge">Admin</span>
        </div>

        {/* Navigation links — generated from ADMIN_NAV_ITEMS array.
            NavLink from React Router automatically adds the "active"
            class when its path matches the current URL — we use this
            to highlight which section the admin is currently viewing. */}
        <nav className="admin-nav">
          {ADMIN_NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                // isActive is provided by NavLink — it's true when
                // the current URL matches this link's path.
                // We use it to apply the 'active' class conditionally,
                // which our CSS uses to highlight the current section.
                isActive ? 'admin-nav-link active' : 'admin-nav-link'
              }
            >
              {/* Icon + label side by side */}
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer — shows who's logged in and provides
            escape hatches back to the regular app or to logout.
            Positioned at the bottom of the sidebar, separate
            from the navigation links above. */}
        <div className="admin-sidebar-footer">

          {/* Divider line */}
          <div className="admin-sidebar-divider" />

          {/* Back to main app — admin should be able to switch
              context back to the regular user view easily */}
          <button
            className="admin-sidebar-action"
            onClick={() => navigate('/')}
          >
            <span>←</span>
            <span>Back to App</span>
          </button>

          {/* Who is logged in */}
          <div className="admin-user-info">
            <span className="admin-user-email">{user?.email}</span>
            <span className="admin-user-role">Administrator</span>
          </div>

          {/* Logout */}
          <button
            className="admin-sidebar-action logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            <span>Logout</span>
          </button>

        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ───────────────────────────────
          This is where each admin page renders.
          {children} is whatever page is currently active —
          AdminDashboard, AdminUsers, or AdminSearches.
          The layout doesn't know or care which page it is —
          it just provides the frame, the page provides the content.
      ──────────────────────────────────────────────────────── */}
      <main className="admin-main">

        {/* Top bar — shows current section title and admin info */}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            {/* Page title comes from the active NavLink's label —
                we find which item matches the current path */}
            <h1 className="admin-page-title">
              {/* We could use useLocation() to derive the title,
                  but each page will set its own title via an
                  <h1> inside the content — this topbar just
                  shows a consistent platform identifier */}
              Platform Management
            </h1>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-topbar-user">
              Logged in as <strong>{user?.email}</strong>
            </span>
          </div>
        </div>

        {/* The actual page content — slots in here */}
        <div className="admin-content">
          {children}
        </div>

      </main>
    </div>
  )
}

export default AdminLayout