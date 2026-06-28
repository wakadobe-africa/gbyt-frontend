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

      if (suggestions.options.length === 0 && suggestions.message) {
        setError(suggestions.message)
        setIsLoading(false)
        return
      }

    // Pass ALL formData fields through to ResultsPage via
    // navigation state — Ticket 4's richer prompt needs
    // relationship, date_of_birth, and personality_notes
    // to be available when saving the gift search too
    navigate('/results', {
      state: {
        suggestions,
        recipientName:    formData.recipientName,
        budget:           formData.budget,
        occasion:         formData.occasion,
        relationship:     formData.relationship,
        date_of_birth:    formData.date_of_birth,
        personality_notes: formData.personality_notes,
        gender:            formData.gender || null
      }
    })

  } catch (err) {
    setError(err.message)
  } 
  finally {
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

      {isLoading && <GiftResultsSkeleton />}
    </div>
  )
}

  

export default SearchPage