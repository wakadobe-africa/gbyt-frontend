// ============================================================
// ADMIN SEARCHES PAGE
// ============================================================
// Platform-wide gift search audit log.
// Shows every gift search across all users — useful for
// understanding what people are actually searching for,
// spotting patterns, and debugging user-reported issues.
// ============================================================

import { useState, useEffect } from 'react'
import { useAuth }             from '../../context/AuthContext'
import { getAdminSearches } from '../../services/apiService'

function AdminSearches() {
  const [searches,  setSearches]  = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState(null)

  const { token } = useAuth()

  useEffect(() => {
    async function fetchSearches() {
      try {
        const data = await getAdminSearches(token)
        setSearches(data.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSearches()
  }, [token])

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year:   'numeric',
      month:  'short',
      day:    'numeric',
      hour:   '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="admin-page">
        <h1>Gift Search Log</h1>
        <div className="admin-loading">Loading searches...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-page">
        <h1>Gift Search Log</h1>
        <div className="admin-error">⚠️ {error}</div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Gift Search Log</h1>
        <span className="admin-count-badge">
          {searches.length} searches
        </span>
      </div>

      <p className="admin-page-description">
        Most recent 100 gift searches across all users.
        Use this to understand what people are actually looking for.
      </p>

      {searches.length === 0 ? (
        <div className="admin-empty">
          <p>No gift searches yet.</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Recipient</th>
                <th>Relationship</th>
                <th>Occasion</th>
                <th>Budget</th>
                <th>Zodiac</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {searches.map(search => (
                <tr key={search.id}>

                  <td className="user-email-cell">
                    {/* Truncate long emails so the table doesn't
                        get too wide — tooltip shows the full email */}
                    <span title={search.user_email}>
                      {search.user_email?.split('@')[0]}
                      <span className="email-domain">
                        @{search.user_email?.split('@')[1]}
                      </span>
                    </span>
                  </td>

                  <td>
                    {search.recipient_name || '—'}
                  </td>

                  <td>
                    {search.relationship
                      ? <span className="relationship-tag">{search.relationship}</span>
                      : '—'
                    }
                  </td>

                  <td>
                    <span className="occasion-tag">{search.occasion}</span>
                  </td>

                  <td className="budget-cell">
                    ₦{Number(search.budget).toLocaleString()}
                  </td>

                  <td>
                    {search.zodiac_sign
                      ? <span className="zodiac-tag">{search.zodiac_sign}</span>
                      : '—'
                    }
                  </td>

                  <td className="date-cell">
                    {formatDate(search.created_at)}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminSearches