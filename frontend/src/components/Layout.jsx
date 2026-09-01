import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, 
  BrainCircuit, 
  FileQuestion, 
  GraduationCap, 
  Microscope, 
  UserCircle, 
  LogOut,
  Menu,
  ChevronLeft
} from 'lucide-react'

export default function Layout() {
  const { user, profile, signOut } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className={`app-shell ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      
      {/* Mobile Header (Only visible on small screens) */}
      <header className="mobile-header">
        <div className="mobile-header-left">
          <button className="icon-btn" onClick={toggleMobileMenu} aria-label="Toggle Menu">
            <Menu size={24} />
          </button>
          <Link to="/dashboard" className="mobile-brand">
            <span className="brand-emblem" aria-hidden="true">🏛️</span>
            <span className="brand-title">Skill Intelligence</span>
          </Link>
        </div>
        {user && (
          <div className="mobile-header-right">
            <button className="icon-btn" onClick={handleLogout} aria-label="Logout">
              <LogOut size={20} />
            </button>
          </div>
        )}
      </header>

      {/* Overlay for mobile drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="brand">
            <span className="brand-emblem" aria-hidden="true">🏛️</span>
            {isSidebarOpen && (
              <div className="brand-text">
                <span className="brand-title">Skill Intelligence Platform</span>
                <span className="brand-subtitle">MoSPI</span>
              </div>
            )}
          </Link>
          <button className="sidebar-toggle desktop-only" onClick={toggleSidebar} aria-label="Toggle Sidebar">
            <ChevronLeft size={20} className={!isSidebarOpen ? 'rotate-180' : ''} />
          </button>
        </div>

        <div className="sidebar-content">
          {user ? (
            <nav className="main-nav" aria-label="Main Navigation">
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} onClick={() => setIsMobileMenuOpen(false)}>
                <LayoutDashboard size={20} />
                {isSidebarOpen && <span>Dashboard</span>}
              </NavLink>
              <NavLink to="/assessment" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} onClick={() => setIsMobileMenuOpen(false)}>
                <BrainCircuit size={20} />
                {isSidebarOpen && <span>AI Assessment</span>}
              </NavLink>
              <NavLink to="/mcq-generator" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} onClick={() => setIsMobileMenuOpen(false)}>
                <FileQuestion size={20} />
                {isSidebarOpen && <span>MCQ Generator</span>}
              </NavLink>
              <NavLink to="/igot-courses" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} onClick={() => setIsMobileMenuOpen(false)}>
                <GraduationCap size={20} />
                {isSidebarOpen && <span>iGOT Courses</span>}
              </NavLink>
              <NavLink to="/research-engine" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} onClick={() => setIsMobileMenuOpen(false)}>
                <Microscope size={20} />
                {isSidebarOpen && <span>Research Engine</span>}
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} onClick={() => setIsMobileMenuOpen(false)}>
                <UserCircle size={20} />
                {isSidebarOpen && <span>My Profile</span>}
              </NavLink>
            </nav>
          ) : (
            <nav className="main-nav">
              <NavLink to="/login" className="nav-link">
                <LogOut size={20} style={{ transform: 'rotate(180deg)' }} />
                {isSidebarOpen && <span>Login</span>}
              </NavLink>
            </nav>
          )}
        </div>

        {user && (
          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="user-avatar">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              {isSidebarOpen && (
                <div className="user-details">
                  <span className="user-name">{profile?.name ? profile.name : user.email}</span>
                  {profile?.employee_id && <span className="user-badge">{profile.employee_id}</span>}
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button type="button" className="btn btn-logout-sidebar" onClick={handleLogout} title="Sign out">
                <LogOut size={16} /> Logout
              </button>
            )}
            {!isSidebarOpen && (
              <button type="button" className="icon-btn logout-icon-only" onClick={handleLogout} title="Sign out">
                <LogOut size={20} />
              </button>
            )}
          </div>
        )}
      </aside>

      <div className="app-content-wrapper">
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
    </div>
  )
}
