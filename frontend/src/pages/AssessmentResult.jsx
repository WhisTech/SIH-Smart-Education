import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoadingScreen from '../components/LoadingScreen'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function AssessmentResult() {
  const { assessmentId } = useParams()

  const [result, setResult] = useState(null)
  const [skillGaps, setSkillGaps] = useState([])
  const [comparison, setComparison] = useState(null)
  const [courses, setCourses] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        // 1. Fetch current assessment results
        const resResponse = await fetch(`${BACKEND_URL}/api/assessment/result/${assessmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const resData = await resResponse.json()
        if (!resData.success) throw new Error(resData.message)
        setResult(resData.result)

        // 2. Fetch skill gaps
        const gapResponse = await fetch(`${BACKEND_URL}/api/skill-gap/latest`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const gapData = await gapResponse.json()
        if (gapData.success) setSkillGaps(gapData.skillGaps || [])

        // 3. Fetch latest comparison
        const compResponse = await fetch(`${BACKEND_URL}/api/assessment/latest-comparison`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const compData = await compResponse.json()
        if (compData.success && compData.hasComparison) {
           // Ensure it's comparing against a DIFFERENT previous assessment, not itself
           if (compData.current.id === assessmentId && compData.previous.id !== assessmentId) {
               setComparison(compData)
           } else if (compData.previous.id === assessmentId) {
               // We might be viewing an old one, ignore
           }
        }

        // 4. Fetch recommended courses based on gaps
        const recResponse = await fetch(`${BACKEND_URL}/api/recommendations/user`, {
           headers: { Authorization: `Bearer ${token}` }
        })
        if (recResponse.ok && recResponse.headers.get('content-type')?.includes('application/json')) {
           const recData = await recResponse.json()
           if (recData.success) {
              setCourses(recData.recommendations || [])
           }
        }

      } catch (err) {
        setError(err.message || 'Error loading results.')
      } finally {
        setLoading(false)
      }
    }

    if (assessmentId) fetchResults()
  }, [assessmentId])

  if (loading) return <LoadingScreen message="Calculating adaptive skill-wise scores & AI analysis..." />
  if (error || !result) return <div className="alert alert-error">{error || 'No assessment data.'}</div>

  const { overallScore, totalQuestions, correctAnswers, skillScores } = result

  // Rendering logic
  const renderComparison = () => {
    if (!comparison) return null;
    const diff = comparison.current.overall - comparison.previous.overall;
    const isImprovement = diff >= 0;
    
    return (
      <div className="card comparison-card" style={{ padding: '24px', marginBottom: '24px', borderLeft: isImprovement ? '6px solid #16a34a' : '6px solid #dc2626', background: '#ffffff', borderRadius: '10px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 className="card-section-title" style={{ margin: 0 }}>📈 Historical Performance Progression</h2>
            <span style={{ 
               background: isImprovement ? '#dcfce7' : '#fee2e2', 
               color: isImprovement ? '#166534' : '#991b1b', 
               fontWeight: 'bold', 
               padding: '4px 12px', 
               borderRadius: '20px',
               fontSize: '0.9rem' 
            }}>
               {diff >= 0 ? `+${Math.round(diff)}% Improvement` : `${Math.round(diff)}% Decline`}
            </span>
         </div>
         
         <p style={{ color: '#475569', fontSize: '0.95rem' }}>
            Previous Attempt: <strong>{Math.round(comparison.previous.overall)}%</strong> &rarr; Current Attempt: <strong>{Math.round(comparison.current.overall)}%</strong>
         </p>
         
         <div style={{ overflowX: 'auto', marginTop: '15px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                     <th style={{ padding: '10px 14px' }}>Competency / Skill</th>
                     <th style={{ padding: '10px 14px' }}>Previous Score</th>
                     <th style={{ padding: '10px 14px' }}>Current Score</th>
                     <th style={{ padding: '10px 14px' }}>Change</th>
                     <th style={{ padding: '10px 14px' }}>Progression Status</th>
                  </tr>
               </thead>
               <tbody>
                  {comparison.current.scores.map(curr => {
                     const prev = comparison.previous.scores.find(p => p.skill_id === curr.skill_id);
                     const pScore = prev ? Number(prev.score_percentage) : 0;
                     const cScore = Number(curr.score_percentage);
                     const change = cScore - pScore;
                     
                     const skillNameObj = skillScores.find(s => s.skillId === curr.skill_id);
                     const name = skillNameObj ? skillNameObj.skillName : 'Skill';

                     let statusText = 'Unchanged';
                     let statusBg = '#f1f5f9';
                     let statusColor = '#475569';

                     if (change > 0) {
                        statusText = '↑ Improved';
                        statusBg = '#dcfce7';
                        statusColor = '#166534';
                     } else if (change < 0) {
                        statusText = '↓ Declined';
                        statusBg = '#fee2e2';
                        statusColor = '#991b1b';
                     }
                     
                     return (
                        <tr key={curr.skill_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                           <td style={{ padding: '12px 14px', fontWeight: '600' }}>{name}</td>
                           <td style={{ padding: '12px 14px' }}>{Math.round(pScore)}%</td>
                           <td style={{ padding: '12px 14px', fontWeight: 'bold' }}>{Math.round(cScore)}%</td>
                           <td style={{ padding: '12px 14px', color: change >= 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                              {change > 0 ? `+${Math.round(change)}%` : change < 0 ? `${Math.round(change)}%` : '0%'}
                           </td>
                           <td style={{ padding: '12px 14px' }}>
                              <span style={{ background: statusBg, color: statusColor, padding: '3px 8px', borderRadius: '6px', fontSize: '0.85em', fontWeight: '600' }}>
                                 {statusText}
                              </span>
                           </td>
                        </tr>
                     )
                  })}
               </tbody>
            </table>
         </div>
      </div>
    );
  }

  const renderSkillGaps = () => {
     return (
      <div className="card skill-gap-analysis-card" style={{ marginBottom: '20px' }}>
        <h2 className="card-section-title">📊 Designation Skill-Gap Analysis</h2>
        <p className="section-desc">Comparison between your Assessed Score and Required Standard.</p>

        {skillGaps.length === 0 ? (
          <p>No skill gaps identified.</p>
        ) : (
          <div className="gaps-list">
             {skillGaps.map(gap => {
                const gapVal = Math.max(0, gap.requiredScore - gap.assessedScore);
                const isMet = gap.assessedScore >= gap.requiredScore;
                
                let status = 'Strong';
                let color = '#16a34a';
                if (!isMet) {
                   if (gapVal <= 10) { status = 'Needs Improvement'; color = '#ca8a04'; }
                   else { status = 'High Priority'; color = '#dc2626'; }
                } else if (gap.assessedScore === gap.requiredScore) {
                   status = 'Meets Requirement';
                }

                return (
                   <div key={gap.id} style={{ marginBottom: '25px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                         <strong>{gap.skillName}</strong>
                         <span style={{ color, fontWeight: 'bold' }}>{status}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', color: '#64748b', marginBottom: '5px' }}>
                         <span>Current: {gap.assessedScore}%</span>
                         <span>Required: {gap.requiredScore}%</span>
                         <span>Gap: {gapVal}%</span>
                      </div>
                      
                      {/* Visual Bar */}
                      <div style={{ position: 'relative', height: '24px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                         {/* Required Target Marker */}
                         <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${gap.requiredScore}%`, width: '2px', background: '#000', zIndex: 10 }} />
                         {/* Assessed Bar */}
                         <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${gap.assessedScore}%`, background: color }} />
                      </div>
                   </div>
                )
             })}
          </div>
        )}
      </div>
     )
  }

  const renderRecommendedCourses = () => {
      // Only recommend courses where there is an actual gap > 0
      const gapsWithNeeds = skillGaps.filter(g => g.gapPercentage > 0).map(g => g.skillId);
      const filteredCourses = courses.filter(c => gapsWithNeeds.includes(c.skillId));

      return (
         <div className="card recommended-courses-card">
            <h2 className="card-section-title">Targeted iGOT Course Recommendations</h2>
            <p>These courses are prioritized strictly based on your identified skill gaps.</p>
            {filteredCourses.length === 0 ? (
               <p style={{ color: '#16a34a', fontWeight: 'bold', marginTop: '10px' }}>✓ You meet all required standards. No mandatory courses.</p>
            ) : (
               <ul style={{ listStyle: 'none', padding: 0 }}>
                  {filteredCourses.map(course => {
                     const skill = skillGaps.find(g => g.skillId === course.skillId);
                     return (
                        <li key={course.courseId || course.id} style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #bbf7d0' }}>
                           <h4 style={{ margin: '0 0 5px 0' }}>{course.title}</h4>
                           <p style={{ margin: 0, fontSize: '0.9em', color: '#166534' }}>Provider: {course.provider} | Duration: {course.duration || 'Self-paced'}</p>
                           <p style={{ margin: '5px 0 0 0', fontSize: '0.85em' }}>
                              Recommended to close <strong>{skill?.gapPercentage}%</strong> gap in <strong>{skill?.skillName}</strong>.
                           </p>
                        </li>
                     )
                  })}
               </ul>
            )}
            
            <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
               <Link 
                  to="/igot-courses" 
                  className="btn btn-primary"
                  style={{ 
                     display: 'inline-flex', 
                     alignItems: 'center', 
                     gap: '10px', 
                     padding: '12px 24px', 
                     fontSize: '1rem', 
                     fontWeight: '600',
                     borderRadius: '8px',
                     textDecoration: 'none'
                  }}
               >
                  <span>🎓 Explore AI-Recommended Courses for Skill Gaps</span> &rarr;
               </Link>
            </div>
         </div>
      );
  }

  return (
    <div className="result-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assessment Results & Competency Report</h1>
          <p className="page-subtitle">Overall Score: <strong>{Math.round(overallScore)}%</strong> ({correctAnswers}/{totalQuestions} correct)</p>
        </div>
        <div className="header-actions">
           <Link to="/reassessment" className="btn btn-primary" style={{ marginRight: '10px' }}>
              🎯 Start Reassessment Loop
           </Link>
           <Link to="/assessment" className="btn btn-outline" style={{ marginRight: '10px' }}>
              Take Another Assessment
           </Link>
        </div>
      </div>

      {renderComparison()}
      
      {renderSkillGaps()}
      
      {renderRecommendedCourses()}
    </div>
  )
}
