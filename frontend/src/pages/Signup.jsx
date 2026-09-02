import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fetchDesignations, fetchSkills } from '../lib/referenceData'
import SkillSelector from '../components/SkillSelector'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/LanguageSelector'

// Standard Ministry of Statistics & Programme Implementation Departments
const DEPARTMENTS = [
  'National Statistical Office (NSO)',
  'NSO - Survey Design & Research Division (SDRD)',
  'NSO - Field Operations Division (FOD)',
  'NSO - Data Processing Division (DPD)',
  'NSO - Economic Statistics Division (ESD)',
  'NSO - Social Statistics Division (SSD)',
  'NSO - National Accounts Division (NAD)',
  'Data Analytics & Dissemination Unit',
  'IT & Computer Centre',
  'Directorate General of Employment',
  'Administration & Coordination',
  'Other'
]

export default function Signup() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Form input state
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    designationId: '',
    department: '',
    experienceYears: ''
  })

  // Selected skills state (array of skill UUIDs)
  const [selectedSkillIds, setSelectedSkillIds] = useState([])

  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Reference data state
  const [designations, setDesignations] = useState([])
  const [designationsLoading, setDesignationsLoading] = useState(true)
  const [designationsError, setDesignationsError] = useState('')

  const [skills, setSkills] = useState([])
  const [skillsLoading, setSkillsLoading] = useState(true)
  const [skillsError, setSkillsError] = useState('')

  // Load designations and skills on mount
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setDesignationsLoading(true)
      setSkillsLoading(true)
      setDesignationsError('')
      setSkillsError('')

      try {
        const [desigResult, skillResult] = await Promise.all([
          fetchDesignations(),
          fetchSkills()
        ])

        if (isMounted) {
          if (desigResult.error) {
            setDesignationsError('Could not load designations. Please refresh or try again.')
          } else {
            setDesignations(desigResult.data || [])
          }

          if (skillResult.error) {
            setSkillsError('Could not load skills. Please refresh or try again.')
          } else {
            setSkills(skillResult.data || [])
          }
        }
      } catch {
        if (isMounted) {
          setDesignationsError('A network error occurred while loading reference data.')
          setSkillsError('A network error occurred while loading reference data.')
        }
      } finally {
        if (isMounted) {
          setDesignationsLoading(false)
          setSkillsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Skill selection helpers
  const toggleSkill = (skillId) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    )
  }

  const removeSkill = (skillId) => {
    setSelectedSkillIds((prev) => prev.filter((id) => id !== skillId))
  }

  const addSkill = (skillId) => {
    if (skillId && !selectedSkillIds.includes(skillId)) {
      setSelectedSkillIds((prev) => [...prev, skillId])
    }
  }

  const validate = () => {
    // 1. Account validation
    if (!form.name.trim()) return t('auth.name_req')
    if (!form.email.trim()) return t('auth.email_req')
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(form.email.trim())) {
      return t('auth.email_invalid')
    }
    if (!form.password) return t('auth.password_req')
    if (form.password.length < 6) return t('auth.password_min')
    if (!form.confirmPassword) return 'Please confirm your password.' // Hardcoded fallback for now, as requested to use available keys
    if (form.password !== form.confirmPassword) return 'Passwords do not match.' // Hardcoded fallback for now

    // 2. Employee Info validation
    if (!form.employeeId.trim()) return 'Employee ID is required.' // Hardcoded fallback for now
    if (!form.designationId) return t('auth.designation_req')
    if (!designations.some((d) => d.id === form.designationId)) {
      return 'The selected designation is not valid. Please choose from the list.'
    }
    if (!form.department) return t('auth.department_req')
    if (form.experienceYears === '') return 'Years of experience is required.'
    const years = Number(form.experienceYears)
    if (Number.isNaN(years) || years < 0 || years > 60) {
      return 'Experience years must be a valid number between 0 and 60.'
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (designationsLoading || skillsLoading) {
      setError('Please wait while reference data finishes loading.')
      return
    }

    if (designations.length === 0) {
      setError('Designation seed data is required. Contact your system administrator.')
      return
    }

    setLoading(true)

    try {
      // 1. Call Backend Registration Endpoint for Instant Auto-Confirmed Account Creation
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
      const regRes = await fetch(`${BACKEND_URL}/api/auth/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          employeeId: form.employeeId.trim(),
          designationId: form.designationId,
          department: form.department,
          experienceYears: Number(form.experienceYears),
          skillIds: selectedSkillIds
        })
      })

      const regData = await regRes.json()

      if (!regData.success) {
        throw new Error(regData.message || 'Registration failed.')
      }

      setSuccess('Account registered successfully! Redirecting to sign in...')

      setForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        employeeId: '',
        designationId: '',
        department: '',
        experienceYears: ''
      })
      setSelectedSkillIds([])
      setLoading(false)

      setTimeout(() => {
        navigate('/login')
      }, 1500)
      return
    } catch (regErr) {
      console.warn('Backend registration API failed, trying client fallback:', regErr.message)
      // Client fallback: Create Supabase Auth User directly
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            name: form.name.trim(),
            employee_id: form.employeeId.trim(),
            designation_id: form.designationId,
            department: form.department,
            experience_years: Number(form.experienceYears),
            skill_ids: selectedSkillIds
          }
        }
      })

      if (signUpError) {
        const msg = signUpError.message || 'Signup failed.'
        if (msg.toLowerCase().includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          setError(msg)
        }
        setLoading(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      setSuccess('Registration completed! You can now sign in with your email and password.')
      setLoading(false)
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    }
  }

  return (
    <div className="auth-split-container signup-mode">
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
      <div className="auth-right-panel" style={{ alignItems: 'stretch' }}>
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <LanguageSelector />
        </div>
        <div className="auth-form-wrapper" style={{ maxWidth: '620px', margin: '0 auto' }}>
          <div className="auth-tab-group">
            <Link to="/login" className="auth-tab-btn">
              {t('auth.login_tab')}
            </Link>
            <button type="button" className="auth-tab-btn active">
              {t('auth.signup_tab')}
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f2338', margin: '0 0 6px 0' }}>
              {t('auth.signup_welcome')}
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              {t('auth.signup_desc')}
            </p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: '20px' }}>
              <strong>Notice:</strong> {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="status" style={{ marginBottom: '20px' }}>
              <strong>Success:</strong> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* SECTION 1: ACCOUNT CREDENTIALS */}
            <div className="form-section" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f2338', marginBottom: '12px' }}>
                1. Account Credentials
              </h3>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="email">Official Email Address *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="e.g. officer.name@mospi.gov.in"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-checkbox-row" style={{ marginTop: '8px' }}>
                <label className="checkbox-label" style={{ fontSize: '13px', color: '#64748b' }}>
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword((s) => !s)}
                  />
                  Show passwords
                </label>
              </div>
            </div>

            {/* SECTION 2: OFFICIAL EMPLOYEE DETAILS */}
            <div className="form-section" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f2338', marginBottom: '12px' }}>
                2. Employee Service Particulars
              </h3>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Rajesh Verma"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="employeeId">Employee ID / Gov ID *</label>
                  <input
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    value={form.employeeId}
                    onChange={handleChange}
                    placeholder="e.g. MOSPI-10482"
                    autoComplete="off"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="designationId">Official Designation *</label>
                  <select
                    id="designationId"
                    name="designationId"
                    value={form.designationId}
                    onChange={handleChange}
                    disabled={loading || designationsLoading}
                  >
                    <option value="">
                      {designationsLoading
                        ? 'Loading designations...'
                        : '-- Select Designation --'}
                    </option>
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department / Division *</label>
                  <select
                    id="department"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">-- Select Department --</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="experienceYears">Experience in Service (Years) *</label>
                  <input
                    id="experienceYears"
                    name="experienceYears"
                    type="number"
                    min="0"
                    max="60"
                    value={form.experienceYears}
                    onChange={handleChange}
                    placeholder="e.g. 5"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: CURRENT SKILLS */}
            <div className="form-section" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f2338', marginBottom: '12px' }}>
                3. Current Skills &amp; Competencies
              </h3>

              <SkillSelector
                skills={skills}
                skillsLoading={skillsLoading}
                skillsError={skillsError}
                selectedSkillIds={selectedSkillIds}
                onToggleSkill={toggleSkill}
                onRemoveSkill={removeSkill}
                onAddSkill={addSkill}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || designationsLoading}
              style={{ background: '#0f2338', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', width: '100%', cursor: 'pointer' }}
            >
              {loading ? 'Creating Account & Saving Profile...' : 'Complete Employee Registration'}
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
