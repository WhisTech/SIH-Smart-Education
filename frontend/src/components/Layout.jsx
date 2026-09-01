import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, profile, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <Link to="/dashboard" className="brand">
            <span className="brand-emblem" aria-hidden="true">🏛️</span>
            <div className="brand-text">
              <span className="brand-title">Skill Intelligence Platform</span>
              <span className="brand-subtitle">Ministry of Statistics &amp; Programme Implementation</span>
            </div>
          </Link>

          {user && (
            <nav className="main-nav" aria-label="Main Navigation">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/assessment"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                AI Assessment
              </NavLink>
              <NavLink
                to="/mcq-generator"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                MCQ Generator
              </NavLink>
              <NavLink
                to="/igot-courses"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                iGOT Courses
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                My Profile
              </NavLink>
            </nav>
          )}

          <div className="header-actions">
            {user ? (
              <>
                <div className="user-welcome">
                  <span className="user-name">
                    {profile?.name ? profile.name : user.email}
                  </span>
                  {profile?.employee_id && (
                    <span className="user-badge">{profile.employee_id}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-logout btn-sm"
                  onClick={handleLogout}
                  title="Sign out of your account"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <p>© 2026 Government of India · Ministry of Statistics and Programme Implementation (MoSPI)</p>
          <p className="footer-sub">Official Statistical System Competency &amp; Skill Development Framework</p>
        </div>
      </footer>
    </div>
  )
}
