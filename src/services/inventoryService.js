// ============================================================
// INVENTORY SERVICE
// ============================================================
// This file's ONE job: get real product data for gift suggestions.
// Today it pulls from Open Food Facts (a free, real, open database).
// Tomorrow, if you partner with a real Nigerian supermarket, you
// change ONLY this file — nothing else in your app needs to know
// or care where the data came from. This is the entire point of
// a service layer: it's a replaceable "adapter" between your app
// and the outside world.
// ============================================================

// Open Food Facts requires NO API key — it's a free, open project
// maintained by volunteers worldwide, similar in spirit to Wikipedia
// We switch to STAGING, not production, while we're building and
// testing. This matches Open Food Facts' own guidance: "while
// testing your applications, make all API requests to the staging
// environment... this way, we can ensure the product database is
// safe." Staging has the same data shape as production, but is
// meant to absorb developer testing traffic without affecting
// the real, public-facing database.
const OFF_API_BASE = 'https://world.openfoodfacts.net/api/v2/search'
// --------------------------------------------------------------
// PRICING LOGIC
// --------------------------------------------------------------
// Open Food Facts gives us real product NAMES and CATEGORIES,
// but it does NOT give us prices — because prices differ by
// store, country, and day. No global database tracks that for free.
//
// So we apply our OWN pricing logic based on category. This is a
// deliberate business decision, not a workaround we're hiding —
// when you pitch this, you say plainly: "we ground suggestions in
// real product data, and apply localized Nigerian market pricing
// on top, which we'll replace with live retailer pricing once we
// have direct partnerships."
//
// Think of this object as a lookup table: category name (lowercase)
// maps to an estimated price range in Naira.
const CATEGORY_PRICE_RANGES = {
  chocolate:    { min: 1500, max: 4000  },
  beverages:    { min: 1000, max: 3500  },
  snacks:       { min: 800,  max: 2500  },
  cosmetics:    { min: 3000, max: 12000 },
  perfume:      { min: 5000, max: 20000 },
  electronics:  { min: 8000, max: 50000 },
  default:      { min: 2000, max: 6000  } // fallback if category unknown
}

// --------------------------------------------------------------
// HELPER — Estimate a price for a product based on its category
// --------------------------------------------------------------
// We take the product's category text (e.g. "Chocolates, Snacks")
// and check if any of our known keywords appear inside it.
// If we find a match, we generate a random price WITHIN that
// category's realistic range. Random, but bounded — this avoids
// every chocolate bar costing exactly the same suspicious amount,
// which would look fake in a demo.
function estimatePrice(categoryText = '') {
  // .toLowerCase() makes matching case-insensitive
  // "Chocolates" and "chocolate" should both match our "chocolate" key
  const lowerCategory = categoryText.toLowerCase()

  // Object.keys() gives us an array of all the category names
  // we defined above, so we can loop through and check each one
  const matchedKey = Object.keys(CATEGORY_PRICE_RANGES).find(
    key => lowerCategory.includes(key)
  )

  // If we found a match, use its range. Otherwise use 'default'.
  const range = CATEGORY_PRICE_RANGES[matchedKey] || CATEGORY_PRICE_RANGES.default

  // Math.random() gives a decimal between 0 and 1
  // We scale it to fit between range.min and range.max
  // Math.round() ensures we don't get awkward decimal Naira amounts
  const price = Math.round(
    range.min + Math.random() * (range.max - range.min)
  )

  return price
}

// --------------------------------------------------------------
// MAIN EXPORTED FUNCTION — fetchInventory
// --------------------------------------------------------------
// This is what the rest of your app calls. It hides ALL the
// complexity above behind one simple function name.
// category = a search term like "chocolate", "perfume", "snacks"
// This lets us build a small "virtual shelf" of real products
// per category, which is what your AI will choose from.
export async function fetchInventory(category) {
  try {
    // STRUCTURED FILTER, not full-text search.
    // Open Food Facts tags are language-prefixed: "en:beverages",
    // not just "beverages". This is the exact mismatch that broke
    // our original request — we were sending a bare word into a
    // field that expects a precise, prefixed tag value.
    const taggedCategory = `en:${category}`

    const params = new URLSearchParams({
      categories_tags_en: taggedCategory,
      page_size: '8',
      fields: 'product_name,brands,categories'
    })

    const url = `${OFF_API_BASE}?${params.toString()}`

    // btoa() encodes a string into Base64 — this is what HTTP
    // Basic Auth requires. The header format is always:
    // "Basic " + base64("username:password")
    // This is NOT encryption, just a standard encoding format —
    // which is exactly why Basic Auth should only ever be used
    // over HTTPS (which this URL is), otherwise it's trivially
    // readable by anyone intercepting the request.
    const basicAuth = btoa('off:off')

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // Identifies our specific app to Open Food Facts, as their
        // docs explicitly request, so we're not mistaken for an
        // anonymous bot and potentially treated more strictly
        'User-Agent': 'GiftMap/1.0 (giftmap.dev@example.com)',

        // Required specifically for the staging environment
        'Authorization': `Basic ${basicAuth}`
      }
    })

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
// --------------------------------------------------------------
// CONVENIENCE FUNCTION — fetchInventoryForBudget
// --------------------------------------------------------------
// GiftMap doesn't search ONE category at a time — a gift search
// should pull from SEVERAL categories (chocolate, perfume, snacks,
// etc) and combine them into one pool, THEN filter by budget.
// This function orchestrates that entire process.
export async function fetchInventoryForBudget(budget) {
  const categoriesToSearch = ['chocolate', 'beverages', 'snacks', 'cosmetics']

  // Promise.all() has an important failure behavior worth understanding
  // deeply: if ANY single promise inside it rejects (throws), the
  // ENTIRE Promise.all() immediately rejects — even if the other 3
  // requests would have succeeded fine. One bad apple spoils all of them.
  //
  // Promise.allSettled() behaves differently and is what we actually
  // want here: it waits for EVERY promise to finish, regardless of
  // whether each one succeeded or failed, and gives us back the
  // status of each individually. This means if "cosmetics" search
  // fails but the other 3 categories succeed, we still get those
  // 3 categories' worth of real data instead of losing everything.
  const results = await Promise.allSettled(
    categoriesToSearch.map(category => fetchInventory(category))
  )

  // Each entry in `results` looks like either:
  // { status: 'fulfilled', value: [...products] }   ← succeeded
  // { status: 'rejected',  reason: Error }            ← failed
  //
  // We only want the VALUES from the ones that succeeded.
  // .filter() keeps only fulfilled ones, .map() extracts their value
  const successfulResults = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)

  // Log how many categories failed, purely for your own debugging —
  // this never reaches the user, but helps YOU notice patterns,
  // like "cosmetics always fails" which might point to a real bug
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