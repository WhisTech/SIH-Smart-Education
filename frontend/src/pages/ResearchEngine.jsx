import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function ResearchEngine() {
  const { t } = useTranslation()
  const [employees, setEmployees] = useState([])
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Recommendation & Detail State
  const [recData, setRecData] = useState(null)
  const [recLoading, setRecLoading] = useState(false)
  const [analysisTab, setAnalysisTab] = useState('skill-gap')
  const [weightSuccess, setWeightSuccess] = useState('')

  // Configurable Signal Weights
  const [weights, setWeights] = useState({
    w_gap: 0.40,
    w_kg: 0.25,
    w_seq: 0.20,
    w_cf: 0.15
  })

  // Metrics State
  const [metricsData, setMetricsData] = useState(null)
  const [kgData, setKgData] = useState(null)

  // 1. Fetch Employees List on Mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${BACKEND_URL}/api/research/employees`)
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        
        setEmployees(data.employees || [])
        if (data.employees && data.employees.length > 0) {
          setSelectedEmpId(data.employees[0].id)
        }
      } catch (err) {
        setError(err.message || t('Failed to load research dataset.'))
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
  }, [])

  // 2. Fetch Recommendations with target weights
  const fetchRecommendations = useCallback(async (empId, customWeights) => {
    if (!empId) return
    const activeWeights = customWeights || weights
    try {
      setRecLoading(true)
      const res = await fetch(`${BACKEND_URL}/api/research/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, weights: activeWeights })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setRecData(data)
    } catch (err) {
      console.error('Error fetching research recommendations:', err)
    } finally {
      setRecLoading(false)
    }
  }, [weights])

  useEffect(() => {
    if (selectedEmpId) {
      fetchRecommendations(selectedEmpId, weights)
      setKgData(null)
    }
  }, [selectedEmpId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Fetch Metrics & KG data when switching tabs
  const handleTabChange = async (tab) => {
    setAnalysisTab(tab)
    if (tab === 'metrics' && !metricsData) {
      try {
        const mRes = await fetch(`${BACKEND_URL}/api/research/metrics`)
        const mData = await mRes.json()
        if (mData.success) setMetricsData(mData)
      } catch (err) {
        console.error('Error loading metrics:', err)
      }
    }
    if (tab === 'kg' && selectedEmpId) {
      try {
        const kRes = await fetch(`${BACKEND_URL}/api/research/knowledge-graph?employeeId=${selectedEmpId}`)
        const kData = await kRes.json()
        if (kData.success) setKgData(kData)
      } catch (err) {
        console.error('Error loading KG:', err)
      }
    }
  }

  const handleWeightChange = (key, val) => {
    const num = parseFloat(val) || 0
    setWeights(prev => ({ ...prev, [key]: num }))
  }

  const handleApplyWeights = async () => {
    if (selectedEmpId) {
      setWeightSuccess('')
      await fetchRecommendations(selectedEmpId, weights)
      setWeightSuccess(t('✓ Courses successfully re-ranked with custom signal weights!'))
      setTimeout(() => setWeightSuccess(''), 4000)
    }
  }

  if (loading) {
    return (
      <div className="research-page" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>{t('Loading Research Recommendation Engine...')}</h2>
        <p>{t('Initializing 50 Employee profiles and TransE Knowledge Graph models.')}</p>
      </div>
    )
  }

  return (
    <div className="research-page" style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 1. COMPACT HEADER */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
            🔬 {t('Personalized Recommendation Engine')}
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {t('Research Prototype: Multi-signal fusion (Knowledge Graph, Sequence Mining, Collaborative Filtering)')}
          </p>
        </div>
        
        {/* 2. EMPLOYEE SELECTION (Horizontal & Compact) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <label style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', margin: 0 }}>
            {t('Target Employee:')}
          </label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #94a3b8', fontWeight: '600', fontSize: '13px', minWidth: '250px' }}
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employee_id.replace('DEMO-', 'EMP-')} - {emp.name} ({emp.designation_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '24px' }}>{error}</div>}

      {recData && recData.employee && (
        <>
          {/* 3. EMPLOYEE OVERVIEW (2-Column Grid without heavy borders) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            
            {/* Left: Employee Profile */}
            <div style={{ background: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                {t('Employee Profile')}
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: '#eff6ff', color: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800' }}>
                  {recData.employee.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>{recData.employee.name}</h4>
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>{t('ID:')} <strong>{recData.employee.employee_id.replace('DEMO-', 'EMP-')}</strong></div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                    <span style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{recData.employee.designation_name}</span>
                    <span style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{recData.employee.department}</span>
                    <span style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{recData.employee.experience_years}{t('y Exp')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Configurable Signal Weights */}
            <div style={{ background: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  {t('Signal Weights')}
                </h3>
                <button onClick={handleApplyWeights} disabled={recLoading} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', opacity: recLoading ? 0.7 : 1 }}>
                  {recLoading ? t('Re-ranking...') : t('Apply & Re-rank')}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', marginTop: 0 }}>
                {t('Adjust the importance of each recommendation signal to re-rank courses.')}
              </p>
              
              {weightSuccess && (
                <div style={{ padding: '8px 12px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
                  {weightSuccess}
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: t('Skill Gap'), key: 'w_gap', val: weights.w_gap },
                  { label: t('TransE Knowledge Graph'), key: 'w_kg', val: weights.w_kg },
                  { label: t('Sequence Mining'), key: 'w_seq', val: weights.w_seq },
                  { label: t('Collaborative Filtering'), key: 'w_cf', val: weights.w_cf }
                ].map(w => (
                  <div key={w.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#1e293b' }}>
                      <span>{w.label}</span>
                      <span>{w.val}</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={w.val} onChange={(e) => handleWeightChange(w.key, e.target.value)} style={{ width: '100%', accentColor: '#3b82f6' }} />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 4. ANALYSIS NAVIGATION (Clean horizontal tabs) */}
          <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
            {[
              { id: 'skill-gap', icon: '📊', label: t('Skill Gap') },
              { id: 'kg', icon: '🌐', label: t('Knowledge Graph') },
              { id: 'seq', icon: '🔗', label: t('Learning Sequence') },
              { id: 'peers', icon: '👥', label: t('Similar Employees') },
              { id: 'fusion', icon: '🎯', label: t('Recommendation Fusion') }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: analysisTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: analysisTab === tab.id ? '800' : '600',
                  color: analysisTab === tab.id ? '#0f172a' : '#64748b',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ marginRight: '6px' }}>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* 5. ANALYSIS CONTENT */}
          <div style={{ minHeight: '400px' }}>
            
            {/* --- CARD 1: SKILL GAP ANALYSIS (Tabular Rows) --- */}
            {analysisTab === 'skill-gap' && (
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{t('Skill Gap Analysis')}</h3>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: '700px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 20px', background: '#f1f5f9', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                      <div>{t('Skill Domain')}</div>
                      <div>{t('Current')}</div>
                      <div>{t('Required')}</div>
                      <div>{t('Gap')}</div>
                      <div>{t('Status')}</div>
                    </div>
                    {recData.skillScores.map((score, idx) => {
                      const gap = Math.max(0, score.required_score - score.assessed_score);
                      const isMet = gap === 0;
                      return (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', fontSize: '14px', color: '#1e293b' }}>
                          <div style={{ fontWeight: '700' }}>{score.skill_name}</div>
                          <div>{score.assessed_score}%</div>
                          <div>{score.required_score}%</div>
                          <div style={{ color: isMet ? '#94a3b8' : '#ef4444', fontWeight: isMet ? '400' : '700' }}>{isMet ? '-' : `${gap}%`}</div>
                          <div>
                            <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', background: isMet ? '#dcfce7' : '#fee2e2', color: isMet ? '#15803d' : '#b91c1c' }}>
                              {isMet ? t('✓ Met') : t('Needs Improvement')}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* --- CARD 2: KNOWLEDGE GRAPH --- */}
            {analysisTab === 'kg' && (
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{t('Knowledge Graph (Focused)')}</h3>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: '700', background: '#ffffff', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <span style={{ color: '#1e293b' }}>👤 {t('Designation')}</span>
                    <span style={{ color: '#1d4ed8' }}>🔵 {t('Skill')}</span>
                    <span style={{ color: '#b91c1c' }}>🔴 {t('Gap')}</span>
                    <span style={{ color: '#15803d' }}>🟢 {t('Met')}</span>
                    <span style={{ color: '#a21caf' }}>🎯 {t('Course')}</span>
                  </div>
                </div>

                <div style={{ padding: '40px 24px', background: '#ffffff', overflowX: 'auto', minHeight: '500px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'min-content' }}>
                    {/* Root: Designation Node */}
                    <div style={{ padding: '12px 32px', background: '#1e293b', color: 'white', borderRadius: '8px', fontWeight: '800', fontSize: '16px', textAlign: 'center', minWidth: '250px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                      👤 {recData.employee.designation_name}
                    </div>
                    {/* Vertical Line */}
                    <div style={{ width: '2px', height: '30px', background: '#cbd5e1' }}></div>
                    {/* Horizontal Bar for Skills */}
                    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <div style={{ position: 'absolute', top: 0, height: '2px', background: '#cbd5e1', left: '10%', right: '10%' }}></div>
                      
                      {/* Skills Row */}
                      <div style={{ display: 'flex', gap: '24px', paddingTop: '0px', width: '100%', justifyContent: 'space-evenly' }}>
                        {recData.skillScores.map((skill, sIdx) => {
                          const gap = Math.max(0, skill.required_score - skill.assessed_score);
                          const isMet = gap === 0;
                          const coursesForSkill = recData.recommendations.filter(r => r.skillName === skill.skill_name || r.skillId === skill.skill_id || (r.reasons && r.reasons.some(rs => rs.includes(skill.skill_name))));

                          return (
                            <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '200px', position: 'relative' }}>
                              <div style={{ width: '2px', height: '20px', background: '#cbd5e1' }}></div>
                              <div style={{ padding: '12px', background: isMet ? '#f0fdf4' : '#eff6ff', border: `2px solid ${isMet ? '#22c55e' : '#3b82f6'}`, borderRadius: '8px', width: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: '14px', fontWeight: '800', color: isMet ? '#166534' : '#1e40af', marginBottom: '12px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                  🔵 <span>{skill.skill_name}</span>
                                </div>
                                <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', fontSize: '12px', border: `1px solid ${isMet ? '#bbf7d0' : '#bfdbfe'}` }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ color: '#64748b' }}>{t('Current:')}</span> <strong>{skill.assessed_score}%</strong>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ color: '#64748b' }}>{t('Required:')}</span> <strong>{skill.required_score}%</strong>
                                  </div>
                                  {!isMet ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', color: '#dc2626', fontWeight: '800' }}>
                                      <span>🔴 {t('Gap:')}</span> <span>{gap}%</span>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', color: '#16a34a', fontWeight: '800' }}>
                                      <span>🟢 {t('Status:')}</span> <span>{t('Met')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {coursesForSkill.length > 0 && (
                                <>
                                  <div style={{ width: '2px', height: '20px', background: '#cbd5e1' }}></div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                    {coursesForSkill.slice(0, 3).map((course, cIdx) => (
                                      <div key={cIdx} style={{ padding: '10px 12px', background: '#fdf4ff', border: '1px solid #d946ef', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#86198f', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span>🎯 {course.courseTitle}</span>
                                        <span style={{ fontSize: '10px', color: '#c026d3', textTransform: 'uppercase' }}>{t('Fusion:')} {course.finalScore}</span>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- CARD 3: LEARNING SEQUENCE (Clean Timeline) --- */}
            {analysisTab === 'seq' && (
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{t('Learning Sequence Flow')}</h3>
                </div>
                <div style={{ padding: '32px 24px', overflowX: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {recData.recommendations.length > 0 ? (
                    [...recData.recommendations]
                      .sort((a,b) => b.signals.s_seq - a.signals.s_seq)
                      .slice(0, 5)
                      .map((rec, idx, arr) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 'max-content' }}>
                          <div style={{ padding: '16px', background: '#ffffff', borderLeft: '4px solid #3b82f6', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderRadius: '4px', minWidth: '200px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>
                              {idx === 0 ? t('Start Here') : `${t('Step')} ${idx + 1}`}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{rec.courseTitle}</div>
                          </div>
                          {idx < arr.length - 1 && (
                            <div style={{ color: '#cbd5e1', fontSize: '20px', fontWeight: '900' }}>▶</div>
                          )}
                        </div>
                    ))
                  ) : (
                    <div style={{ color: '#64748b', fontStyle: 'italic' }}>{t('No learning sequence available.')}</div>
                  )}
                </div>
              </div>
            )}

            {/* --- CARD 4: SIMILAR EMPLOYEES (Compact Grid) --- */}
            {analysisTab === 'peers' && (
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{t('Peer Similarity Group')}</h3>
                </div>
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                  {recData.similarPeers.length > 0 ? (
                     recData.similarPeers.map((peer, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                        <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👤</div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{peer.employeeId.replace('DEMO-', 'EMP-')}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{t('Similarity:')} <strong style={{ color: '#3b82f6' }}>{Math.round(peer.similarityScore * 100)}%</strong></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#64748b' }}>{t('No similar peers found with overlapping profiles.')}</div>
                  )}
                </div>
              </div>
            )}

            {/* --- CARD 5: RECOMMENDATION FUSION (Clean Breakdown) --- */}
            {analysisTab === 'fusion' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 20px 0', color: '#0f172a' }}>{t('Final Recommendations & Fusion Breakdown')}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {recData.recommendations.map((item, idx) => (
                    <div key={idx} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      {/* Card Header */}
                      <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                          <span style={{ color: '#64748b', marginRight: '8px' }}>#{idx+1}</span> {item.courseTitle}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{t('Final Score')}</span>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: '#2563eb', background: '#eff6ff', padding: '4px 12px', borderRadius: '20px' }}>
                            {item.finalScore}
                          </span>
                        </div>
                      </div>

                      {/* Card Body (2 columns) */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', padding: '24px' }}>
                        
                        {/* Signals */}
                        <div>
                          <h5 style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('Signal Breakdown & Weighted Contributions')}</h5>
                          
                          {[
                            { label: t('Skill Gap'), raw: item.signals.s_gap, contrib: item.weightedContributions?.w_gap ?? (item.signals.s_gap * 0.4), color: '#0f172a' },
                            { label: t('TransE Knowledge Graph'), raw: item.signals.s_kg, contrib: item.weightedContributions?.w_kg ?? (item.signals.s_kg * 0.25), color: '#2563eb' },
                            { label: t('Sequence Mining'), raw: item.signals.s_seq, contrib: item.weightedContributions?.w_seq ?? (item.signals.s_seq * 0.20), color: '#16a34a' },
                            { label: t('Collaborative Filtering'), raw: item.signals.s_cf, contrib: item.weightedContributions?.w_cf ?? (item.signals.s_cf * 0.15), color: '#9333ea' }
                          ].map((sig, i) => (
                            <div key={i} style={{ marginBottom: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                                <span>{sig.label}</span>
                                <span style={{ color: '#0f172a' }}>
                                  {t('Signal:')} <strong>{(Math.round(sig.raw * 100) / 100).toFixed(2)}</strong> · {t('Contrib:')} <strong style={{ color: sig.color }}>+{(Math.round(sig.contrib * 100) / 100).toFixed(2)}</strong>
                                </span>
                              </div>
                              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, sig.raw * 100)}%`, background: sig.color, borderRadius: '3px' }}></div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Reasons */}
                        <div>
                          <h5 style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{t('Why Recommended?')}</h5>
                          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                            {item.reasons.map((r, rIdx) => (
                              <li key={rIdx} style={{ marginBottom: '8px' }}>{r}</li>
                            ))}
                          </ul>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  )
}
