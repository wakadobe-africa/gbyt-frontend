// Base URL of your Express backend
// In production this becomes your deployed server URL
const API_BASE = 'http://localhost:3001/api'

// Helper function that makes authenticated requests
// Every protected API call needs the JWT token in the header
// This helper adds it automatically so you never forget
async function authFetch(endpoint, options = {}, token) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Attach the JWT token if we have one
      ...(token && { Authorization: `Bearer ${token}` }),
      // Spread any additional headers passed in
      ...options.headers
    }
  })

  // Parse the JSON response
  const data = await response.json()

  // If the server returned an error status, throw it
  // This triggers the catch block in whatever called this function
  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

// ── AUTH ENDPOINTS ─────────────────────────────────────
export async function registerUser(email, password, fullname) {
  return authFetch('/users/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullname })
  })
}

export async function loginUser(email, password) {
  return authFetch('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function getCurrentUser(token) {
  return authFetch('/users/me', {}, token)
}

// ── GIFTS ENDPOINTS ────────────────────────────────────
export async function saveGiftSearch(giftData, token) {
  return authFetch('/gifts', {
    method: 'POST',
    body: JSON.stringify(giftData)
  }, token)
}

export async function getGiftHistory(token) {
  return authFetch('/gifts', {}, token)
}

export async function deleteGiftSearch(id, token) {
  return authFetch(`/gifts/${id}`, {
    method: 'DELETE'
  }, token)
}