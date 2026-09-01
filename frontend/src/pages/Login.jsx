import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const validate = () => {
    if (!email.trim()) {
      return 'Official Email address is required.'
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email.trim())) {
      return 'Please enter a valid email address.'
    }
    if (!password) {
      return 'Password is required.'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (signInError) {
        const msg = signInError.message || ''
        if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid_credentials')) {
          setError('Invalid email or password. Please verify your credentials.')
        } else if (msg.toLowerCase().includes('email not confirmed')) {
          setError('Please confirm your email before signing in.')
        } else {
          setError(msg || 'Unable to sign in. Please try again.')
        }
        setLoading(false)
        return
      }

      if (data?.user) {
        navigate(from, { replace: true })
      }
    } catch {
      setError('A network error occurred. Please check your connection and try again.')
      setLoading(false)
    }
  }

  if (user && !authLoading) {
    navigate('/dashboard', { replace: true })
    return null
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <span className="brand-emblem large" aria-hidden="true">🏛️</span>
          <h1>Official Employee Sign In</h1>
          <p className="auth-subtitle">
            Ministry of Statistics and Programme Implementation (MoSPI) · Skill Intelligence Platform
          </p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Official Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. officer@mospi.gov.in"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In to Portal'}
          </button>
        </form>

        <p className="auth-alt">
          New official? <Link to="/signup">Register your employee account</Link>
        </p>
      </div>
    </div>
  )
}
