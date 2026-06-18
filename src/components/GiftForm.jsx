// We import useState from React because this component needs to remember what the user types
import { useState } from 'react'

// This component receives two things from its parent (App.jsx):
// onSubmit - a function to call when the form is submitted
// isLoading - a boolean telling us if AI is currently thinking
function GiftForm({ onSubmit, isLoading }) {

  // We create three pieces of state - one for each input field
  // Each starts as an empty string because the fields start empty
  const [recipientName, setRecipientName] = useState('')
  const [budget, setBudget] = useState('')
  const [occasion, setOccasion] = useState('')
  const [description, setDescription] = useState('')
  // This function runs when the user clicks the button
  function handleSubmit() {

    // Basic validation - don't send empty data to the AI
    // trim() removes whitespace, so "   " counts as empty
    if (!recipientName.trim() || !budget.trim() || !occasion.trim() || !description.trim()) {
      alert('Please fill in all fields')
      return // stop the function here, don't go further
    }


  // NEW — budget must be a valid positive number.
  // Number() on a non-numeric string returns NaN ("Not a Number").
  // isNaN() checks specifically for that case.
    if (isNaN(Number(budget))) {
      alert('Budget must be a valid number')
      return
    }

    // NEW — block negative or zero budgets, which make no real-world
    // sense for a gift search and would otherwise pass our other checks
    if (Number(budget) <= 0) {
      alert('Budget must be greater than zero')
      return
    }

    // NEW — a sensible upper sanity bound. This isn't about being
    // restrictive — it's about catching obvious typos (an extra zero)
    // before they waste an AI call on a nonsensical budget
    if (Number(budget) > 10000000) {
      alert('Please enter a more typical budget amount')
      return
    }

    // If all fields are filled, call the onSubmit function
    // that App.jsx passed down to us, and send it the data
    onSubmit({ recipientName, budget, occasion, description })
  }

  // What this component displays on screen
  return (
    <form className="form-container" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}> 
      <h2>Find the Perfect Gift</h2>

      {/* Each input is controlled - its value is always tied to state */}
      <div className="field">
        <label>Recipient Name</label>
        <input
          type="text" 
          placeholder="e.g. Sarah"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Budget</label>
        <input
          type="number"
          placeholder="e.g. 5000"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Occasion</label>
        {/* A select dropdown instead of free text - better UX */}
        <select
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
        >
          <option value="">Select occasion</option>
          <option value="birthday">Birthday</option>
          <option value="wedding">Wedding</option>
          <option value="anniversary">Anniversary</option>
          <option value="graduation">Graduation</option>
          <option value="christmas">Christmas</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="field">
        <label>Description</label>
        <textarea
          placeholder="Tell us about the recipient's interests, hobbies, and preferences"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* The button is disabled while AI is loading to prevent duplicate requests */}
      <button
        type="submit"
        disabled={isLoading}
      >
        {/* Ternary operator: if isLoading is true show first text, else show second */}
        {isLoading ? 'Finding gifts...' : 'Curate Gifts'}
      </button>
    </form>
  )
}

export default GiftForm