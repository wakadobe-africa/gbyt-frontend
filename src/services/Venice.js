// ============================================================
// AI SERVICE — TICKET 4: RICHER CONTEXT PROMPT
// ============================================================
// This version gives Gemini significantly more context about
// the recipient as a person — their relationship to the giver,
// their zodiac sign and associated personality traits, and
// their known likes/dislikes. The AI's job shifts from
// "find affordable items" to "find items that genuinely
// resonate with this specific person."
// ============================================================

import { fetchInventoryForBudget } from './inventoryService'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_API_KEY}`

// ── ZODIAC PERSONALITY TRAITS ─────────────────────────────
// Brief, gift-relevant personality summaries per zodiac sign.
// These are passed directly into the prompt so Gemini has
// explicit trait context to reason over, rather than inferring
// from the sign name alone — which produces more consistent,
// targeted suggestions across different model versions.
//
// Kept deliberately concise — enough context to be useful,
// not so long that it crowds out the inventory list in the
// prompt's context window.
const ZODIAC_TRAITS = {
  Aries:       'Energetic, adventurous, loves new experiences and bold choices. Appreciates action-oriented, exciting gifts.',
  Taurus:      'Sensual, comfort-loving, appreciates quality over quantity. Drawn to luxury, food, and beautiful things.',
  Gemini:      'Curious, social, loves variety and mental stimulation. Appreciates gifts that are interesting or versatile.',
  Cancer:      'Nurturing, sentimental, deeply values home and family. Appreciates personal, emotionally meaningful gifts.',
  Leo:         'Confident, generous, loves to feel special and seen. Appreciates glamorous, high-quality, attention-worthy gifts.',
  Virgo:       'Practical, detail-oriented, appreciates thoughtfulness and usefulness. Values quality craftsmanship and functionality.',
  Libra:       'Aesthetic, harmony-seeking, loves beautiful things. Appreciates elegant, well-presented, visually pleasing gifts.',
  Scorpio:     'Intense, private, values depth and authenticity. Appreciates meaningful, non-superficial gifts with substance.',
  Sagittarius: 'Free-spirited, philosophical, loves adventure and learning. Appreciates experiential or travel-oriented gifts.',
  Capricorn:   'Ambitious, disciplined, values quality and longevity. Appreciates practical gifts with lasting value.',
  Aquarius:    'Independent, unconventional, values originality. Appreciates unique, innovative, or cause-driven gifts.',
  Pisces:      'Dreamy, empathetic, deeply creative. Appreciates romantic, artistic, or spiritually meaningful gifts.'
}

// ── RELATIONSHIP CONTEXT ──────────────────────────────────
// Brief framing notes per relationship type, helping the AI
// calibrate the appropriate tone and intimacy level of suggestions.
// A gift for a boss should feel different from a gift for a partner,
// even at the same budget — this context makes that explicit.
const RELATIONSHIP_CONTEXT = {
  partner:     'This is a romantic partner — suggestions can be intimate, personal, and emotionally resonant.',
  mother:      'This is a parental relationship — suggestions should feel warm, appreciative, and nurturing.',
  father:      'This is a parental relationship — suggestions should feel respectful and thoughtful.',
  sister:      'This is a sibling — suggestions can be playful, personal, and affectionate.',
  brother:     'This is a sibling — suggestions can be practical, fun, or experiential.',
  daughter:    'This is a child — suggestions should feel celebratory and personally meaningful.',
  son:         'This is a child — suggestions should feel celebratory and personally meaningful.',
  friend:      'This is a close friend — suggestions can be fun, personal, and reflective of shared interests.',
  colleague:   'This is a professional relationship — suggestions should be appropriate for a work context, not too personal.',
  boss:        'This is a professional relationship with a power dynamic — suggestions should feel respectful and appropriate.',
  mentor:      'This is a respectful relationship — suggestions should feel thoughtful and appreciative.',
  grandparent: 'This is an elder family member — suggestions should feel warm, considerate, and appropriate for their age.',
  child:       'This is a younger person — suggestions should be age-appropriate and joyful.',
  other:       'Consider the specific relationship context carefully when selecting suggestions.'
}

// ── RETRY WITH EXPONENTIAL BACKOFF ───────────────────────
async function withRetry(fn, maxAttempts = 3, baseDelayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts
      if (isLastAttempt) throw error

      const isRetryable =
        error.message.includes('429') ||
        error.message.includes('503')
      if (!isRetryable) throw error

      const delayMs = baseDelayMs * Math.pow(2, attempt - 1)
      console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}

// ── MAIN EXPORTED FUNCTION ────────────────────────────────
export async function getGiftSuggestions({
  recipientName,
  budget,
  occasion,
  relationship,
  date_of_birth,
  personality_notes,
  zodiac_sign       // passed through if already known from a saved recipient
}) {

  const affordableItems = await fetchInventoryForBudget(budget)

  if (affordableItems.length === 0) {
    return {
      message: `We couldn't find specific items within ₦${Number(budget).toLocaleString()} right now. Try increasing your budget slightly.`,
      options: []
    }
  }

  const inventoryText = affordableItems
    .map(item => `- ${item.name} (${item.brand}): ₦${item.price.toLocaleString()}`)
    .join('\n')

  // ── BUILD RECIPIENT CONTEXT BLOCK ────────────────────
  // We build this as a separate string so the main prompt
  // stays readable. Each piece is only included if the data
  // actually exists — we never say "zodiac: unknown" or
  // "personality: none provided" since that adds noise
  // without adding signal for the AI to reason over.

  const relationshipNote = RELATIONSHIP_CONTEXT[relationship] || ''

  // Derive zodiac from date_of_birth if zodiac_sign wasn't
  // passed directly — this handles the case where the form
  // collected a date but the zodiac wasn't pre-computed
  let effectiveZodiac = zodiac_sign
  if (!effectiveZodiac && date_of_birth) {
    effectiveZodiac = deriveZodiacClientSide(date_of_birth)
  }

  const zodiacNote = effectiveZodiac && ZODIAC_TRAITS[effectiveZodiac]
    ? `${recipientName}'s zodiac sign is ${effectiveZodiac}. Personality traits associated with this sign: ${ZODIAC_TRAITS[effectiveZodiac]}`
    : ''

  const personalityNote = personality_notes
    ? `Known about ${recipientName}: ${personality_notes}`
    : ''

  // Combine all recipient context into one clean block,
  // filtering out any empty pieces so the prompt stays tight
  const recipientContext = [
    relationshipNote,
    zodiacNote,
    personalityNote
  ].filter(Boolean).join('\n')

  async function callGemini() {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are GiftMap — an intelligent gift recommendation assistant that understands people deeply.

You don't just find affordable items. You find gifts that genuinely resonate with the specific person receiving them, given what you know about their personality, their relationship to the giver, and the context of the occasion.

═══ THE SITUATION ═══
Giver is buying a gift for: ${recipientName}
Occasion / Reason: ${occasion}
Total budget: ₦${Number(budget).toLocaleString()}
${relationship ? `Relationship: ${recipientName} is the giver's ${relationship}` : ''}

═══ ABOUT ${recipientName.toUpperCase()} ═══
${recipientContext || `No additional details provided about ${recipientName}.`}

═══ AVAILABLE ITEMS (within budget) ═══
${inventoryText}

═══ YOUR TASK ═══
Suggest exactly 3 gift options or combinations from the available items above.

Budget rules:
- Each option's total MUST be between 75% and 100% of the budget
- That means between ₦${Math.round(Number(budget) * 0.75).toLocaleString()} and ₦${Number(budget).toLocaleString()}
- Combine multiple items to reach this range

Resonance rules:
- Each suggestion must feel personally appropriate for ${recipientName} specifically
- Reference their personality, zodiac traits, or known preferences in your reasoning
- The relationship context (${relationship || 'unspecified'}) should influence the tone and intimacy of suggestions
- A gift for a colleague should feel different from a gift for a partner, even at the same price

Respond with ONLY valid JSON matching this EXACT shape — no markdown, no backticks, nothing else:

{
  "options": [
    {
      "title": "Short evocative name for this gift option",
      "items": ["Item name (Brand) (₦price)", "Item name (Brand) (₦price)"],
      "total": 12345,
      "reason": "2-3 sentences explaining why THIS combination suits ${recipientName} specifically — reference their personality, relationship, or occasion"
    }
  ],
  "tip": "One warm, specific closing tip personalised to ${recipientName} and the occasion"
}

Return ONLY the JSON object. Nothing before it, nothing after it.`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1200,
          temperature: 0.8  // slightly higher than before — more creative
                            // combinations are appropriate now that we have
                            // richer context to guide the reasoning
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Gemini error detail:', JSON.stringify(errorData, null, 2))
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const rawText = data.candidates[0].content.parts[0].text

    const cleanedText = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    return JSON.parse(cleanedText)
  }

  try {
    const parsed = await withRetry(callGemini, 3, 1000)

    // Soft validation — warn if budget utilization is low
    const budgetNum = Number(budget)
    parsed.options?.forEach((option, index) => {
      const utilizationPercent = Math.round((option.total / budgetNum) * 100)
      if (utilizationPercent < 75) {
        console.warn(
          `Option ${index + 1} only uses ${utilizationPercent}% of budget ` +
          `(₦${option.total.toLocaleString()} of ₦${budgetNum.toLocaleString()})`
        )
      }
    })

    return parsed

  } catch (error) {
  console.error('Gift suggestion error:', error)

  // Return a message that reflects the ACTUAL cause —
  // not a one-size-fits-all generic message that misleads
  // the user about what went wrong and what they can do about it

  // Infrastructure error — inventory route missing or backend down
  if (error.message.includes('inventory') ||
      error.message.includes('backend') ||
      error.message.includes('404')) {
    return {
      message: 'We\'re having trouble fetching product data right now. Please try again in a moment.',
      options: []
    }
  }

  // Gemini rate limit or quota error
  if (error.message.includes('429')) {
    return {
      message: 'Our AI assistant is handling a lot of requests right now. Please wait a moment and try again.',
      options: []
    }
  }

  // Gemini service down
  if (error.message.includes('503')) {
    return {
      message: 'Our AI service is temporarily unavailable. Please try again shortly.',
      options: []
    }
  }

  // Generic fallback — for truly unexpected errors
  return {
    message: 'Something went wrong. Please try again.',
    options: []
  }
}
}
// ── CLIENT-SIDE ZODIAC DERIVATION ────────────────────────
// Fallback for when zodiac_sign isn't pre-computed by the backend.
// Duplicates the logic in recipientsService.js intentionally —
// the backend derives zodiac when saving a recipient, but during
// a live search before saving, we derive it here so the prompt
// gets the zodiac signal immediately without a round trip.
function deriveZodiacClientSide(dateOfBirth) {
  if (!dateOfBirth) return null
  const date  = new Date(dateOfBirth)
  const month = date.getMonth() + 1
  const day   = date.getDate()

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries'
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus'
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini'
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer'
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo'
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo'
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra'
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio'
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius'
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn'
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius'
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces'
  return null
}