import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useState }                        from 'react'
import { useAuth }                         from '../context/AuthContext'
import { saveGiftSearch }                  from '../services/apiService'
import GiftResults                         from '../components/GiftResults'

function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token, isLoggedIn } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved,  setIsSaved]  = useState(false)
  const [saveError, setSaveError] = useState(null)

  const { suggestions, recipientName, budget, occasion } = location.state || {}

  if (!suggestions) {
    return (
      <div className="empty-results">
        <h2>No results found</h2>
        <p>Please search for a gift first</p>
        <Link to="/search" className="cta-button">Go to Search</Link>
      </div>
    )
  }

  async function handleSave() {
    if (!isLoggedIn) {
      // Redirect to login if not authenticated
      navigate('/login')
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      await saveGiftSearch({
        occasion,
        budget,
        suggestions,
        recipient_name: recipientName
      }, token)

      // Mark as saved so button changes
      setIsSaved(true)

    } catch (err) {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="results-page">
      <div className="results-header">
        <h1>Gift Ideas for {recipientName}</h1>
        <p>{occasion} · Budget: ₦{Number(budget).toLocaleString()}</p>
      </div>

      <GiftResults suggestions={suggestions} budget={budget} />

      {saveError && (
        <div className="error-message">⚠️ {saveError}</div>
      )}

      <div className="results-actions">
        <button
          onClick={() => navigate('/search')}
          className="secondary-button"
        >
          ← Search Again
        </button>

        {/* Save button changes state after saving */}
        <button
          onClick={handleSave}
          disabled={isSaving || isSaved}
          className="cta-button"
        >
          {isSaved   ? '✅ Saved!'        :
           isSaving  ? 'Saving...'        :
           isLoggedIn ? 'Save These Gifts' :
                        'Login to Save'}
        </button>
      </div>
    </div>
  )
}

export default ResultsPage