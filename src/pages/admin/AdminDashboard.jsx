// ============================================================
// ADMIN DASHBOARD
// ============================================================
// The first screen an admin sees. Shows platform-wide metrics
// fetched from GET /api/admin/metrics.
//
// Data flow:
// Component mounts → useEffect fires → fetches metrics from backend
// → sets state → React re-renders with real data
//
// We use three separate state variables rather than one big object
// because each piece of UI depends on a different part of the data,
// and granular state means granular re-renders — only what changed
// updates on screen, not the entire component.
// ============================================================

import { useState, useEffect } from 'react'
import { Link }                from 'react-router-dom'
import { useAuth }             from '../../context/AuthContext'
import { getAdminMetrics } from '../../services/apiService'

function AdminDashboard() {
  // metrics holds the data returned from /api/admin/metrics
  // null means "not loaded yet" — distinct from {} which means
  // "loaded but empty," which is an important difference for
  // showing the right loading state vs empty state
  const [metrics,   setMetrics]   = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState(null)

  // Pull token from auth context — every admin API call needs it
  const { token } = useAuth()

  // useEffect with [] dependency array runs ONCE when the component
  // first mounts — equivalent to "on page load." This is where
  // we trigger the initial data fetch.
  // We define fetchMetrics INSIDE useEffect rather than outside
  // because it uses `token` from the closure, and defining it
  // inside avoids the eslint exhaustive-deps warning about
  // missing dependencies.
  useEffect(() => {
    async function fetchMetrics() {
      try {
        const data = await getAdminMetrics(token)
        setMetrics(data.data)

      } catch (err) {
        console.error('Dashboard fetch error:', err)
        setError(err.message)
      } finally {
        // Always stop loading, whether success or failure —
        // the UI should never be stuck in a loading state
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [token]) // re-fetch if token changes (e.g. after re-login)

  // ── LOADING STATE ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="admin-page">
        <h1>Dashboard</h1>
        <div className="admin-loading">
          <div className="admin-loading-grid">
            {/* Four skeleton metric cards — same count as real cards */}
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="metric-card skeleton-card">
                <div className="skeleton-line skeleton-label" />
                <div className="skeleton-line" style={{ height: '40px', width: '60%' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── ERROR STATE ────────────────────────────────────────
  if (error) {
    return (
      <div className="admin-page">
        <h1>Dashboard</h1>
        <div className="admin-error">
          <p>⚠️ Failed to load metrics: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="admin-retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ── SUCCESS STATE ──────────────────────────────────────
  return (
    <div className="admin-page">
      <h1>Dashboard</h1>

      {/* ── METRIC CARDS ──────────────────────────────────
          Four key numbers at a glance. Each card shows one
          important platform metric with an icon, a number,
          and a label explaining what it represents.

          This pattern — a row of "stat cards" — is universal
          in admin dashboards because it answers the "how are
          we doing?" question in under 3 seconds.
      ──────────────────────────────────────────────────── */}
      <div className="metrics-grid">

        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-value">
            {/* toLocaleString() formats large numbers with commas:
                1000 → "1,000", 10000 → "10,000" */}
            {metrics.totalUsers.toLocaleString()}
          </div>
          <div className="metric-label">Registered Users</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎁</div>
          <div className="metric-value">
            {metrics.totalSearches.toLocaleString()}
          </div>
          <div className="metric-label">Gift Searches</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💝</div>
          <div className="metric-value">
            {metrics.totalRecipients.toLocaleString()}
          </div>
          <div className="metric-label">Saved Recipients</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-value">
            {/* Average budget formatted as Naira */}
            ₦{Number(metrics.budgetStats?.avg_budget || 0).toLocaleString()}
          </div>
          <div className="metric-label">Avg Gift Budget</div>
        </div>

      </div>

      {/* ── TWO COLUMN SECTION ────────────────────────────
          Below the metric cards, we split into two columns:
          - Left: top occasions (what people gift for most)
          - Right: budget range breakdown + quick links

          Two columns work here because both sections are
          independently useful — an admin should be able to
          read either without needing the other.
      ──────────────────────────────────────────────────── */}
      <div className="admin-two-col">

        {/* Left column — Top Occasions */}
        <div className="admin-card">
          <h2 className="admin-card-title">Top Occasions</h2>
          <p className="admin-card-subtitle">
            What people are gifting for most
          </p>

          {metrics.topOccasions?.length > 0 ? (
            <div className="occasions-list">
              {metrics.topOccasions.map((item, index) => (
                <div key={index} className="occasion-row">

                  {/* Rank number */}
                  <span className="occasion-rank">#{index + 1}</span>

                  {/* Occasion name */}
                  <span className="occasion-name">{item.occasion}</span>

                  {/* Count badge */}
                  <span className="occasion-count">
                    {item.count} search{item.count !== 1 ? 'es' : ''}
                  </span>

                  {/* Visual bar showing relative popularity.
                      We calculate each bar's width as a percentage
                      of the top occasion's count — the most popular
                      occasion is always 100% wide, others are
                      proportionally smaller. This gives instant
                      visual comparison without needing a chart library. */}
                  <div className="occasion-bar-container">
                    <div
                      className="occasion-bar-fill"
                      style={{
                        width: `${Math.round(
                          (item.count / metrics.topOccasions[0].count) * 100
                        )}%`
                      }}
                    />
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <p className="admin-empty-note">
              No gift searches yet — data will appear here once users start searching.
            </p>
          )}
        </div>

        {/* Right column — Budget Stats + Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Budget range card */}
          <div className="admin-card">
            <h2 className="admin-card-title">Budget Range</h2>
            <p className="admin-card-subtitle">Across all gift searches</p>

            <div className="budget-stats">
              <div className="budget-stat">
                <span className="budget-stat-label">Lowest</span>
                <span className="budget-stat-value">
                  ₦{Number(metrics.budgetStats?.min_budget || 0).toLocaleString()}
                </span>
              </div>
              <div className="budget-stat-divider">→</div>
              <div className="budget-stat">
                <span className="budget-stat-label">Average</span>
                <span className="budget-stat-value highlight">
                  ₦{Number(metrics.budgetStats?.avg_budget || 0).toLocaleString()}
                </span>
              </div>
              <div className="budget-stat-divider">→</div>
              <div className="budget-stat">
                <span className="budget-stat-label">Highest</span>
                <span className="budget-stat-value">
                  ₦{Number(metrics.budgetStats?.max_budget || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick links card — shortcuts to other admin sections */}
          <div className="admin-card">
            <h2 className="admin-card-title">Quick Links</h2>
            <div className="quick-links">
              <Link to="/admin/users" className="quick-link">
                <span>👥</span>
                <span>View All Users</span>
                <span className="quick-link-arrow">→</span>
              </Link>
              <Link to="/admin/searches" className="quick-link">
                <span>🎁</span>
                <span>Gift Search Log</span>
                <span className="quick-link-arrow">→</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AdminDashboard