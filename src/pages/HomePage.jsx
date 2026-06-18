// HomePage is the first thing users see
// Its job: communicate value and get users to click Search
// Think of it as your product's elevator pitch

// Link is React Router's navigation component
// It changes the URL without reloading the page
import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="home-page">

      {/* Hero Section - the first thing eyes land on */}
      <section className="hero">
        <div className="hero-content">

          {/* Badge - creates curiosity and trust */}
          <span className="badge">✨ AI-Powered Gift Discovery</span>

          <h1>
            Find the <span className="highlight">perfect gift</span>
            <br />for everyone, instantly
          </h1>

          <p className="hero-subtitle">
            Tell us your budget and recipient. GiftMap's AI finds
            thoughtful gift combinations from stores near you.
          </p>

          {/* Primary CTA - this is the most important button on the page */}
          {/* to="/search" changes URL to /search, SearchPage renders */}
          <Link to="/search" className="cta-button">
            Find a Gift Now →
          </Link>
        </div>

        {/* Hero visual - makes the page feel alive */}
        <div className="hero-visual">🎁</div>
      </section>

      {/* How It Works - reduces friction by explaining the process */}
      <section className="how-it-works">
        <h2>How GiftMap Works</h2>

        <div className="steps">

          {/* Each step walks the user through the journey */}
          <div className="step">
            <div className="step-number">1</div>
            <h3>Enter Details</h3>
            <p>Tell us who the gift is for, the occasion, and your budget</p>
          </div>

          <div className="step-arrow">→</div>

          <div className="step">
            <div className="step-number">2</div>
            <h3>AI Thinks</h3>
            <p>Our AI scans available inventory and finds perfect combinations</p>
          </div>

          <div className="step-arrow">→</div>

          <div className="step">
            <div className="step-number">3</div>
            <h3>You Choose</h3>
            <p>Pick from curated suggestions that fit your budget perfectly</p>
          </div>

        </div>
      </section>

      {/* Value props - answers "why should I trust this?" */}
      <section className="value-props">

        <div className="prop">
          <span className="prop-icon">🎯</span>
          <h3>Budget Precise</h3>
          <p>Every suggestion fits exactly within what you want to spend</p>
        </div>

        <div className="prop">
          <span className="prop-icon">⚡</span>
          <h3>Instant Results</h3>
          <p>No browsing, no overwhelm. Curated suggestions in seconds</p>
        </div>

        <div className="prop">
          <span className="prop-icon">🛒</span>
          <h3>Real Inventory</h3>
          <p>Items sourced from stores actually near your recipient</p>
        </div>

      </section>

      {/* Bottom CTA - catch users who scrolled past the hero */}
      <section className="bottom-cta">
        <h2>Ready to find the perfect gift?</h2>
        <Link to="/search" className="cta-button">
          Get Started — It's Free
        </Link>
      </section>

    </div>
  )
}

export default HomePage