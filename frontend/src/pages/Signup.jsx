import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fetchDesignations, fetchSkills } from '../lib/referenceData'
import SkillSelector from '../components/SkillSelector'

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
    if (!form.name.trim()) return 'Full Name is required.'
    if (!form.email.trim()) return 'Email address is required.'
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(form.email.trim())) {
      return 'Please enter a valid email address (e.g. officer@mospi.gov.in).'
    }
    if (!form.password) return 'Password is required.'
    if (form.password.length < 6) return 'Password must be at least 6 characters long.'
    if (!form.confirmPassword) return 'Please confirm your password.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'

    // 2. Employee Info validation
    if (!form.employeeId.trim()) return 'Employee ID is required.'
    if (!form.designationId) return 'Please select your designation.'
    if (!designations.some((d) => d.id === form.designationId)) {
      return 'The selected designation is not valid. Please choose from the list.'
    }
    if (!form.department) return 'Please select your department.'
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
      // 1. Create Supabase Auth User with metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            name: form.name.trim(),
            employee_id: form.employeeId.trim(),
            designation_id: form.designationId, // UUID
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
        } else if (msg.toLowerCase().includes('rate limit')) {
          setError('Email rate limit reached. Please wait a few moments or use an existing test account.')
        } else {
          setError(msg)
        }
        setLoading(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      if (!authData?.user) {
        setError('Unable to create user account. Please try again.')
        setLoading(false)
        return
      }

      const userId = authData.user.id
      const experienceYears = Number(form.experienceYears)

      // 2. Check if we have an active authenticated session
      const currentSession = authData.session || (await supabase.auth.getSession()).data?.session

      if (currentSession && currentSession.user?.id === userId) {
        // Authenticated session exists! Create employee_profiles row directly
        const { data: profileData, error: profileError } = await supabase
          .from('employee_profiles')
          .insert({
            user_id: userId,
            name: form.name.trim(),
            employee_id: form.employeeId.trim(),
            designation_id: form.designationId, // UUID
            department: form.department,
            experience_years: experienceYears
          })
          .select('id')
          .single()

        if (profileError) {
          if (profileError.message?.toLowerCase().includes('duplicate') || profileError.code === '23505') {
            setError('This Employee ID is already registered. Please check your Employee ID.')
          } else if (profileError.message?.toLowerCase().includes('row-level security')) {
            setError('Permission denied saving profile. Please contact your system administrator.')
          } else {
            setError(`Account created, but employee profile could not be saved: ${profileError.message}`)
          }
          setLoading(false)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }

        const profileId = profileData.id

        // 3. Insert Selected Skills into employee_skills (relational: employee_profile_id, skill_id)
        if (selectedSkillIds.length > 0) {
          const skillRows = selectedSkillIds.map((skillId) => ({
            employee_profile_id: profileId,
            skill_id: skillId
          }))

          const { error: skillsInsertError } = await supabase
            .from('employee_skills')
            .insert(skillRows)

          if (skillsInsertError) {
            console.error('Error saving employee skills:', skillsInsertError.message)
          }
        }

        setSuccess('Registration completed successfully! Redirecting to sign in...')
      } else {
        // Session is null because email confirmation is required by Supabase Auth settings
        setSuccess('Account registered successfully! Please check your email to confirm your account, then sign in to access your dashboard.')
      }

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

      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } catch (err) {
      setError(`A network error occurred: ${err.message || 'Please try again.'}`)
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <span className="brand-emblem large" aria-hidden="true">🏛️</span>
          <h1>Employee Registration &amp; Onboarding</h1>
          <p className="auth-subtitle">
            Ministry of Statistics and Programme Implementation (MoSPI) · Skill Intelligence Platform
          </p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <strong>Notice:</strong> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="status">
            <strong>Success:</strong> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* SECTION 1: ACCOUNT CREDENTIALS */}
          <div className="form-section">
            <h2 className="form-section-title">
              <span className="section-step">1</span> Account Credentials
            </h2>
            <p className="form-section-desc">Set up your portal login email and secure password.</p>

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
                <span className="field-hint">Use your official or registered email address.</span>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <div className="password-field">
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
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <div className="password-field">
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
            </div>

            <div className="form-checkbox-row">
              <label className="checkbox-label">
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
          <div className="form-section">
            <h2 className="form-section-title">
              <span className="section-step">2</span> Official Employee Details
            </h2>
            <p className="form-section-desc">Provide your service particulars in the statistical system.</p>

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
                <label htmlFor="employeeId">Employee ID / Government ID *</label>
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
                <label htmlFor="designationId">Designation *</label>
                <select
                  id="designationId"
                  name="designationId"
                  value={form.designationId}
                  onChange={handleChange}
                  disabled={loading || designationsLoading}
                >
                  <option value="">
                    {designationsLoading
                      ? 'Loading designations from database...'
                      : designations.length === 0
                      ? 'No designations available (Seed required)'
                      : '-- Select Official Designation --'}
                  </option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {designationsError && (
                  <span className="field-hint field-hint-error">{designationsError}</span>
                )}
                {!designationsLoading && !designationsError && designations.length === 0 && (
                  <span className="field-hint field-hint-error">
                    No designations are available yet. Designation seed data is required.
                  </span>
                )}
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
                <label htmlFor="experienceYears">Total Experience in Official Statistics (Years) *</label>
                <input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  min="0"
                  max="60"
                  value={form.experienceYears}
                  onChange={handleChange}
                  placeholder="e.g. 6"
                  disabled={loading}
                />
                <span className="field-hint">Enter total years in statistical service (0 - 60).</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: CURRENT STATISTICAL & TECHNICAL SKILLS */}
          <div className="form-section">
            <h2 className="form-section-title">
              <span className="section-step">3</span> Current Skills &amp; Competencies
            </h2>
            <p className="form-section-desc">
              Select the statistical and technical competencies you currently possess.
            </p>

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

          <div className="form-submit-container">
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || designationsLoading}
            >
              {loading ? 'Creating Account & Saving Profile...' : 'Complete Employee Registration'}
            </button>
            <p className="auth-alt">
              Already have an official account? <Link to="/login">Sign in here</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
