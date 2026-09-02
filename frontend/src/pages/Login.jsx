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
    <div className="auth-split-container">
      {/* LEFT HERO & BRANDING PANEL */}
      <div className="auth-left-panel">
        <div className="auth-brand-badge">
          🏛️ MoSPI Skill Intelligence Platform
        </div>
        
        <h1>Ministry of Statistics &amp; Programme Implementation</h1>
        
        <p className="auth-left-subtitle">
          A unified AI-powered platform for official statistical capacity building, adaptive skill assessment, and personalized iGOT Karmayogi course recommendations.
        </p>

        <div className="auth-feature-list">
          <div className="feature-bullet-card">
            <div className="feature-icon-box">🎯</div>
            <div className="feature-info">
              <h3>AI Competency Assessment</h3>
              <p>Adaptive skill evaluation driven by Groq LLaMA models with real-time competency scoring.</p>
            </div>
          </div>

          <div className="feature-bullet-card">
            <div className="feature-icon-box">🎓</div>
            <div className="feature-info">
              <h3>iGOT Karmayogi Courses</h3>
              <p>Tailored training recommendations mapped directly to official MoSPI designations and skill gaps.</p>
            </div>
          </div>

          <div className="feature-bullet-card">
            <div className="feature-icon-box">📊</div>
            <div className="feature-info">
              <h3>Research Engine &amp; Analytics</h3>
              <p>4-Signal Fusion recommendation algorithms, TransE Knowledge Graph, and statistical copilot.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="auth-right-panel">
        <div className="auth-form-wrapper">
          <div className="auth-tab-group">
            <button type="button" className="auth-tab-btn active">
              Login
            </button>
            <Link to="/signup" className="auth-tab-btn">
              Create Account
            </Link>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f2338', margin: '0 0 6px 0' }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Please enter your credentials to access your official portal.
            </p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: '20px' }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. officer@mospi.gov.in"
                autoComplete="email"
                disabled={loading}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label htmlFor="password" style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                Password *
              </label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
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
              style={{ background: '#0f2338', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', width: '100%', cursor: 'pointer' }}
            >
              {loading ? 'Signing in...' : 'Sign In to Portal'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '32px' }}>
            Protected with Supabase Authentication &amp; Government Encrypted Database
          </p>
        </div>
      </div>
    </div>
  )
}
