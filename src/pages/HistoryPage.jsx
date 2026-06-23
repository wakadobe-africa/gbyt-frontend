import { useState, useEffect } from 'react'
import { Link }                from 'react-router-dom'
import { useAuth }             from '../context/AuthContext'
import { getGiftHistory, deleteGiftSearch } from '../services/apiService'

function HistoryPage() {
  const [history,   setHistory]   = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState(null)

  // Get token from auth context to make authenticated requests
  const { token } = useAuth()

  // Fetch history when component mounts
  // useEffect with [] runs once — like "on page load"
  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    try {
      setIsLoading(true)
      const data = await getGiftHistory(token)
      setHistory(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteGiftSearch(id, token)
      // Remove from local state immediately
      // No need to refetch from server — we know it's gone
      // This is called "optimistic update"
      setHistory(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      setError('Failed to delete')
    }
  }

  // Format date nicely
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year:  'numeric',
      month: 'long',
      day:   'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="history-page">
        <div className="loading">Loading your gift history...</div>
      </div>
    )
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>Your Gift History</h1>
        <p>All your past gift searches saved in one place</p>
      </div>

      {error && (
        <div className="error-message">⚠️ {error}</div>
      )}

      {history.length === 0 ? (
        // Empty state — shown when no searches saved yet
        <div className="empty-history">
          <span className="empty-icon">🎁</span>
          <h2>No searches yet</h2>
          <p>Your gift searches will appear here after you save them</p>
          <Link to="/search" className="cta-button">
            Find Your First Gift
          </Link>
        </div>
      ) : (
        <div className="history-list">
          {history.map(item => (
            <div key={item.id} className="history-card">

              <div className="history-card-header">
                <div>
                  <h3>{recipientName}-{item.occasion}</h3>
                  <p className="history-meta">
                    Budget: ₦{Number(item.budget).toLocaleString()} ·{' '}
                    {formatDate(item.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>

              {/* Show a preview of the suggestions */}
              {/* Show a preview of the suggestions */}
              <div className="history-suggestions">
                {(() => {
                  // Saved suggestions are stored as a JSON STRING in the database.
                  // We parse it back into an object here, then pull out just the
                  // first option's title for a clean, short preview — rather than
                  // dumping raw JSON text at the user, which would look broken.
                  try {
                    const parsed = JSON.parse(item.suggestions)
                    const firstTitle = parsed.options?.[0]?.title || 'Gift suggestions saved'
                    return `${firstTitle} and ${parsed.options.length - 1} more option(s)`
                  } catch {
                    // Defensive fallback — if parsing ever fails for old data
                    // saved before this change, don't crash, just show something
                    return 'Saved gift search'
                  }
                })()}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default HistoryPage