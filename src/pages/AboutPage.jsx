import { Link } from 'react-router-dom'
function AboutPage() {
  return (
    <div className="about-page">
      <h1>About GiftMap</h1>
      <p className="about-subtitle">
        We're building the smartest gift discovery platform in Africa.
      </p>

      <div className="about-section">
        <h2>The Problem</h2>
        <p>
          Finding the right gift is stressful. You spend hours browsing,
          second-guessing, and still end up unsure. Budget management is
          even harder — most platforms show you things you can't afford.
        </p>
      </div>

      <div className="about-section">
        <h2>Our Solution</h2>
        <p>
          GiftMap uses AI to match your budget and occasion to real inventory
          from stores near your recipient. No browsing. No overwhelm.
          Just the right gift, instantly.
        </p>
      </div>

      <div className="about-section">
        <h2>Powered By</h2>
        <p>
          GiftMap is built on privacy-first AI infrastructure,
          with real-time inventory from local supermarkets and stores.
          Every suggestion is purchasable, available, and within budget.
        </p>
      </div>

      <Link to="/search" className="cta-button">
        Try GiftMap Now
      </Link>
    </div>
  )
}

export default AboutPage