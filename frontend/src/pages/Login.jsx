import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/LanguageSelector'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { t } = useTranslation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const validate = () => {
    if (!email.trim()) {
      return t('auth.email_req')
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email.trim())) {
      return t('auth.email_invalid')
    }
    if (!password) {
      return t('auth.password_req')
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
          setError(t('system.error') + ': Invalid email or password.') // fallback logic since exact string wasn't fully extracted
        } else if (msg.toLowerCase().includes('email not confirmed')) {
          setError(t('system.error') + ': Please confirm your email.')
        } else {
          setError(msg || t('system.something_went_wrong'))
        }
        setLoading(false)
        return
      }

      if (data?.user) {
        navigate(from, { replace: true })
      }
    } catch {
      setError(t('system.network_error'))
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
          {t('auth.brand_badge')}
        </div>
        
        <h1>{t('auth.brand_title')}</h1>
        
        <p className="auth-left-subtitle">
          {t('auth.brand_subtitle')}
        </p>

        <div className="auth-feature-list">
          <div className="feature-bullet-card">
            <div className="feature-icon-box">🎯</div>
            <div className="feature-info">
              <h3>{t('auth.feature_1_title')}</h3>
              <p>{t('auth.feature_1_desc')}</p>
            </div>
          </div>

          <div className="feature-bullet-card">
            <div className="feature-icon-box">🎓</div>
            <div className="feature-info">
              <h3>{t('auth.feature_2_title')}</h3>
              <p>{t('auth.feature_2_desc')}</p>
            </div>
          </div>

          <div className="feature-bullet-card">
            <div className="feature-icon-box">📊</div>
            <div className="feature-info">
              <h3>{t('auth.feature_3_title')}</h3>
              <p>{t('auth.feature_3_desc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="auth-right-panel">
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <LanguageSelector />
        </div>
        <div className="auth-form-wrapper">
          <div className="auth-tab-group">
            <button type="button" className="auth-tab-btn active">
              {t('auth.login_tab')}
            </button>
            <Link to="/signup" className="auth-tab-btn">
              {t('auth.signup_tab')}
            </Link>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f2338', margin: '0 0 6px 0' }}>
              {t('auth.welcome_back')}
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              {t('auth.login_desc')}
            </p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: '20px' }}>
              <strong>{t('system.error')}:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                {t('auth.email_label')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email_placeholder')}
                autoComplete="email"
                disabled={loading}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label htmlFor="password" style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                {t('auth.password_label')}
              </label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_placeholder')}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                >
                  {showPassword ? t('auth.hide_password') : t('auth.show_password')}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
              style={{ background: '#0f2338', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', width: '100%', cursor: 'pointer' }}
            >
              {loading ? t('auth.signing_in') : t('auth.sign_in_btn')}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '32px' }}>
            {t('auth.auth_footer')}
          </p>
        </div>
      </div>
    </div>
  )
}
