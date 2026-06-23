// ============================================================
// AI SERVICE
// ============================================================
// KEY CHANGE in this version: instead of asking Gemini for a
// nicely-formatted paragraph of text, we ask it to respond with
// STRICT JSON matching a shape we define. This means our React
// components can render real <table> or <dl> elements built from
// actual structured data, instead of trying to parse loose prose.
// ============================================================

import { fetchInventoryForBudget } from './inventoryService'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_API_KEY}`

export async function getGiftSuggestions({ recipientName, budget, occasion }) {

  const affordableItems = await fetchInventoryForBudget(budget)

  if (affordableItems.length === 0) {
    // NOTE: even our "nothing found" fallback must now match the
    // SAME shape the rest of our app expects everywhere else —
    // an object with a message and an empty options array — so
    // GiftResults.jsx never has to guess "is this a string or an
    // object?" It's always one consistent shape, always.
    return {
      message: `We couldn't find specific items within ₦${Number(budget).toLocaleString()} right now. Try increasing your budget slightly.`,
      options: []
    }
  }

  const inventoryText = affordableItems
    .map(item => `- ${item.name} (${item.brand}): ₦${item.price.toLocaleString()}`)
    .join('\n')

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            // This prompt is now VERY explicit about output format.
            // We literally show Gemini the exact JSON shape we want,
            // including field names and types. This is called
            // "few-shot structure prompting" — showing the model
            // the target shape directly, rather than describing it
            // abstractly in words, which is far more reliable.
            text: `You are GiftMap, an intelligent gift recommendation assistant.

I need gift ideas for ${recipientName} for their ${occasion}.
My total budget is ₦${Number(budget).toLocaleString()}.

Here are the available items within my budget:
${inventoryText}

Respond with ONLY valid JSON, no markdown formatting, no backticks,
no extra commentary before or after. Match this EXACT shape:

{
  "options": [
    {
      "title": "Short name for this gift option",
      "items": ["Item name (₦price)", "Item name (₦price)"],
      "total": 12345,
      "reason": "One or two sentences on why this fits the occasion"
    }
  ],
  "tip": "One closing tip for the user"
}

Provide exactly 3 options. Follow these budget rules STRICTLY:
- Each option's total MUST be between 75% and 100% of the budget
- That means between ₦${Math.round(Number(budget) * 0.75).toLocaleString()} and ₦${Number(budget).toLocaleString()}
- Combine multiple items to reach this range — do not suggest single items unless the budget is very small
- If one combination uses fewer items, add complementary items (wrapping, card, accessory) to reach the target range
- Never suggest a combination totaling less than ₦${Math.round(Number(budget) * 0.75).toLocaleString()}
Return ONLY the JSON object, nothing else.`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
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

    // ── PARSING THE STRUCTURED RESPONSE ──────────────────────
    // Even when we ASK for pure JSON, Gemini sometimes wraps it
    // in markdown code fences like ```json ... ``` out of habit
    // from its training. This regex strips those fences off if
    // present, so JSON.parse() doesn't choke on stray backticks.
    const cleanedText = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    // JSON.parse() converts the JSON STRING into a real JavaScript
    // object we can actually work with — access .options, loop
    // over them, etc. Before this line, it's just text that LOOKS
    // like an object but isn't one yet.
     const parsed = JSON.parse(cleanedText)
    // Soft validation — log a warning if any option's total is
// significantly under budget despite our new prompt instructions.
// This never breaks the user experience, but tells YOU in the
// console if Gemini is still ignoring the budget range guidance,
// which would mean the prompt needs further tuning.
      const budgetNum = Number(budget)
      parsed.options?.forEach((option, index) => {
      const utilizationPercent = Math.round((option.total / budgetNum) * 100)
        if (utilizationPercent < 75) {
          console.warn(
            `Option ${index + 1} only uses ${utilizationPercent}% of budget ` +
            `(₦${option.total.toLocaleString()} of ₦${budgetNum.toLocaleString()}). ` +
            `Consider tuning the prompt further.`
          )
        }
      })
      return parsed

  } catch (error) {
    console.error('Gemini API error:', error)

    // If JSON.parse() fails (Gemini returned malformed JSON) or
    // the network call fails entirely, we still return the SAME
    // consistent shape — never a different shape on error paths.
    // This is a really important defensive habit: error states
    // should not force every component downstream to handle a
    // completely different data structure than the success path.
    return {
      message: 'Failed to get gift suggestions. Please try again.',
      options: []
    }
  }
}