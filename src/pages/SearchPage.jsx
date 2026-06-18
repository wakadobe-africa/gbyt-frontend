import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import GiftForm from '../components/GiftForm'
import GiftResultsSkeleton from '../components/GiftResultSkeleton'
import { getGiftSuggestions } from '../services/Venice'

function SearchPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFormSubmit(formData) {
    setIsLoading(true)
    setError(null)

    try {
      const suggestions = await getGiftSuggestions(formData)

      // NEW — check if the AI service returned an error-shaped
      // response (message set, no options) even though it didn't
      // technically throw. Remember: our error fallback returns
      // { message: '...', options: [] } instead of throwing,
      // so we check for that shape here and treat it as a soft
      // error the user should see clearly, not navigate past
      if (suggestions.options.length === 0 && suggestions.message) {
        setError(suggestions.message)
        setIsLoading(false)
        return
      }

      navigate('/results', {
        state: {
          suggestions,
          recipientName: formData.recipientName,
          budget: formData.budget,
          occasion: formData.occasion
        }
      })

    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Find a Gift</h1>
        <p>Fill in the details and let AI do the thinking</p>
      </div>

      {error && (
        <div className="error-message">⚠️ {error}</div>
      )}

      <GiftForm
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
      />

      {/* Show the skeleton WHILE loading, replacing the old generic
          "Finding gifts..." text with a structured visual preview */}
      {isLoading && <GiftResultsSkeleton />}
    </div>
  )
}

export default SearchPage