// ============================================================
// GIFT FORM — TWO-STEP VERSION
// ============================================================
// Step 1: Gift context (budget + reason)
// Step 2: Recipient profile (name, relationship, DOB, personality)
//
// The two-step structure reduces perceived complexity by showing
// users only the fields relevant to where they are in the flow,
// building momentum before asking for deeper information.
// ============================================================

import { useState } from 'react'

// These are the structured reason options we always show.
// Common enough to anticipate, specific enough to give the AI
// a clean category signal to reason over.
const REASON_OPTIONS = [
  { value: 'birthday',         label: '🎂 Birthday'            },
  { value: 'wedding',          label: '💍 Wedding'              },
  { value: 'anniversary',      label: '💑 Anniversary'          },
  { value: 'graduation',       label: '🎓 Graduation'           },
  { value: 'new_baby',         label: '👶 New Baby / Naming Ceremony' },
  { value: 'promotion',        label: '🚀 Promotion'            },
  { value: 'condolence',       label: '🕊️ Condolence'           },
  { value: 'housewarming',     label: '🏠 Housewarming'         },
  { value: 'valentines',       label: '❤️ Valentine\'s Day'     },
  { value: 'christmas',        label: '🎄 Christmas'            },
  { value: 'just_because',     label: '🎁 Just Because'         },
  { value: 'other',            label: '✏️ Other (describe below)' },
]

// Relationship options — structured for the AI, readable for users.
// Ordered roughly by how common they are as gift recipients.
const RELATIONSHIP_OPTIONS = [
  { value: 'partner',    label: '❤️ Partner / Spouse'    },
  { value: 'mother',     label: '👩 Mother'               },
  { value: 'father',     label: '👨 Father'               },
  { value: 'sister',     label: '👧 Sister'               },
  { value: 'brother',    label: '👦 Brother'              },
  { value: 'daughter',   label: '🧒 Daughter'             },
  { value: 'son',        label: '🧒 Son'                  },
  { value: 'friend',     label: '🤝 Friend'               },
  { value: 'colleague',  label: '💼 Colleague'            },
  { value: 'boss',       label: '👔 Boss'                 },
  { value: 'mentor',     label: '🎓 Mentor'               },
  { value: 'child',      label: '🧸 Child (general)'      },
  { value: 'grandparent',label: '👴 Grandparent'          },
  { value: 'other',      label: '👤 Other'                },
]

