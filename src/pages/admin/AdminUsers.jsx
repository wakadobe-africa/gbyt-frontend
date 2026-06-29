// ============================================================
// ADMIN USERS PAGE
// ============================================================
// Shows all registered users with their stats.
// Includes a search filter — admins often need to find a
// specific user by email without scrolling through a full list.
// ============================================================

import { useState, useEffect } from 'react'
import { useAuth }             from '../../context/AuthContext'
import { getAdminUsers } from '../../services/apiService'


function AdminUsers() {
  const [users,     setUsers]     = useState([])
  const [filtered,  setFiltered]  = useState([])
  const [search,    setSearch]    = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState(null)

  const { token } = useAuth()

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getAdminUsers(token)
        setUsers(data.data)
        setFiltered(data.data)  // filtered starts as the full list

      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [token])

  // Filter users as the admin types in the search box.
  // We use useEffect here (watching `search`) rather than
  // filtering inline in the render — this keeps the render
  // function clean and makes the filtering logic easy to
  // extend later (e.g. filter by role, date range, etc.)
  useEffect(() => {
    if (!search.trim()) {
      // Empty search = show everyone
      setFiltered(users)
      return
    }

    const lowerSearch = search.toLowerCase()
    setFiltered(
      users.filter(user =>
        // Match against email or fullname
        user.email.toLowerCase().includes(lowerSearch) ||
        user.fullname?.toLowerCase().includes(lowerSearch)
      )
    )
  }, [search, users])

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year:  'numeric',
      month: 'short',
      day:   'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="admin-page">
        <h1>Users</h1>
        <div className="admin-loading">Loading users...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-page">
        <h1>Users</h1>
        <div className="admin-error">⚠️ {error}</div>
      </div>
    )
  }
    console.log('users:', users.length, 'filtered:', filtered.length, 'search:', search)
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Users</h1>
        {/* Live count — updates as the admin filters */}
        <span className="admin-count-badge">
          {filtered.length} of {users.length}
        </span>
      </div>

      {/* Search filter */}
      <div className="admin-search-bar">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />
        {/* Clear button — only shows when there's search text */}
        {search && (
          <button
            onClick={() => setSearch('')}
            className="admin-search-clear"
          >
            ✕
          </button>
        )}
      </div>

      {/* Users table */}
      {filtered.length === 0 ? (
        <div className="admin-empty">
          <p>No users match "{search}"</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Searches</th>
                <th>Last Active</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>

                  <td>
                    <div className="user-cell">
                      {/* Avatar — initials from email */}
                      <div className="user-avatar">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="user-name">
                          {user.fullname || '—'}
                        </div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    {/* Role badge — admin gets a distinct color */}
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>

                  <td className="text-center">
                    {/* total_searches comes from the COUNT() in
                        our backend query — could be 0 for new users */}
                    {user.total_searches || 0}
                  </td>

                  <td>
                    {user.last_search_at
                      ? formatDate(user.last_search_at)
                      : 'Never searched'
                    }
                  </td>

                  <td>{formatDate(user.created_at)}</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminUsers