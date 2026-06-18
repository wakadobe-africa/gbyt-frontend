// This component renders FAKE, grayed-out versions of the gift
// option cards, shaped exactly like the real ones, while we wait
// for actual data. The user's eye recognizes "ah, content is
// coming, and I can see roughly what shape it'll take" — this is
// proven to make wait times feel shorter than a blank screen or
// a generic spinner, because it gives the brain something
// structured to anticipate rather than just "waiting in the dark."
function GiftResultsSkeleton() {
  return (
    <div className="results-container">
      <h2>Finding your gifts...</h2>

      {/* 
        We render 3 fake skeleton cards because we always show
        3 real options once loaded — keeping the skeleton's shape
        consistent with the real content prevents a jarring layout
        shift when the real data finally arrives
      */}
      {[1, 2, 3].map(num => (
        <div key={num} className="gift-option skeleton-card">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-item" />
          <div className="skeleton-line skeleton-item" />
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-total" />
        </div>
      ))}
    </div>
  )
}

export default GiftResultsSkeleton