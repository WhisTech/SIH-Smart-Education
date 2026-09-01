import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchDesignations } from '../lib/referenceData'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function IgotDashboard() {
  const { profile } = useAuth()

  const [designations, setDesignations] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
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
        // Fetch all courses with their skill names
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
          skills: [c.skills?.name || 'Skill']
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
  }, [])

  // Resolve employee's designation name
  const employeeDesignationName = useMemo(() => {
    if (!profile?.designation_id) return 'Programmer'
    const match = designations.find((d) => d.id === profile.designation_id)
    return match ? match.name : profile.designation_id
  }, [profile, designations])

  // Filter catalog courses
  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return catalogCourses.filter((course) => {
      if (filterDesignationOnly) {
        // If filter is active, only show courses that map to skills required by the user's designation
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
      {/* Header Banner */}
      <div className="page-header">
        <div>
          <h1 className="page-title">iGOT Karmayogi Learning Portal</h1>
          <p className="page-subtitle">
            Personalized course recommendations &amp; designation-aligned capacity building
          </p>
        </div>
        <div className="header-actions">
          <Link to="/assessment" className="btn btn-outline btn-sm">
            Take AI Assessment
          </Link>
        </div>
      </div>

      {/* Designation Banner */}
      <div className="card desig-banner-card">
        <div className="banner-desig-info">
          <span className="banner-label">Active Official Designation</span>
          <h2 className="banner-desig-title">
            <span className="desig-icon">💼</span> {employeeDesignationName}
          </h2>
          <p className="banner-desig-desc">
            Showing continuous learning modules on <strong>iGOT Karmayogi</strong> curated for{' '}
            <strong>{employeeDesignationName}</strong> professionals in official statistics.
          </p>
        </div>

        <div className="banner-filter-toggle">
          <label className="checkbox-label filter-checkbox">
            <input
              type="checkbox"
              checked={filterDesignationOnly}
              onChange={(e) => setFilterDesignationOnly(e.target.checked)}
            />
            Show courses for my designation only ({employeeDesignationName})
          </label>
        </div>
      </div>

      {/* FEATURE: PERSONALIZED RECOMMENDATIONS BASED ON SKILL-GAP ANALYSIS */}
      <div className="card personalized-recs-card">
        <div className="section-title-sm">
          <h2 className="card-section-title">⚡ AI-Recommended Courses for Skill Gaps</h2>
          <span className="tag tag-ai">Assessed Skill-Gap Analysis</span>
        </div>

        {recsLoading ? (
          <p className="loading-text">Loading personalized recommendations...</p>
        ) : recommendations.length === 0 ? (
          <div className="empty-recs-notice">
            <p>No skill-gap recommendations generated yet.</p>
            <p className="muted-sm">
              Complete an AI Competency Assessment to compare your proficiency against designation requirements and receive tailored iGOT course recommendations.
            </p>
            <Link to="/assessment" className="btn btn-primary btn-sm">
              Start Assessment to Generate Recommendations
            </Link>
          </div>
        ) : (
          <div className="recs-content-wrapper">
            {/* Skill Gaps Priority Summary */}
            <div className="gaps-summary-bar">
              <span className="summary-title">Assessed Skill Gaps:</span>
              <span className="gap-badge badge-high">⚡ {gapSummary.high} High Priority</span>
              <span className="gap-badge badge-medium">⚠️ {gapSummary.medium} Medium Priority</span>
              <span className="gap-badge badge-low">✓ {gapSummary.low} Low Priority</span>
            </div>

            {/* Recommended Courses Grid */}
            <div className="recommended-courses-grid">
              {recommendations.map((rec) => (
                <div key={rec.id} className="card rec-course-card">
                  <div className="rec-card-header">
                    <span className={`rec-priority-tag tag-${rec.priority.toLowerCase()}`}>
                      {rec.priority} Priority Gap
                    </span>
                    <span className="rec-skill-tag">{rec.skillName}</span>
                  </div>

                  <h3 className="rec-course-title">{rec.title}</h3>
                  <div className="rec-course-provider">🏫 {rec.provider}</div>

                  <p className="rec-reason-text">💡 {rec.reason}</p>

                  <div className="rec-card-footer">
                    <a
                      href={rec.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm btn-block"
                    >
                      View Course on iGOT →
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Reassessment Banner */}
            <div style={{ marginTop: '25px', padding: '18px 24px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
               <div>
                  <strong style={{ color: '#1e3a8a', fontSize: '1rem' }}>🎓 Completed your recommended modules?</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#475569', fontSize: '0.9rem' }}>
                     Take an adaptive reassessment to validate your updated competency levels and close your official skill gaps.
                  </p>
               </div>
               <Link to="/reassessment" className="btn btn-primary btn-sm" style={{ fontWeight: '600', padding: '10px 18px' }}>
                  🎯 Start Reassessment &rarr;
               </Link>
            </div>
          </div>
        )}
      </div>

      {/* Catalog Search & Grid */}
      <div className="card search-courses-card">
        <div className="search-bar-inner">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="course-search-input"
            placeholder="Search courses by title, skill, provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
            >
              ✕
            </button>
          )}
        </div>
        <div className="search-results-meta">
          Showing <strong>{filteredCourses.length}</strong> of {catalogCourses.length} iGOT Karmayogi catalog courses
        </div>
      </div>

      {/* Course Cards Grid */}
      {coursesLoading ? (
        <div className="empty-state">
           <p>Loading course catalog...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="empty-state">
          <span className="brand-emblem large" aria-hidden="true">⚠️</span>
          <h2>No Matching Courses Found</h2>
          <p>
            No iGOT courses matched your filters.
          </p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setSearchQuery('')
              setFilterDesignationOnly(false)
            }}
          >
            Reset Search &amp; Filters
          </button>
        </div>
      ) : (
        <div className="igot-courses-grid">
          {filteredCourses.map((course) => (
            <div key={course.id} className="card course-card">
              <div className="course-card-header">
                <span className="platform-tag">
                  <span className="platform-icon" aria-hidden="true">🏛️</span> {course.platform}
                </span>
                <span className="level-tag">{course.level}</span>
              </div>

              <h3 className="course-title">{course.title}</h3>

              <div className="course-provider">
                <span className="provider-icon" aria-hidden="true">🏫</span> {course.provider}
              </div>

              <p className="course-desc">{course.description}</p>

              <div className="course-meta-tags">
                <div className="meta-tag-item">
                  <span className="meta-lbl">Duration:</span>
                  <span className="meta-val">{course.duration}</span>
                </div>

                <div className="meta-tag-item">
                  <span className="meta-lbl">Relevant Skills:</span>
                  <div className="skill-chips-row">
                    {course.skills.map((s, idx) => (
                      <span key={idx} className="course-skill-chip">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="course-card-footer">
                <a
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-block"
                  title={`Open ${course.title} on iGOT Karmayogi platform`}
                >
                  View Course on iGOT →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
