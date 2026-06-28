import { createContext, useContext, useState, useEffect } from 'react'

// Step 1: Create the context object
// This is the "radio station" — it holds and broadcasts auth state
// We export it but components use useAuth() hook instead (cleaner)
const AuthContext = createContext(null)

// Step 2: Create the Provider component
// This wraps your entire app and makes auth state available everywhere
// Think of it as the broadcasting tower
export function AuthProvider({ children }) {

  // The core auth state
  // user = null means logged out
  // user = { id, email } means logged in
  const [user,      setUser]      = useState(null)
  const [token,     setToken]     = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // When app loads, check if user was previously logged in
  // We store the token in localStorage so it survives page refresh
  // This runs once on mount because of the empty [] dependency array
  useEffect(() => {
    const savedToken = localStorage.getItem('gbyt_token')
    const savedUser  = localStorage.getItem('gbyt_user')

    if (savedToken && savedUser) {
      // Restore previous session
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }

    // Done checking — app can render now
    setIsLoading(false)
  }, [])

  // Called after successful login or register
  // Stores token and user in both state and localStorage
  const login = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('giftmap_token', userToken)
    localStorage.setItem('giftmap_user', JSON.stringify(userData))
  }

  // Called when user clicks logout
  // Clears everything from state and localStorage
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('giftmap_token')
    localStorage.removeItem('giftmap_user')
  }

  // The value object is what every component receives
  // when they call useAuth()
  const value = {
    user,       // the logged in user object (or null)
    token,      // the JWT token (or null)
    isLoading,  // true while checking localStorage on startup
    login,      // function to call after successful auth
    logout,     // function to call when logging out
    isLoggedIn: !!user,  // boolean shortcut — !! converts to true/false
    isAdmin: user?.role === 'admin'
  }

  // While checking localStorage, render nothing
  // Prevents flash of wrong UI state
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh',
        color: '#6c63ff'
      }}>
        Loading...
      </div>
    )
  }

  // children means everything wrapped inside AuthProvider
  // receives the context value
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Step 3: Create a custom hook
// This is the clean way for components to access auth state
// Instead of importing AuthContext everywhere, just import useAuth
export function useAuth() {
  const context = useContext(AuthContext)

  // Safety check — useAuth must be used inside AuthProvider
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}