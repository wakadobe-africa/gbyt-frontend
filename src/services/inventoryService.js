// ============================================================
// INVENTORY SERVICE
// ============================================================
// UPDATED: this file no longer calls Open Food Facts directly.
// It now calls OUR OWN backend's /api/inventory route, which
// proxies the request server-side. This sidesteps the browser's
// CORS restriction entirely, since the actual external call now
// happens server-to-server, not browser-to-server.
// ============================================================

// Same environment-aware pattern as apiService.js — local dev
// hits localhost, deployed version hits the real Render backend
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3001/api'

const CATEGORY_PRICE_RANGES = {
  chocolate:    { min: 1500, max: 4000  },
  beverages:    { min: 1000, max: 3500  },
  snacks:       { min: 800,  max: 2500  },
  cosmetics:    { min: 3000, max: 12000 },
  perfume:      { min: 5000, max: 20000 },
  electronics:  { min: 8000, max: 50000 },
  default:      { min: 2000, max: 6000  }
}

function estimatePrice(categoryText = '') {
  const lowerCategory = categoryText.toLowerCase()
  const matchedKey = Object.keys(CATEGORY_PRICE_RANGES).find(
    key => lowerCategory.includes(key)
  )
  const range = CATEGORY_PRICE_RANGES[matchedKey] || CATEGORY_PRICE_RANGES.default
  const price = Math.round(range.min + Math.random() * (range.max - range.min))
  return price
}

// This function's SHAPE and PURPOSE are unchanged from before —
// only WHERE it fetches from has changed. This is exactly the
// payoff of good service-layer separation: the rest of your app
// (aiService.js, SearchPage.jsx) never needs to know or care
// that the underlying data source moved from "direct external
// call" to "via our own backend" — they just keep calling
// fetchInventory() and fetchInventoryForBudget() exactly as before.
export async function fetchInventory(category) {
  try {
    // Now hitting OUR backend's proxy route, not Open Food Facts
    // directly. No Basic Auth header needed here anymore either —
    // that responsibility now lives entirely on the backend, since
    // it's the one actually talking to Open Food Facts.
    const url = `${API_BASE}/inventory/${category}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Inventory API returned ${response.status}`)
    }

    const data = await response.json()
    const rawProducts = data.products || []

    const cleanedProducts = rawProducts
      .filter(item => item.product_name && item.product_name.trim() !== '')
      .map(item => ({
        name:     item.product_name,
        brand:    item.brands || 'Generic',
        category: item.categories || category,
        price:    estimatePrice(item.categories || category)
      }))

    return cleanedProducts

  } catch (error) {
    console.error('fetchInventory error:', error)
    return []
  }
}

export async function fetchInventoryForBudget(budget) {
  const categoriesToSearch = ['chocolate', 'beverages', 'snacks', 'cosmetics','Biscuits','Coffee','Tea']

  const results = await Promise.allSettled(
    categoriesToSearch.map(category => fetchInventory(category))
  )

  const successfulResults = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)

  const failedCount = results.filter(r => r.status === 'rejected').length
  if (failedCount > 0) {
    console.warn(`${failedCount} of ${categoriesToSearch.length} inventory categories failed to load`)
  }

  const allProducts = successfulResults.flat()
  const affordableProducts = allProducts.filter(
    product => product.price <= Number(budget)
  )

  return affordableProducts
}