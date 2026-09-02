import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchDesignations, fetchSkills } from '../lib/referenceData'
import LoadingScreen from '../components/LoadingScreen'
import SkillSelector from '../components/SkillSelector'
import { useTranslation } from 'react-i18next'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

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

export default function Profile() {
  const { t } = useTranslation()
  const { user, profile, loading: authLoading, profileLoading, reloadProfile } = useAuth()

  // UI state
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  // Reference data
  const [designations, setDesignations] = useState([])
  const [designationsLoading, setDesignationsLoading] = useState(true)
  const [skills, setSkills] = useState([])
  const [skillsLoading, setSkillsLoading] = useState(true)

  // Employee's assigned skills (array of skill objects { id, name, category })
  const [employeeSkills, setEmployeeSkills] = useState([])
  const [employeeSkillsLoading, setEmployeeSkillsLoading] = useState(true)

  // Assessment summary state
  const [latestAssessment, setLatestAssessment] = useState(null)
  const [historyList, setHistoryList] = useState([])
  const [assessmentLoading, setAssessmentLoading] = useState(true)

  // Edit mode selected skills (array of skill UUIDs)
  const [editSkillIds, setEditSkillIds] = useState([])

  // Fetch reference designations and skills
  useEffect(() => {
    let isMounted = true

    const loadRefData = async () => {
      setDesignationsLoading(true)
      setSkillsLoading(true)
      try {
        const [dRes, sRes] = await Promise.all([
          fetchDesignations(),
          fetchSkills()
        ])
        if (isMounted) {
          setDesignations(dRes.data || [])
          setSkills(sRes.data || [])
        }
      } catch (err) {
        console.error('Error loading reference data:', err)
      } finally {
        if (isMounted) {
          setDesignationsLoading(false)
          setSkillsLoading(false)
        }
      }
    }

    loadRefData()

    return () => {
      isMounted = false
    }
  }, [])

  // Fetch employee skills whenever profile changes or version increments
  const [skillsVersion, setSkillsVersion] = useState(0)

  useEffect(() => {
    let isMounted = true

    const fetchEmpSkills = async () => {
      if (!profile?.id) {
        setEmployeeSkillsLoading(false)
        return
      }
      setEmployeeSkillsLoading(true)
      try {
        const { data: empSkillRows, error: esError } = await supabase
          .from('employee_skills')
          .select('skill_id')
          .eq('employee_profile_id', profile.id)

        if (esError || !empSkillRows || empSkillRows.length === 0) {
          if (isMounted) setEmployeeSkills([])
          return
        }

        const assignedSkillIds = empSkillRows.map((row) => row.skill_id)

        const { data: skillDetails, error: sError } = await supabase
          .from('skills')
          .select('id, name, description, category')
          .in('id', assignedSkillIds)

        if (isMounted) {
          if (!sError && skillDetails && skillDetails.length > 0) {
            setEmployeeSkills(skillDetails)
          } else {
            const sRes = await fetchSkills()
            const allSkills = sRes.data || []
            const matched = allSkills.filter((s) => assignedSkillIds.includes(s.id))
            setEmployeeSkills(matched)
          }
        }
      } catch (err) {
        console.error('Error loading employee skills:', err)
        if (isMounted) setEmployeeSkills([])
      } finally {
        if (isMounted) setEmployeeSkillsLoading(false)
      }
    }

    fetchEmpSkills()

    return () => {
      isMounted = false
    }
  }, [profile?.id, skillsVersion])

  // Fetch assessment summary and attempt history
  useEffect(() => {
    let isMounted = true

    const loadAssessmentSummary = async () => {
      if (!user) {
        if (isMounted) setAssessmentLoading(false)
        return
      }

      setAssessmentLoading(true)

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (token) {
          const [latestRes, historyRes] = await Promise.all([
            fetch(`${BACKEND_URL}/api/assessment/user/latest`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`${BACKEND_URL}/api/assessment/user/history`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ])

          if (latestRes.ok && latestRes.headers.get('content-type')?.includes('application/json')) {
            const latestData = await latestRes.json()
            if (isMounted && latestData.success) setLatestAssessment(latestData.latestAssessment)
          }

          if (historyRes.ok && historyRes.headers.get('content-type')?.includes('application/json')) {
            const historyData = await historyRes.json()
            if (isMounted && historyData.success) setHistoryList(historyData.history || [])
          }
        }
      } catch (err) {
        console.error('Error loading profile assessment summary:', err)
      } finally {
        if (isMounted) setAssessmentLoading(false)
      }
    }

    loadAssessmentSummary()

    return () => {
      isMounted = false
    }
  }, [user])

  // Get designation name by UUID
  const getDesignationName = (id) => {
    if (!id) return '—'
    const match = designations.find((d) => d.id === id)
    return match ? match.name : id
  }

  // Switch to Edit Mode (or Create Mode if no profile exists)
  const startEditing = () => {
    setError('')
    setSuccess('')
    setForm({
      name: profile?.name || user?.user_metadata?.name || '',
      employee_id: profile?.employee_id || user?.user_metadata?.employee_id || '',
      designation_id: profile?.designation_id || user?.user_metadata?.designation_id || '',
      department: profile?.department || user?.user_metadata?.department || '',
      experience_years: profile?.experience_years ?? user?.user_metadata?.experience_years ?? ''
    })
    setEditSkillIds(employeeSkills.map((s) => s.id))
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setError('')
    setSuccess('')
    setForm(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const toggleEditSkill = (skillId) => {
    setEditSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    )
  }

  const removeEditSkill = (skillId) => {
    setEditSkillIds((prev) => prev.filter((id) => id !== skillId))
  }

  const addEditSkill = (skillId) => {
    if (skillId && !editSkillIds.includes(skillId)) {
      setEditSkillIds((prev) => [...prev, skillId])
    }
  }

  const validate = () => {
    if (!form.name.trim()) return t('Full Name is required.')
    if (!form.employee_id.trim()) return t('Employee ID is required.')
    if (!form.designation_id) return t('Please select a valid designation.')
    if (!designations.some((d) => d.id === form.designation_id)) {
      return t('The selected designation is no longer available. Please choose again.')
    }
    if (!form.department) return t('Please select a department.')
    if (form.experience_years === '') return t('Experience years is required.')
    const years = Number(form.experience_years)
    if (Number.isNaN(years) || years < 0 || years > 60) {
      return t('Experience years must be a number between 0 and 60.')
    }
    return null
  }

  // Save changes to profile and employee_skills
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      // 1. Upsert employee_profiles row under authenticated user session
      const profileData = {
        user_id: user.id,
        name: form.name.trim(),
        employee_id: form.employee_id.trim(),
        designation_id: form.designation_id,
        department: form.department,
        experience_years: Number(form.experience_years),
        updated_at: new Date().toISOString()
      }
      if (profile?.id) {
        profileData.id = profile.id
      }

      const { data: savedProfile, error: profileUpdateError } = await supabase
        .from('employee_profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select('id')
        .maybeSingle()

      if (profileUpdateError) {
        if (profileUpdateError.message?.toLowerCase().includes('duplicate') || profileUpdateError.code === '23505') {
          setError(t('This Employee ID is already registered to another account.'))
        } else if (profileUpdateError.message?.toLowerCase().includes('row-level security')) {
          setError(t('Permission error updating profile. Please check your credentials.'))
        } else {
          setError(`${t('Unable to save profile changes:')} ${profileUpdateError.message}`)
        }
        setSaving(false)
        return
      }

      const activeProfileId = savedProfile?.id || profile?.id

      if (activeProfileId) {
        // 2. Relational update of employee_skills
        const { data: currentEmpSkills } = await supabase
          .from('employee_skills')
          .select('skill_id')
          .eq('employee_profile_id', activeProfileId)

        const existingSkillIds = (currentEmpSkills || []).map((r) => r.skill_id)
        const skillsToAdd = editSkillIds.filter((id) => !existingSkillIds.includes(id))
        const skillsToRemove = existingSkillIds.filter((id) => !editSkillIds.includes(id))

        if (skillsToAdd.length > 0) {
          const rowsToInsert = skillsToAdd.map((skillId) => ({
            employee_profile_id: activeProfileId,
            skill_id: skillId
          }))
          const { error: insErr } = await supabase.from('employee_skills').insert(rowsToInsert)
          if (insErr) console.error('Error adding skills:', insErr)
        }

        if (skillsToRemove.length > 0) {
          const { error: delErr } = await supabase
            .from('employee_skills')
            .delete()
            .eq('employee_profile_id', activeProfileId)
            .in('skill_id', skillsToRemove)
          if (delErr) console.error('Error removing skills:', delErr)
        }
      }

      // 3. Refresh context and local states
      await reloadProfile()
      setSkillsVersion((v) => v + 1)

      setSuccess(t('Your profile and skills have been successfully saved.'))
      setIsEditing(false)
    } catch (err) {
      setError(`${t('A network error occurred while saving:')} ${err.message || t('Please try again.')}`)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || profileLoading) {
    return <LoadingScreen message={t('Loading your official profile...')} />
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Official Employee Profile')}</h1>
          <p className="page-subtitle">
            {t('Manage your service particulars, verified competencies, and AI assessment performance')}
          </p>
        </div>
        {!isEditing && profile && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={startEditing}
          >
            {t('Edit Profile & Skills')}
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <strong>{t('Notice:')}</strong> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          <strong>{t('Success:')}</strong> {success}
        </div>
      )}

      {!profile && !isEditing ? (
        <div className="empty-state">
          <span className="brand-emblem large" aria-hidden="true">⚠️</span>
          <h2>{t('Employee Profile Not Set Up')}</h2>
          <p>
            {t('No employee profile record is currently linked to your account. You can complete your official profile and current skills now.')}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={startEditing}
          >
            {t('+ Set Up Profile & Skills Now')}
          </button>
        </div>
      ) : !isEditing ? (
        /* VIEW MODE */
        <div className="profile-view-grid">
          {/* Card 1: Official Particulars */}
          <div className="card">
            <h2 className="card-section-title">{t('Official Particulars')}</h2>
            <div className="profile-details-table">
              <div className="profile-row">
                <span className="profile-label">{t('Full Name')}</span>
                <span className="profile-value strong">{profile.name || '—'}</span>
              </div>

              <div className="profile-row">
                <span className="profile-label">{t('Employee / Gov ID')}</span>
                <span className="profile-value">
                  <code>{profile.employee_id || '—'}</code>
                </span>
              </div>

              <div className="profile-row">
                <span className="profile-label">{t('Email Address')}</span>
                <span className="profile-value">
                  {user?.email || '—'}
                  <span className="tag tag-auth">{t('Verified Login')}</span>
                </span>
              </div>

              <div className="profile-row">
                <span className="profile-label">{t('Official Designation')}</span>
                <span className="profile-value">
                  {getDesignationName(profile.designation_id)}
                </span>
              </div>

              <div className="profile-row">
                <span className="profile-label">{t('Department / Division')}</span>
                <span className="profile-value">{profile.department || '—'}</span>
              </div>

              <div className="profile-row">
                <span className="profile-label">{t('Experience in Statistics')}</span>
                <span className="profile-value">
                  {profile.experience_years != null
                    ? `${profile.experience_years} ${t('Years')}`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Current Competencies & Skills */}
          <div className="card">
            <div className="section-title-sm">
              <h2 className="card-section-title">{t('Verified Skills & Competencies')}</h2>
              <span className="badge-count">{employeeSkills.length} {t('Skills')}</span>
            </div>

            {employeeSkillsLoading ? (
              <p className="loading-text">{t('Loading skills...')}</p>
            ) : employeeSkills.length === 0 ? (
              <div className="empty-skills-notice">
                <p>{t('No skills recorded yet for your profile.')}</p>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={startEditing}
                >
                  {t('+ Add Your Skills')}
                </button>
              </div>
            ) : (
              <div className="profile-skills-grid">
                {employeeSkills.map((s) => (
                  <div key={s.id} className="profile-skill-badge">
                    <span className="badge-cat">{s.category || t('Skill')}</span>
                    <span className="badge-name">{s.name}</span>
                    {s.description && (
                      <span className="badge-desc">{s.description}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: FEATURE 11 & 12 — ASSESSMENT SUMMARY & HISTORY */}
          <div className="card profile-assessment-card full-width-card">
            <div className="section-title-sm">
              <h2 className="card-section-title">{t('AI Assessment Performance & History')}</h2>
              <Link to="/assessment" className="btn btn-primary btn-sm">
                {t('+ Start Assessment')}
              </Link>
            </div>

            {assessmentLoading ? (
              <p className="loading-text">{t('Loading assessment history...')}</p>
            ) : !latestAssessment ? (
              <div className="empty-assessment-notice">
                <p>{t('No assessment attempts recorded yet.')}</p>
                <Link to="/assessment" className="btn btn-primary btn-sm">
                  {t('Take Your First AI Competency Assessment')}
                </Link>
              </div>
            ) : (
              <div className="profile-assessment-content">
                {/* Summary Row */}
                <div className="assessment-summary-row">
                  <div className="summary-stat-box">
                    <span className="stat-num">{Math.round(latestAssessment.overallScore)}%</span>
                    <span className="stat-lbl">{t('Overall Competency Score')}</span>
                  </div>

                  <div className="summary-highlights-box">
                    {latestAssessment.strengths && latestAssessment.strengths.length > 0 && (
                      <div className="highlight-item">
                        <span className="hl-label">{t('Strong Skills:')}</span>
                        <div className="hl-tags">
                          {latestAssessment.strengths.map((s, i) => (
                            <span key={i} className="chip chip-success">✓ {s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {latestAssessment.areasToImprove && latestAssessment.areasToImprove.length > 0 && (
                      <div className="highlight-item">
                        <span className="hl-label">{t('Needs Improvement:')}</span>
                        <div className="hl-tags">
                          {latestAssessment.areasToImprove.map((s, i) => (
                            <span key={i} className="chip chip-warning">⚠ {s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="summary-action-box">
                    <Link
                      to={`/assessment/result/${latestAssessment.assessmentId}`}
                      className="btn btn-outline"
                    >
                      {t('View Full Assessment Result')}
                    </Link>
                  </div>
                </div>

                {/* History Table */}
                {historyList && historyList.length > 0 && (
                  <div className="assessment-history-section">
                    <h3 className="history-title">{t('Assessment History')}</h3>
                    <div className="history-table-wrapper">
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>{t('Completion Date')}</th>
                            <th>{t('Questions Correct')}</th>
                            <th>{t('Overall Score')}</th>
                            <th>{t('Status')}</th>
                            <th>{t('Action')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyList.map((item) => (
                            <tr key={item.assessmentId}>
                              <td>{new Date(item.completedAt).toLocaleDateString()}</td>
                              <td>{item.correctAnswers} / {item.totalQuestions}</td>
                              <td>
                                <strong>{Math.round(item.scorePercentage)}%</strong>
                              </td>
                              <td>
                                <span className="tag tag-success">{t('Completed')}</span>
                              </td>
                              <td>
                                <Link
                                  to={`/assessment/result/${item.assessmentId}`}
                                  className="link-sm"
                                >
                                  {t('View Result')}
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* EDIT / CREATE MODE */
        <div className="card edit-card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="edit-form-header">
              <h2>{profile ? t('Edit Employee Profile & Skills') : t('Set Up Employee Profile & Skills')}</h2>
              <p className="muted">{t('Enter your official details and mapped competencies.')}</p>
            </div>

            {/* Sub-section: Particulars */}
            <div className="form-section">
              <h3 className="form-section-title">{t('1. Employee Information')}</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">{t('Full Name *')}</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="employee_id">{t('Employee ID *')}</label>
                  <input
                    id="employee_id"
                    name="employee_id"
                    type="text"
                    value={form.employee_id}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="designation_id">{t('Designation *')}</label>
                  <select
                    id="designation_id"
                    name="designation_id"
                    value={form.designation_id}
                    onChange={handleChange}
                    disabled={saving || designationsLoading}
                  >
                    <option value="">
                      {designationsLoading ? t('Loading designations...') : t('-- Select Designation --')}
                    </option>
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="department">{t('Department / Division *')}</label>
                  <select
                    id="department"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="">{t('-- Select Department --')}</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="experience_years">{t('Experience in Statistics (Years) *')}</label>
                  <input
                    id="experience_years"
                    name="experience_years"
                    type="number"
                    min="0"
                    max="60"
                    value={form.experience_years}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Sub-section: Skills Selection */}
            <div className="form-section">
              <h3 className="form-section-title">{t('2. Manage Current Skills')}</h3>
              <p className="form-section-desc">
                {t('Select or deselect skills to update your current competency portfolio.')}
              </p>

              <SkillSelector
                skills={skills}
                skillsLoading={skillsLoading}
                skillsError=""
                selectedSkillIds={editSkillIds}
                onToggleSkill={toggleEditSkill}
                onRemoveSkill={removeEditSkill}
                onAddSkill={addEditSkill}
                disabled={saving}
              />
            </div>

            <div className="form-actions">
              {profile && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  {t('Cancel')}
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? t('Saving Profile...') : t('Save Profile & Skills')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
