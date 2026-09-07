import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchDesignations } from '../lib/referenceData'
import { useTranslation } from 'react-i18next'
import FloatingXp from '../components/FloatingXp'
import { 
  BookOpen, 
  ExternalLink, 
  Filter, 
  GraduationCap, 
  RefreshCw, 
  Search, 
  Sparkles, 
  Target 
} from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function IgotDashboard() {
  const { user, profile } = useAuth()
  const { t } = useTranslation()

  const [designations, setDesignations] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeXpCourseId, setActiveXpCourseId] = useState(null)

  const [filterDesignationOnly, setFilterDesignationOnly] = useState(false)

  // Skill Gaps & Personalized Recommendations State
  const [recommendations, setRecommendations] = useState([])
  const [gapSummary, setGapSummary] = useState({ high: 0, medium: 0, low: 0 })
  const [recsLoading, setRecsLoading] = useState(true)

  // Database Courses State
  const [catalogCourses, setCatalogCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [requiredSkillIds, setRequiredSkillIds] = useState([])

  // Load designation reference data
  useEffect(() => {
    let isMounted = true
    fetchDesignations().then((res) => {
      if (isMounted) {
        setDesignations(res.data || [])
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Load Courses from Database
  useEffect(() => {
    let isMounted = true
    const loadCourses = async () => {
      setCoursesLoading(true)
      try {
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`*, skills ( name )`)

        if (coursesError) throw coursesError

        const mappedCourses = (coursesData || []).map(c => ({
          id: c.id,
          title: c.title,
          provider: c.provider,
          platform: c.source_type || 'iGOT Karmayogi',
          duration: 'Self-Paced',
          level: (c.level || 'Intermediate').charAt(0).toUpperCase() + (c.level || 'intermediate').slice(1),
          description: c.description || '',
          url: c.external_url || 'https://igotkarmayogi.gov.in/',
          skill_id: c.skill_id,
          skills: [c.skills?.name || 'Statistical Competency']
        }))

        if (isMounted) setCatalogCourses(mappedCourses)

        // Fetch required skills for current user's designation
        if (profile?.designation_id) {
          const { data: reqSkills } = await supabase
            .from('designation_skills')
            .select('skill_id')
            .eq('designation_id', profile.designation_id)
            
          if (isMounted && reqSkills) {
            setRequiredSkillIds(reqSkills.map(r => r.skill_id))
          }
        }
      } catch (err) {
        console.error('Error loading courses:', err)
      } finally {
        if (isMounted) setCoursesLoading(false)
      }
    }

    loadCourses()
    return () => { isMounted = false }
  }, [profile?.designation_id])

  // Load Personalized Recommendations and Skill Gaps from backend
  useEffect(() => {
    let isMounted = true

    const loadPersonalizedRecs = async () => {
      setRecsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (token) {
          const [recRes, gapRes] = await Promise.all([
            fetch(`${BACKEND_URL}/api/recommendations/user`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`${BACKEND_URL}/api/skill-gap/latest`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ])

          const recData = await recRes.json()
          const gapData = await gapRes.json()

          if (isMounted) {
            if (recData.success) setRecommendations(recData.recommendations || [])
            if (gapData.success) {
              setGapSummary(gapData.summary || { high: 0, medium: 0, low: 0 })
            }
          }
        }
      } catch (err) {
        console.error('Error loading personalized recommendations:', err)
      } finally {
        if (isMounted) setRecsLoading(false)
      }
    }

    loadPersonalizedRecs()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  // Resolve employee's designation name
  const employeeDesignationName = useMemo(() => {
    if (!profile?.designation_id) return 'Official Statistical Cadre'
    const match = designations.find((d) => d.id === profile.designation_id)
    return match ? match.name : profile.designation_id
  }, [profile, designations])

  // Filter catalog courses
  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return catalogCourses.filter((course) => {
      if (filterDesignationOnly) {
        if (!requiredSkillIds.includes(course.skill_id)) {
          return false
        }
      }

      if (!query) return true

      const titleMatch = course.title.toLowerCase().includes(query)
      const providerMatch = course.provider.toLowerCase().includes(query)
      const skillMatch = course.skills.some((s) => s.toLowerCase().includes(query))

      return titleMatch || providerMatch || skillMatch
    })
  }, [searchQuery, filterDesignationOnly, catalogCourses, requiredSkillIds])

  return (
    <div className="igot-dashboard-page">
      {/* Page Hero Header */}
      <div className="page-hero-header">
        <div className="page-hero-content">
          <span className="page-hero-badge">{t('igot.karmayogi_badge')}</span>
          <h1 className="page-hero-title">{t('igot.title')}</h1>
          <p className="page-hero-subtitle">
            {t('igot.subtitle')}
          </p>
        </div>
        <div className="page-hero-actions">
          <Link to="/assessment" className="btn btn-outline btn-sm">
            {t('dashboard.start_assessment')}
          </Link>
          <Link to="/reassessment" className="btn btn-primary btn-sm">
            <RefreshCw size={15} /> {t('igot.reassessment_btn')}
          </Link>
        </div>
      </div>

      {/* Cadre Alignment Banner */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px', borderLeft: '4px solid #0284c7' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.4px' }}>
              {t('igot.target_cadre_role')}
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '2px 0 4px' }}>
              💼 {employeeDesignationName}
            </h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
              {t('igot.cadre_curated_desc')}
            </p>
          </div>

          <div>
            <label className="checkbox-label" style={{ cursor: 'pointer', background: '#f8fafc', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <input
                type="checkbox"
                checked={filterDesignationOnly}
                onChange={(e) => setFilterDesignationOnly(e.target.checked)}
              />
              {t('igot.filter_designation_only')}
            </label>
          </div>
        </div>
      </div>

      {/* Personalized Recommendations Section */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div className="card-header-clean">
          <div className="header-title-group">
            <span className="section-pill">{t('igot.curated_pathways')}</span>
            <h2 className="section-heading">⚡ {t('result.course_recs')}</h2>
          </div>
          <span className="tag tag-ai">{t('igot.assessed_gap_tag')}</span>
        </div>

        {recsLoading ? (
          <p className="loading-text">{t('system.loading')}</p>
        ) : recommendations.length === 0 ? (
          <div className="empty-assessment-notice">
            <p>{t('igot.no_recs_title')}</p>
            <p className="muted-sm">
              {t('igot.no_recs_desc')}
            </p>
            <Link to="/assessment" className="btn btn-primary btn-sm" style={{ marginTop: '10px' }}>
              {t('igot.start_assess_to_recs')}
            </Link>
          </div>
        ) : (
          <div>
            {/* Priority summary pill */}
            <div className="gaps-summary-mini-pill" style={{ marginBottom: '16px' }}>
              <span className="gap-tag high">⚡ {gapSummary.high} {t('igot.high_priority_gap')}</span>
              <span className="gap-tag medium">⚠️ {gapSummary.medium} {t('igot.medium_priority_gap')}</span>
              <span className="gap-tag low">✓ {gapSummary.low} {t('igot.low_priority_gap')}</span>
            </div>

            {/* Recommended Courses Grid */}
            <div className="courses-grid-3col">
              {recommendations.map((rec) => (
                <div key={rec.id} className="course-card-v2 animate-card" style={{ position: 'relative' }}>
                  <FloatingXp 
                    xp={100} 
                    trigger={activeXpCourseId === rec.id} 
                    onComplete={() => setActiveXpCourseId(null)} 
                  />

                  <div>
                    <div className="course-card-top">
                      <span className={`gap-priority-pill priority-${rec.priority?.toLowerCase() || 'medium'}`}>
                        {rec.priority === 'High' ? t('igot.high_priority_gap') : rec.priority === 'Low' ? t('igot.low_priority_gap') : t('igot.medium_priority_gap')}
                      </span>
                      <span className="course-xp-pill animated-pulse">+100 XP</span>
                    </div>

                    <h3 className="course-title-v2">{rec.title}</h3>
                    <div className="course-provider-v2">🏫 {rec.provider}</div>
                    <p className="course-desc-v2">💡 {rec.reason}</p>
                    
                    <div style={{ marginTop: '8px' }}>
                      <span className="course-skill-pill" title="Target Cadre Competency">
                        {t('igot.competency_prefix', { skill: rec.skillName })}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px' }}>
                    <a
                      href={rec.externalUrl || 'https://igotkarmayogi.gov.in/'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm btn-block"
                      onClick={() => setActiveXpCourseId(rec.id)}
                    >
                      {t('igot.open_on_igot')}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Catalog Search & Filter Bar */}
      <div className="courses-catalog-search-bar">
        <Search size={18} color="#64748b" />
        <input
          type="text"
          className="courses-search-input"
          placeholder={t('igot.search_catalog_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        <span style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
          <strong>{filteredCourses.length}</strong> {t('igot.modules_count')}
        </span>
      </div>

      {/* Catalog Courses Grid */}
      {coursesLoading ? (
        <div className="empty-assessment-notice">
           <p>{t('igot.loading_catalog')}</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="empty-assessment-notice">
          <span className="brand-emblem large" aria-hidden="true">⚠️</span>
          <h3>{t('igot.no_matching_title')}</h3>
          <p className="muted-sm">{t('igot.no_matching_desc')}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearchQuery('')
              setFilterDesignationOnly(false)
            }}
            style={{ marginTop: '10px' }}
          >
            {t('igot.reset_filters')}
          </button>
        </div>
      ) : (
        <div className="courses-grid-3col">
          {filteredCourses.map((course) => (
            <div key={course.id} className="course-card-v2 animate-card" style={{ position: 'relative' }}>
              <FloatingXp 
                xp={100} 
                trigger={activeXpCourseId === course.id} 
                onComplete={() => setActiveXpCourseId(null)} 
              />

              <div>
                <div className="course-card-top">
                  <span className="course-platform-badge">🏛️ {course.platform}</span>
                  <span className="course-level-badge">{course.level}</span>
                </div>

                <h3 className="course-title-v2">{course.title}</h3>
                <div className="course-provider-v2">🏫 {course.provider}</div>
                <p className="course-desc-v2">{course.description}</p>

                <div className="course-skills-chips">
                  {course.skills.map((s, idx) => (
                    <span key={idx} className="course-skill-pill">{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <a
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm btn-block"
                  onClick={() => setActiveXpCourseId(course.id)}
                >
                  {t('igot.view_on_igot')}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
