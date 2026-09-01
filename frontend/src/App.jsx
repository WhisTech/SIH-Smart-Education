import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Assessment from './pages/Assessment'
import AssessmentResult from './pages/AssessmentResult'
import IgotDashboard from './pages/IgotDashboard'
import Reassessment from './pages/Reassessment'
import McqGenerator from './pages/McqGenerator'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root path redirects to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Guest routes (accessible only when logged out) */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <Signup />
              </GuestRoute>
            }
          />

          {/* Protected routes (require active session) */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/assessment/result/:assessmentId" element={<AssessmentResult />} />
            <Route path="/reassessment" element={<Reassessment />} />
            <Route path="/igot-courses" element={<IgotDashboard />} />
            <Route path="/mcq-generator" element={<McqGenerator />} />
          </Route>

          {/* Fallback 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

function NotFound() {
  return (
    <div className="not-found">
      <span className="brand-emblem large" aria-hidden="true">🏛️</span>
      <h1>404</h1>
      <p>The requested page could not be found.</p>
      <Link to="/dashboard" className="btn btn-primary">
        Return to Dashboard
      </Link>
    </div>
  )
}

export default App
