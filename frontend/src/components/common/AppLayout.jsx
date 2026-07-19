import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HamburgerIcon from './HamburgerIcon';
import {
  LayoutDashboard, TrendingUp, User, FileText, Code2, Award,
  Calculator, ClipboardList, Mic, Building2, ListChecks,
  HelpCircle, Settings, LogOut,
} from 'lucide-react';

const StudentNav = () => (
  <>
    <div className="nav-section">
      <div className="nav-section-title">Overview</div>
      <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard className="nav-icon" size={18} /> Dashboard
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <TrendingUp className="nav-icon" size={18} /> Analytics
      </NavLink>
    </div>
    <div className="nav-section">
      <div className="nav-section-title">Profile</div>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <User className="nav-icon" size={18} /> My Profile
      </NavLink>
      <NavLink to="/resumes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <FileText className="nav-icon" size={18} /> Resumes
      </NavLink>
      <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Code2 className="nav-icon" size={18} /> Projects
      </NavLink>
      <NavLink to="/certifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Award className="nav-icon" size={18} /> Certifications
      </NavLink>
    </div>
    <div className="nav-section">
      <div className="nav-section-title">Preparation</div>
      <NavLink to="/aptitude-tests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Calculator className="nav-icon" size={18} /> Aptitude Test Module
      </NavLink>
      <NavLink to="/aptitude" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ClipboardList className="nav-icon" size={18} /> Manual Score Log
      </NavLink>
      <NavLink to="/interviews" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Mic className="nav-icon" size={18} /> Interview Scores
      </NavLink>
    </div>
    <div className="nav-section">
      <div className="nav-section-title">Placements</div>
      <NavLink to="/drives" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Building2 className="nav-icon" size={18} /> Drives
      </NavLink>
      <NavLink to="/applications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ListChecks className="nav-icon" size={18} /> Applications
      </NavLink>
    </div>
  </>
);

const CoordinatorNav = () => (
  <>
    <div className="nav-section">
      <div className="nav-section-title">Coordinator</div>
      <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard className="nav-icon" size={18} /> Dashboard
      </NavLink>
      <NavLink to="/coordinator" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <TrendingUp className="nav-icon" size={18} /> Statistics
      </NavLink>
      <NavLink to="/drives" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Building2 className="nav-icon" size={18} /> Placement Drives
      </NavLink>
    </div>
    <div className="nav-section">
      <div className="nav-section-title">Aptitude Test Module</div>
      <NavLink to="/aptitude-tests/admin/tests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Calculator className="nav-icon" size={18} /> Manage Tests
      </NavLink>
      <NavLink to="/aptitude-tests/admin/questions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <HelpCircle className="nav-icon" size={18} /> Question Bank
      </NavLink>
    </div>
  </>
);

const AdminNav = () => (
  <>
    <div className="nav-section">
      <div className="nav-section-title">Admin</div>
      <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard className="nav-icon" size={18} /> Dashboard
      </NavLink>
      <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Settings className="nav-icon" size={18} /> Administration
      </NavLink>
      <NavLink to="/coordinator" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <TrendingUp className="nav-icon" size={18} /> Statistics
      </NavLink>
      <NavLink to="/drives" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Building2 className="nav-icon" size={18} /> Placement Drives
      </NavLink>
    </div>
    <div className="nav-section">
      <div className="nav-section-title">Aptitude Test Module</div>
      <NavLink to="/aptitude-tests/admin/tests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Calculator className="nav-icon" size={18} /> Manage Tests
      </NavLink>
      <NavLink to="/aptitude-tests/admin/questions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <HelpCircle className="nav-icon" size={18} /> Question Bank
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

  const closeSidebar = () => setSidebarOpen(false);

  // Event delegation: close the mobile sidebar whenever a nav link inside it is clicked
  const handleSidebarNavClick = (e) => {
    if (e.target.closest('a')) closeSidebar();
  };

  return (
    <div className="app-layout">
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">PT</div>
          <div>
            <div className="logo-text">PlaceTrack</div>
            <div className="logo-sub">Placement Tracker</div>
          </div>
        </div>

        <nav className="sidebar-nav" onClick={handleSidebarNavClick}>
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
            <LogOut className="nav-icon" size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HamburgerIcon open={sidebarOpen} onClick={() => setSidebarOpen(o => !o)} />
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Welcome, <strong>{user?.firstName}</strong>
            </div>
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