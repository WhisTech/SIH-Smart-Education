import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Flame, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function ArenaLeaderboard() {
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    let isMounted = true
    const fetchLeaderboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
        const response = await fetch(`${backendUrl}/api/arena/leaderboard`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        })
        const data = response.ok ? await response.json() : []

        if (isMounted && data) {
          setPlayers(data)
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchLeaderboard()
    return () => { isMounted = false }
  }, [])

  return (
    <div className="dashboard modern-dashboard">
      <div className="card-header-clean" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
        <Link to="/arena" className="btn btn-outline btn-sm">
          <ChevronLeft size={16} /> Back to Arena
        </Link>
        <div className="header-title-group" style={{ marginLeft: '16px' }}>
          <h3 className="section-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Trophy color="#fbbf24" size={24} /> Arena Leaderboard
          </h3>
        </div>
      </div>

      <div className="card animate-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
            <p style={{ color: '#64748b', fontWeight: '500' }}>Loading global ranking...</p>
          </div>
        ) : players.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <Trophy size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <h4 style={{ color: '#334155', marginBottom: '8px' }}>No Ranked Players Yet</h4>
            <p style={{ color: '#64748b' }}>Be the first to compete in the Arena and claim the #1 spot!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem' }}>Rank</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem' }}>Employee</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem' }}>Arena Points</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem' }}>Wins</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem' }}>Streak</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => {
                  const isMe = player.userId === user?.id;
                  const rowStyle = {
                    borderBottom: index === players.length - 1 ? 'none' : '1px solid #f1f5f9',
                    backgroundColor: isMe ? '#e0e7ff' : 'transparent',
                    transition: 'background-color 0.2s'
                  };
                  return (
                  <tr key={player.userId || index} style={rowStyle} onMouseEnter={(e) => { if(!isMe) e.currentTarget.style.backgroundColor = '#f8fafc' }} onMouseLeave={(e) => { if(!isMe) e.currentTarget.style.backgroundColor = 'transparent' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 'bold' }}>
                      {player.rank === 1 ? <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', background: '#fef3c7', padding: '4px 12px', borderRadius: '999px', width: 'fit-content' }}>🥇 #1</div> :
                       player.rank === 2 ? <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', background: '#f1f5f9', padding: '4px 12px', borderRadius: '999px', width: 'fit-content' }}>🥈 #2</div> :
                       player.rank === 3 ? <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9a3412', background: '#ffedd5', padding: '4px 12px', borderRadius: '999px', width: 'fit-content' }}>🥉 #3</div> :
                       <div style={{ padding: '4px 12px', color: '#64748b' }}>#{player.rank}</div>}
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: '600', color: isMe ? '#4338ca' : '#1e293b' }}>
                      {player.name} {isMe && <span style={{ fontSize: '0.75rem', backgroundColor: '#4338ca', color: '#fff', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px' }}>You</span>}
                    </td>
                    <td style={{ padding: '16px 24px', color: '#4f46e5', fontWeight: 'bold', fontSize: '1.1rem' }}>{player.points} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Points</span></td>
                    <td style={{ padding: '16px 24px', color: '#334155', fontWeight: '500' }}>{player.wins}</td>
                    <td style={{ padding: '16px 24px', color: '#334155', fontWeight: '500' }}>
                      {player.streak > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {player.streak} <Flame size={16} color="#ef4444" style={{ filter: 'drop-shadow(0 0 2px rgba(239, 68, 68, 0.4))' }} />
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
