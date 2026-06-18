// GiftResults now receives a STRUCTURED object, not a plain string.
// This means we can render semantic HTML — a description list
// (<dl>) per gift option — instead of dumping raw text into a div.
function GiftResults({ suggestions }) {

  // suggestions is now an OBJECT, not a string. If it's null/undefined
  // (no search performed yet), render nothing — same guard as before.
  if (!suggestions) return null

  const { message, options, tip } = suggestions

  // If there's a message (empty results / error case) and no real
  // options, show just that message — this is our "no options" path
  if (message && (!options || options.length === 0)) {
    return (
      <div className="results-container">
        <p className="results-message">{message}</p>
      </div>
    )
  }

  return (
    <div className="results-container">
      <h2>Gift Suggestions</h2>

      {/* 
        .map() loops over each gift OPTION object and renders one
        <dl> (description list) per option. A <dl> pairs up <dt>
        (description term — the label) with <dd> (description data
        — the value). It's the correct semantic HTML element for
        "here's a list of labeled facts about something" — exactly
        what a gift option is: a title, its items, its total, its reason.
      */}
      {options.map((option, index) => (
        // key={index} tells React how to track this item across
        // re-renders. Using the array index is acceptable here
        // because this list doesn't get reordered or filtered —
        // if it did, we'd want a more stable unique id instead.
        <dl key={index} className="gift-option">

          <dt>Option {index + 1}</dt>
          <dd className="option-title">{option.title}</dd>

          <dt>Items</dt>
          <dd>
            {/* 
              A gift option contains MULTIPLE items, so we render
              a nested <ul> inside this single <dd> — a list within
              a list value, which is valid and common in <dl> usage
              when one "data" value is itself a collection.
            */}
            <ul className="item-list">
              {option.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </dd>

          <dt>Total</dt>
          {/* 
            .toLocaleString() formats the raw number 21391 into
            "21,391" — adding thousand-separator commas for
            readability, same utility we've used throughout the app
          */}
          <dd className="option-total">
            ₦{Number(option.total).toLocaleString()}
          </dd>

          <dt>Why it fits</dt>
          <dd className="option-reason">{option.reason}</dd>

        </dl>
      ))}

      {/* The closing tip renders once, after all options, same as
          the original "GiftMap Tip" line from the text version */}
      {tip && (
        <p className="results-tip">💡 {tip}</p>
      )}

    </div>
  )
}

export default GiftResults