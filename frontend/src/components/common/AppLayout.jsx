import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const StudentNav = () => (
  <>
    <div className="nav-section">
      <div className="nav-section-title">Overview</div>
      <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📊</span> Dashboard
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📈</span> Analytics
      </NavLink>
    </div>
    <div className="nav-section">
      <div className="nav-section-title">Profile</div>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">👤</span> My Profile
      </NavLink>
      <NavLink to="/resumes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📄</span> Resumes
      </NavLink>
      <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">💻</span> Projects
      </NavLink>
      <NavLink to="/certifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🏆</span> Certifications
      </NavLink>
    </div>
    <div className="nav-section">
      <div className="nav-section-title">Preparation</div>
      <NavLink to="/aptitude-tests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🧮</span> Aptitude Test Module
      </NavLink>
      <NavLink to="/aptitude" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📝</span> Manual Score Log
      </NavLink>
      <NavLink to="/interviews" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🎤</span> Interview Scores
      </NavLink>
    </div>
    <div className="nav-section">
      <div className="nav-section-title">Placements</div>
      <NavLink to="/drives" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🏢</span> Drives
      </NavLink>
      <NavLink to="/applications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📋</span> Applications
      </NavLink>
    </div>
  </>
);

const CoordinatorNav = () => (
  <>
    <div className="nav-section">
      <div className="nav-section-title">Coordinator</div>
      <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📊</span> Dashboard
      </NavLink>
      <NavLink to="/coordinator" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📈</span> Statistics
      </NavLink>
      <NavLink to="/drives" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🏢</span> Placement Drives
      </NavLink>
    </div>
    <div className="nav-section">
      <div className="nav-section-title">Aptitude Test Module</div>
      <NavLink to="/aptitude-tests/admin/tests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🧮</span> Manage Tests
      </NavLink>
      <NavLink to="/aptitude-tests/admin/questions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">❓</span> Question Bank
      </NavLink>
    </div>
  </>
);

const AdminNav = () => (
  <>
    <div className="nav-section">
      <div className="nav-section-title">Admin</div>
      <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📊</span> Dashboard
      </NavLink>
      <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">⚙️</span> Administration
      </NavLink>
      <NavLink to="/coordinator" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📈</span> Statistics
      </NavLink>
      <NavLink to="/drives" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🏢</span> Placement Drives
      </NavLink>
    </div>
    <div className="nav-section">
      <div className="nav-section-title">Aptitude Test Module</div>
      <NavLink to="/aptitude-tests/admin/tests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🧮</span> Manage Tests
      </NavLink>
      <NavLink to="/aptitude-tests/admin/questions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">❓</span> Question Bank
      </NavLink>
    </div>
  </>
);

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">PT</div>
          <div>
            <div className="logo-text">PlaceTrack</div>
            <div className="logo-sub">Placement Tracker</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {user?.role === 'student' && <StudentNav />}
          {user?.role === 'coordinator' && <CoordinatorNav />}
          {user?.role === 'admin' && <AdminNav />}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: 'var(--color-primary)' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button className="nav-item w-full" onClick={handleLogout}>
            <span className="nav-icon">🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-bar">
          <button
            className="btn btn-secondary btn-sm"
            style={{ display: 'none' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Welcome, <strong>{user?.firstName}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}