function GiftForm({ onSubmit, isLoading }) {

  // Which step we're on — 1 or 2
  const [step, setStep] = useState(1)

  // Step 1 fields
  const [budget,      setBudget]      = useState('')
  const [reason,      setReason]      = useState('')
  const [reasonOther, setReasonOther] = useState('') // shown when reason === 'other'

  // Step 2 fields
  const [recipientName,     setRecipientName]     = useState('')
  const [relationship,      setRelationship]      = useState('')
  const [dateOfBirth,       setDateOfBirth]       = useState('')
  const [personalityNotes,  setPersonalityNotes]  = useState('')

  // ── STEP 1 VALIDATION ──────────────────────────────────
  function handleStep1Submit() {
    if (!budget.trim()) {
      alert('Please enter a budget')
      return
    }

    if (isNaN(Number(budget)) || Number(budget) <= 0) {
      alert('Please enter a valid budget amount')
      return
    }

    if (Number(budget) > 10000000) {
      alert('Please enter a more typical budget amount')
      return
    }

    if (!reason) {
      alert('Please select a reason for the gift')
      return
    }

    // If "Other" was selected but no description provided,
    // prompt them to fill in the description field
    if (reason === 'other' && !reasonOther.trim()) {
      alert('Please describe the occasion')
      return
    }

    // Step 1 valid — advance to step 2
    setStep(2)
  }

  // ── STEP 2 VALIDATION + FINAL SUBMIT ──────────────────
  function handleStep2Submit() {
    if (!recipientName.trim()) {
      alert('Please enter the recipient\'s name')
      return
    }

    if (!relationship) {
      alert('Please select your relationship to the recipient')
      return
    }

    // Build the final occasion string the AI will reason over:
    // if a structured reason was selected, use its label text
    // (readable, descriptive) rather than the raw value key.
    // If "other" was selected, use the custom description directly.
    const occasionLabel = reason === 'other'
      ? reasonOther
      : REASON_OPTIONS.find(r => r.value === reason)?.label?.replace(/^.{2}\s/, '') // strip the emoji prefix
        || reason

    // Pass everything up to the parent (SearchPage) which
    // calls the AI service — all new fields included
    onSubmit({
      recipientName:    recipientName.trim(),
      budget,
      occasion:         occasionLabel,
      relationship,
      date_of_birth:    dateOfBirth || null,
      personality_notes: personalityNotes.trim() || null,
    })
  }

  // ── STEP INDICATOR ────────────────────────────────────
  // Shows the user where they are in the flow — reduces
  // anxiety about "how much more is there?" which is one
  // of the main causes of form abandonment
  const StepIndicator = () => (
    <div className="step-indicator">
      <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>
        <span>1</span>
      </div>
      <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
      <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>
        <span>2</span>
      </div>
    </div>
  )

  // ── RENDER STEP 1 ─────────────────────────────────────
  if (step === 1) {
    return (
      <div className="form-container">
        <StepIndicator />

        <div className="step-header">
          <h2>The Gift Context</h2>
          <p>Tell us the situation</p>
        </div>

        <div className="field">
          <label>Budget (₦)</label>
          <input
            type="number"
            placeholder="e.g. 25000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>

        <div className="field">
          <label>What's the occasion?</label>
          {/* Reason grid — renders options as tappable cards
              rather than a dropdown, which is more engaging
              on both mobile and desktop */}
          <div className="reason-grid">
            {REASON_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                className={`reason-card ${reason === option.value ? 'selected' : ''}`}
                onClick={() => setReason(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Only show the "describe further" field when Other is selected */}
        {reason === 'other' && (
          <div className="field">
            <label>Describe the occasion</label>
            <input
              type="text"
              placeholder="e.g. My friend just got out of hospital"
              value={reasonOther}
              onChange={(e) => setReasonOther(e.target.value)}
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleStep1Submit}
          disabled={isLoading}
          className="cta-button"
        >
          Next — About the Recipient →
        </button>
      </div>
    )
  }

  // ── RENDER STEP 2 ─────────────────────────────────────
  return (
    <div className="form-container">
      <StepIndicator />

      <div className="step-header">
        <h2>About the Recipient</h2>
        <p>Help the AI understand who this gift is for</p>
      </div>

      <div className="field">
        <label>Recipient's Name</label>
        <input
          type="text"
          placeholder="e.g. Amara"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Your relationship to them</label>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
        >
          <option value="">Select relationship</option>
          {RELATIONSHIP_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        {/* Date of birth is optional — clearly labeled so users
            don't feel blocked if they don't know or want to share it */}
        <label>
          Date of Birth
          <span className="optional-label"> (optional — unlocks zodiac insights)</span>
        </label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          // Prevent selecting future dates — a birthdate can't be in the future
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="field">
        <label>
          Personality, likes & dislikes
          <span className="optional-label"> (optional — improves suggestions)</span>
        </label>
        {/* textarea instead of input because personality notes
            are naturally multi-line and benefit from more space */}
        <textarea
          placeholder="e.g. She loves dark chocolate and yoga, hates loud music, reads a lot, very into wellness products..."
          value={personalityNotes}
          onChange={(e) => setPersonalityNotes(e.target.value)}
          rows={4}
        />
      </div>

      <div className="form-actions">
        {/* Back button — lets users fix Step 1 without losing Step 2 data */}
        <button
          type="button"
          onClick={() => setStep(1)}
          className="secondary-button"
          disabled={isLoading}
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleStep2Submit}
          disabled={isLoading}
          className="cta-button"
        >
          {isLoading ? 'Finding gifts...' : 'Find Gifts →'}
        </button>
      </div>
    </div>
  )
}

export default GiftForm