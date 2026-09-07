import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchDesignations, fetchSkills } from '../lib/referenceData'
import LoadingScreen from '../components/LoadingScreen'
import SkillSelector from '../components/SkillSelector'
import { useTranslation } from 'react-i18next'
import { 
  Award, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  ExternalLink, 
  History, 
  Mail, 
  ShieldCheck, 
  UserCheck,
  User,
  Printer,
  BookOpen,
  GraduationCap,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  FileText
} from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'particulars' | 'skills' | 'history' | 'training' | 'honors'
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

  // Employee's assigned skills
  const [employeeSkills, setEmployeeSkills] = useState([])
  const [employeeSkillsLoading, setEmployeeSkillsLoading] = useState(true)

  // Assessment summary & history
  const [latestAssessment, setLatestAssessment] = useState(null)
  const [historyList, setHistoryList] = useState([])
  const [assessmentLoading, setAssessmentLoading] = useState(true)

  // Training / Recommended courses
  const [trainingCourses, setTrainingCourses] = useState([])
  const [trainingLoading, setTrainingLoading] = useState(true)

  // Workflow & Achievements
  const [workflowStatus, setWorkflowStatus] = useState(null)
  const [arenaBadges, setArenaBadges] = useState([])

  // Edit mode selected skills (array of UUIDs)
  const [editSkillIds, setEditSkillIds] = useState([])
  const [skillsVersion, setSkillsVersion] = useState(0)

  // 1. Fetch reference designations and skills
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

  // 2. Fetch employee skills
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

  // 3. Fetch assessment history, workflow status, and training records
  useEffect(() => {
    let isMounted = true

    const loadAssessmentAndTraining = async () => {
      if (!user) {
        if (isMounted) {
          setAssessmentLoading(false)
          setTrainingLoading(false)
        }
        return
      }

      setAssessmentLoading(true)
      setTrainingLoading(true)

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (token) {
          const [latestRes, historyRes, workflowRes] = await Promise.all([
            fetch(`${BACKEND_URL}/api/assessment/user/latest`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`${BACKEND_URL}/api/assessment/user/history`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`${BACKEND_URL}/api/assessment/user/workflow-status`, {
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

          if (workflowRes.ok && workflowRes.headers.get('content-type')?.includes('application/json')) {
            const wfData = await workflowRes.json()
            if (isMounted && wfData.success) setWorkflowStatus(wfData)
          }
        }

        // Fetch relevant courses for training record
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title, provider, source_type, level, external_url, skill_id, skills(name)')
          .limit(8)

        if (isMounted && coursesData) {
          setTrainingCourses(coursesData.map(c => ({
            id: c.id,
            title: c.title,
            provider: c.provider || 'iGOT Karmayogi',
            platform: c.source_type || 'iGOT Karmayogi',
            level: c.level || 'Intermediate',
            url: c.external_url || 'https://igotkarmayogi.gov.in/',
            skillName: c.skills?.name || 'Statistical Competency'
          })))
        }

        // Fetch arena badges for this user
        const { data: arenaBadgesData } = await supabase
          .from('user_arena_badges')
          .select('..., arena_badges(*)')
          .eq('user_id', user.id)

        if (isMounted && arenaBadgesData) {
           setArenaBadges(arenaBadgesData.map(b => ({
             id: `arena_badge_${b.arena_badges.id}`,
             title: b.arena_badges.name,
             description: b.arena_badges.description,
             icon: b.arena_badges.icon,
             earned: true
           })))
        }
      } catch (err) {
        console.error('Error loading profile assessment/training data:', err)
      } finally {
        if (isMounted) {
          setAssessmentLoading(false)
          setTrainingLoading(false)
        }
      }
    }

    loadAssessmentAndTraining()

    return () => {
      isMounted = false
    }
  }, [user])

  // Get designation name
  const designationName = useMemo(() => {
    if (!profile?.designation_id) return 'Indian Statistical Service'
    const match = designations.find((d) => d.id === profile.designation_id)
    return match ? match.name : profile.designation_id
  }, [profile?.designation_id, designations])

  // Group verified skills by category
  const categorizedSkills = useMemo(() => {
    const groups = {}
    employeeSkills.forEach((s) => {
      const cat = s.category || 'General Statistical Competencies'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(s)
    })
    return groups
  }, [employeeSkills])

  // Print Dossier handler
  const handlePrint = () => {
    window.print()
  }

  // Edit Mode Handlers
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
    if (!form.employee_id.trim()) return t('Employee ID / OID is required.')
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

      await reloadProfile()
      setSkillsVersion((v) => v + 1)

      setSuccess(t('Your official profile and competency records have been successfully saved.'))
      setIsEditing(false)
    } catch (err) {
      setError(`${t('A network error occurred while saving:')} ${err.message || t('Please try again.')}`)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || profileLoading) {
    return <LoadingScreen message={t('Loading official employee dossier...')} />
  }

  const initialLetter = profile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'O'

  return (
    <div className="profile-dossier-page">
      
      {/* 1. TOP CREST BAR: Government of India & MoSPI */}
      <div className="dossier-crest-bar">
        <div className="dossier-crest-title">
          <span>🏛️</span>
          <span>Government of India · Ministry of Statistics and Programme Implementation</span>
        </div>
        <div className="dossier-crest-tag">
          Official Dossier · ISS Cadre
        </div>
      </div>

      {/* 2. MASTER IDENTITY DOSSIER HERO CARD */}
      <div className="dossier-hero-card">
        <div className="dossier-hero-body">
          <div className="dossier-main-row">
            
            {/* Officer Portrait & Verification Seal */}
            <div className="dossier-avatar-box">
              <div className="dossier-avatar" aria-hidden="true">
                {initialLetter}
              </div>
              <span className="dossier-verified-seal" title="Verified MoSPI Officer">
                ✓
              </span>
            </div>

            {/* Officer Primary Metadata */}
            <div className="dossier-info-col">
              <div className="dossier-cadre-badge">
                <ShieldCheck size={14} color="#0b1f3a" />
                <span>Indian Statistical Service (ISS) · Regular Cadre</span>
              </div>
              
              <h1 className="dossier-officer-name">
                {profile?.name || user?.email?.split('@')[0] || 'Official Officer'}
              </h1>
              
              <div className="dossier-desig-text">
                <span>{designationName}</span>
                <span className="dossier-dept-chip">
                  <Building2 size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                  {profile?.department || 'National Statistical Office'}
                </span>
              </div>

              <div className="dossier-meta-row">
                <div className="dossier-meta-item">
                  <span>OID / ID:</span>
                  <code>{profile?.employee_id || '921007'}</code>
                </div>
                <div className="dossier-meta-item">
                  <Mail size={13} />
                  <span>{user?.email || 'officer@mospi.gov.in'}</span>
                </div>
                <div className="dossier-meta-item">
                  <Calendar size={13} />
                  <span>Experience: <strong>{profile?.experience_years ?? 5} Years</strong></span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="dossier-actions">
              {!isEditing && profile && (
                <>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handlePrint}
                    title="Print / Save Dossier"
                  >
                    <Printer size={15} /> {t('Print Dossier')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={startEditing}
                  >
                    <Edit3 size={15} /> {t('Edit Profile & Skills')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="dossier-stats-strip">
            <div className="dossier-stat-box">
              <span className="dossier-stat-label">Verified Competencies</span>
              <span className="dossier-stat-val highlight">{employeeSkills.length} Skills</span>
            </div>
            <div className="dossier-stat-box">
              <span className="dossier-stat-label">AI Assessments</span>
              <span className="dossier-stat-val">{historyList.length || (latestAssessment ? 1 : 0)} Completed</span>
            </div>
            <div className="dossier-stat-box">
              <span className="dossier-stat-label">Latest Benchmark Score</span>
              <span className="dossier-stat-val">
                {latestAssessment ? `${Math.round(latestAssessment.overallScore)}%` : 'Pending'}
              </span>
            </div>
            <div className="dossier-stat-box">
              <span className="dossier-stat-label">Cadre Record Status</span>
              <span className="dossier-stat-val" style={{ color: '#15803d' }}>● Active / Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error & Success Banners */}
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '20px' }}>
          <strong>{t('Notice:')}</strong> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status" style={{ marginBottom: '20px' }}>
          <strong>{t('Success:')}</strong> {success}
        </div>
      )}

      {/* 3. DOSSIER CONTENT / TABS OR EDIT MODE */}
      {!profile && !isEditing ? (
        <div className="empty-assessment-notice" style={{ maxWidth: '700px', margin: '40px auto' }}>
          <span className="brand-emblem large" aria-hidden="true">⚠️</span>
          <h2>{t('Employee Profile Not Set Up')}</h2>
          <p className="muted-sm">
            {t('No employee profile record is currently linked to your account. You can complete your official profile and current skills now.')}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={startEditing}
            style={{ marginTop: '14px' }}
          >
            {t('+ Set Up Profile & Skills Now')}
          </button>
        </div>
      ) : !isEditing ? (
        <>
          {/* Section Navigation Tabs */}
          <div className="dossier-tabs-nav">
            <button 
              type="button"
              className={`dossier-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FileText size={15} /> All Particulars & Overview
            </button>
            <button 
              type="button"
              className={`dossier-tab-btn ${activeTab === 'particulars' ? 'active' : ''}`}
              onClick={() => setActiveTab('particulars')}
            >
              <Building2 size={15} /> Official Profile & Service
            </button>
            <button 
              type="button"
              className={`dossier-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              <Layers size={15} /> Verified Competencies
              <span className="dossier-tab-count">{employeeSkills.length}</span>
            </button>
            <button 
              type="button"
              className={`dossier-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={15} /> Assessment History
              <span className="dossier-tab-count">{historyList.length || (latestAssessment ? 1 : 0)}</span>
            </button>
            <button 
              type="button"
              className={`dossier-tab-btn ${activeTab === 'training' ? 'active' : ''}`}
              onClick={() => setActiveTab('training')}
            >
              <GraduationCap size={15} /> Learning & Training Record
            </button>
            <button 
              type="button"
              className={`dossier-tab-btn ${activeTab === 'honors' ? 'active' : ''}`}
              onClick={() => setActiveTab('honors')}
            >
              <Award size={15} /> Achievements & Badges
            </button>
          </div>

          {/* SECTION 1 & 2: OFFICIAL PROFILE & SERVICE DETAILS */}
          {(activeTab === 'overview' || activeTab === 'particulars') && (
            <div className="dossier-card">
              <div className="dossier-card-header">
                <h2 className="dossier-card-title">
                  <Building2 size={20} color="#0b1f3a" />
                  Official Service Particulars & Placement Record
                </h2>
                <span className="dossier-stamp">
                  <CheckCircle2 size={13} /> Official Record
                </span>
              </div>

              <div className="dossier-particulars-grid">
                <div className="dossier-particular-item">
                  <span className="dossier-particular-label">Full Officer Name</span>
                  <span className="dossier-particular-val">{profile.name || '—'}</span>
                </div>

                <div className="dossier-particular-item">
                  <span className="dossier-particular-label">Government Officer ID (OID)</span>
                  <span className="dossier-particular-val">
                    <code>{profile.employee_id || '921007'}</code>
                  </span>
                </div>

                <div className="dossier-particular-item">
                  <span className="dossier-particular-label">Designation & Cadre</span>
                  <span className="dossier-particular-val">{designationName}</span>
                </div>

                <div className="dossier-particular-item">
                  <span className="dossier-particular-label">Ministry / Department</span>
                  <span className="dossier-particular-val">Ministry of Statistics & Programme Implementation</span>
                </div>

                <div className="dossier-particular-item">
                  <span className="dossier-particular-label">Division / Office</span>
                  <span className="dossier-particular-val">{profile.department || 'National Statistical Office'}</span>
                </div>

                <div className="dossier-particular-item">
                  <span className="dossier-particular-label">Total Statistical Service</span>
                  <span className="dossier-particular-val">
                    {profile.experience_years != null ? `${profile.experience_years} Years Active Service` : '—'}
                  </span>
                </div>

                <div className="dossier-particular-item">
                  <span className="dossier-particular-label">Official Registered Email</span>
                  <span className="dossier-particular-val">{user?.email || '—'}</span>
                </div>

                <div className="dossier-particular-item">
                  <span className="dossier-particular-label">Cadre Batch / Classification</span>
                  <span className="dossier-particular-val">ISS Regular Officer · MoSPI Central Directory</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: VERIFIED SKILLS & COMPETENCIES */}
          {(activeTab === 'overview' || activeTab === 'skills') && (
            <div className="dossier-card">
              <div className="dossier-card-header">
                <h2 className="dossier-card-title">
                  <Layers size={20} color="#0b1f3a" />
                  Verified Competencies & Statistical Domain Portfolio
                </h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="dossier-stamp">
                    {employeeSkills.length} Verified
                  </span>
                  <button 
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={startEditing}
                  >
                    + Manage Skills
                  </button>
                </div>
              </div>

              {employeeSkillsLoading ? (
                <p className="loading-text">{t('Loading verified skills...')}</p>
              ) : employeeSkills.length === 0 ? (
                <div className="empty-assessment-notice">
                  <p>{t('No skills recorded yet for your profile.')}</p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={startEditing}
                    style={{ marginTop: '10px' }}
                  >
                    + Map Your Current Skills
                  </button>
                </div>
              ) : (
                <div className="dossier-skills-group-container">
                  {Object.entries(categorizedSkills).map(([category, catSkills]) => (
                    <div key={category} className="dossier-skill-category-block">
                      <div className="dossier-skill-cat-header">
                        <span>{category}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {catSkills.length} {catSkills.length === 1 ? 'skill' : 'skills'}
                        </span>
                      </div>
                      <div className="dossier-skill-chips-row">
                        {catSkills.map((s) => (
                          <div key={s.id} className="dossier-skill-chip-v2" title={s.description || s.name}>
                            <span className="dossier-skill-chip-check">✓</span>
                            <span className="dossier-skill-chip-name">{s.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: ASSESSMENT HISTORY & EVALUATION AUDIT */}
          {(activeTab === 'overview' || activeTab === 'history') && (
            <div className="dossier-card">
              <div className="dossier-card-header">
                <h2 className="dossier-card-title">
                  <History size={20} color="#0b1f3a" />
                  AI Competency Assessment & Evaluation History
                </h2>
                <Link to="/assessment" className="btn btn-primary btn-sm">
                  + Launch New Assessment
                </Link>
              </div>

              {assessmentLoading ? (
                <p className="loading-text">{t('Loading assessment records...')}</p>
              ) : !latestAssessment ? (
                <div className="empty-assessment-notice">
                  <p>{t('No evaluation records logged yet.')}</p>
                  <Link to="/assessment" className="btn btn-primary btn-sm" style={{ marginTop: '10px' }}>
                    Take Official AI Competency Assessment
                  </Link>
                </div>
              ) : (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '20px', 
                    background: '#f8fafc', 
                    padding: '16px 20px', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    marginBottom: '20px', 
                    flexWrap: 'wrap', 
                    alignItems: 'center', 
                    justifyContent: 'space-between' 
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                        Latest Official Score
                      </span>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#138808' }}>
                        {Math.round(latestAssessment.overallScore)}%
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                        Accuracy Benchmark
                      </span>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        {latestAssessment.correctAnswers} / {latestAssessment.totalQuestions} Questions Correct
                      </div>
                    </div>
                    <Link
                      to={`/assessment/result/${latestAssessment.assessmentId}`}
                      className="btn btn-outline btn-sm"
                    >
                      View Detailed Audit ➔
                    </Link>
                  </div>

                  {historyList && historyList.length > 0 && (
                    <div className="comparison-table-wrapper">
                      <table className="dossier-audit-table">
                        <thead>
                          <tr>
                            <th>Evaluation Date</th>
                            <th>Assessment Type</th>
                            <th>Questions Correct</th>
                            <th>Competency Score</th>
                            <th>Audit Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyList.map((item) => (
                            <tr key={item.assessmentId}>
                              <td>{new Date(item.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                              <td>
                                <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                                  {item.assessment_type || 'Official Baseline'}
                                </span>
                              </td>
                              <td>{item.correctAnswers} / {item.totalQuestions}</td>
                              <td>
                                <strong style={{ color: '#138808' }}>{Math.round(item.scorePercentage)}%</strong>
                              </td>
                              <td>
                                <span className="tag tag-success">Verified</span>
                              </td>
                              <td>
                                <Link
                                  to={`/assessment/result/${item.assessmentId}`}
                                  className="link-sm"
                                >
                                  View Audit
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: LEARNING / TRAINING RECORD (iGOT Karmayogi & NSSTA) */}
          {(activeTab === 'overview' || activeTab === 'training') && (
            <div className="dossier-card">
              <div className="dossier-card-header">
                <h2 className="dossier-card-title">
                  <GraduationCap size={20} color="#0b1f3a" />
                  Official Learning & Training Records (iGOT Karmayogi / NSSTA)
                </h2>
                <Link to="/igot-courses" className="btn btn-outline btn-sm">
                  View Full iGOT Catalog ➔
                </Link>
              </div>

              {trainingLoading ? (
                <p className="loading-text">{t('Loading training catalog...')}</p>
              ) : (
                <div className="dossier-courses-grid">
                  {trainingCourses.map((c) => (
                    <div key={c.id} className="dossier-course-item">
                      <div className="dossier-course-top">
                        <span className="dossier-course-platform">
                          🏛️ {c.platform}
                        </span>
                        <h4 className="dossier-course-title">{c.title}</h4>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Target Skill: <strong>{c.skillName}</strong>
                        </span>
                      </div>
                      <div className="dossier-course-meta">
                        <span>Provider: <strong>{c.provider}</strong></span>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Launch <ExternalLink size={12} style={{ display: 'inline', marginLeft: '3px' }} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: ACHIEVEMENTS & OFFICIAL COMMENDATIONS */}
          {(activeTab === 'overview' || activeTab === 'honors') && (
            <div className="dossier-card">
              <div className="dossier-card-header">
                <h2 className="dossier-card-title">
                  <Award size={20} color="#0b1f3a" />
                  Official Competency Honors & Achievement Badges
                </h2>
                <span className="dossier-stamp">
                  MoSPI Skill Intelligence Commendations
                </span>
              </div>

              <div className="dossier-honors-grid">
                {([...(workflowStatus?.achievements || [
                  { id: 'first_assessment', title: 'First Step', icon: '🎯', description: 'Completed official AI competency assessment', earned: Boolean(latestAssessment) },
                  { id: 'high_scorer', title: 'Merit Holder', icon: '🌟', description: 'Achieved 80% or higher overall score', earned: Boolean(latestAssessment?.overallScore >= 80) },
                  { id: 'perfectionist', title: 'Flawless Section', icon: '🏆', description: 'Scored 100% in at least one statistical domain', earned: false },
                  { id: 'gap_closer', title: 'Active Learner', icon: '📚', description: 'Identified competency benchmarks and enrolled in learning', earned: false },
                  { id: 'reassessment_ready', title: 'Resilient Analyst', icon: '🔄', description: 'Participated in a competency reassessment cycle', earned: Boolean(latestAssessment?.assessment_type === 'reassessment') },
                  { id: 'cycle_master', title: 'Cycle Master', icon: '👑', description: 'Successfully completed the 4-stage MoSPI competency cycle', earned: Boolean(workflowStatus?.workflow?.isCycleFullyCompleted) }
                ]), ...arenaBadges]).map((ach) => (
                  <div key={ach.id} className={`dossier-honor-card ${ach.earned ? 'earned' : ''}`}>
                    <div className="dossier-honor-icon" aria-hidden="true">
                      {ach.icon}
                    </div>
                    <div className="dossier-honor-body">
                      <h4 className="dossier-honor-title">{ach.title}</h4>
                      <p className="dossier-honor-desc">{ach.description}</p>
                      <span className={`dossier-honor-status ${ach.earned ? 'earned' : 'locked'}`}>
                        {ach.earned ? '✓ Awarded' : '○ In Progress'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* 4. EDIT / CREATE PROFILE & SKILLS FORM */
        <div className="card edit-card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} noValidate>
            <div className="edit-form-header" style={{ marginBottom: '24px' }}>
              <h2>{profile ? t('Edit Official Particulars & Competencies') : t('Set Up Employee Profile & Skills')}</h2>
              <p className="muted">{t('Update your verified service details and mapped competencies.')}</p>
            </div>

            {/* Sub-section 1: Official Particulars */}
            <div className="form-section">
              <h3 className="form-section-title">{t('1. Official Service Particulars')}</h3>
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
                    className="auth-input-field"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="employee_id">{t('Employee ID / OID *')}</label>
                  <input
                    id="employee_id"
                    name="employee_id"
                    type="text"
                    value={form.employee_id}
                    onChange={handleChange}
                    disabled={saving}
                    className="auth-input-field"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="designation_id">{t('Official Designation *')}</label>
                  <select
                    id="designation_id"
                    name="designation_id"
                    value={form.designation_id}
                    onChange={handleChange}
                    disabled={saving || designationsLoading}
                    className="auth-input-field"
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
                    className="auth-input-field"
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
                  <label htmlFor="experience_years">{t('Total Statistical Experience (Years) *')}</label>
                  <input
                    id="experience_years"
                    name="experience_years"
                    type="number"
                    min="0"
                    max="60"
                    value={form.experience_years}
                    onChange={handleChange}
                    disabled={saving}
                    className="auth-input-field"
                  />
                </div>
              </div>
            </div>

            {/* Sub-section 2: Competency Mapping */}
            <div className="form-section">
              <h3 className="form-section-title">{t('2. Verified Competency Portfolio')}</h3>
              <p className="form-section-desc">
                {t('Select or deselect competencies to update your official portfolio.')}
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
