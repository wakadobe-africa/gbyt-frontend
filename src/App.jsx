import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import AdminLayout from './components/AdminLayout'
import Navbar            from './components/Navbar'
import ProtectedRoute    from './components/ProtectedRoute'
import HomePage          from './pages/HomePage'
import SearchPage        from './pages/SearchPage'
import ResultsPage       from './pages/ResultPage'
import AboutPage         from './pages/AboutPage'
import LoginPage         from './pages/LoginPage'
import RegisterPage      from './pages/RegisterPage'
import HistoryPage       from './pages/HistoryPage'
import AdminRoute       from './components/AdminRoute'
import AdminDashboard   from './pages/admin/AdminDashboard'
import AdminUsers       from './pages/admin/AdminUsers'
import AdminSearches    from './pages/admin/AdminSearches'
import './App.css'



function App() {
    const location = useLocation()

    const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    // AuthProvider wraps everything
    // Every component inside can access auth state
    

    <AuthProvider>
      <div className={isAdminRoute ? 'admin-shell-wrapper' : 'app'}>
      {!isAdminRoute && <Navbar />}
      <main className={isAdminRoute ? 'admin-shell-main' : 'app-main'}>
          <Routes>

            {/* Public routes — anyone can access */}
            <Route path="/"         element={<HomePage />}     />
            <Route path="/about"    element={<AboutPage />}    />
            <Route path="/login"    element={<LoginPage />}    />
            <Route path="/register" element={<RegisterPage />} />

            {/* Semi-protected — accessible but save requires login */}
            <Route path="/search"   element={<SearchPage />}   />
            <Route path="/results"  element={<ResultsPage />}  />

            {/* Fully protected — redirects to login if not authenticated */}
            <Route path="/history" element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={
              <div className="not-found">
                <h1>404</h1>
                <p>This page doesn't exist</p>
                <Link to="/">Go Home</Link>
              </div>
            } />
            {/* Admin routes — only accessible to logged in admins 
            // Update your admin routes — each one wraps its page in AdminLayout */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AdminRoute>
            } />

            <Route path="/admin/users" element={
              <AdminRoute>
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              </AdminRoute>
            } />

            <Route path="/admin/searches" element={
              <AdminRoute>
                <AdminLayout>
                  <AdminSearches />
                </AdminLayout>
              </AdminRoute>
            } />
          </Routes>
        </main>
      </div>
      
    </AuthProvider>
  )


  
}

export default App