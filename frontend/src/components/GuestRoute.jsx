import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from './LoadingScreen'

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen message="Loading..." />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
