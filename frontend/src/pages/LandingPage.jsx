import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HamburgerIcon from '../components/common/HamburgerIcon';
import {
  ArrowRight, GraduationCap, BarChart3, FileText, Code2, Award,
  Calculator, Mic, Building2, TrendingUp, Users,
} from 'lucide-react';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-box">PT</div>
          <span className="landing-logo-text">PlaceTrack</span>
        </div>

        <div className="landing-nav-actions">
          <Link to="/login" className="btn btn-secondary">Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started <ArrowRight size={16} style={{ verticalAlign: -3, marginLeft: 4 }} /></Link>
        </div>

        <div className="landing-nav-hamburger">
          <HamburgerIcon open={menuOpen} onClick={() => setMenuOpen(o => !o)} label="Toggle navigation menu" />
        </div>
      </nav>

      <div className={`landing-mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link to="/login" className="btn btn-secondary w-full" onClick={() => setMenuOpen(false)}>Sign In</Link>
        <Link to="/register" className="btn btn-primary w-full" onClick={() => setMenuOpen(false)}>Get Started <ArrowRight size={16} style={{ verticalAlign: -3, marginLeft: 4 }} /></Link>
      </div>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-badge">
            <GraduationCap size={16} /> Built for CSE Students • Multi-College Platform
          </div>
          <h1 className="landing-hero-title">
            Your Placement Journey,<br />
            <span className="landing-hero-gradient-text">Tracked &amp; Optimized</span>
          </h1>
          <p className="landing-hero-desc">
            From resume to offer letter — manage your entire placement preparation in one platform. Track skills, projects, aptitude, and interviews with real-time analytics.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register" className="btn btn-primary" style={{ background: 'white', color: '#2563EB', padding: '14px 32px', fontSize: 16, fontWeight: 600 }}>
              Start Tracking Free <ArrowRight size={16} style={{ verticalAlign: -3, marginLeft: 4 }} />
            </Link>
            <Link to="/login" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '14px 32px', fontSize: 16 }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="landing-stats-section">
        <div className="landing-stats-grid">
          {[['10+', 'Modules'], ['Real-time', 'Analytics'], ['Role-based', 'Access'], ['Docker', 'Ready']].map(([val, label]) => (
            <div key={label}>
              <div className="landing-stat-value">{val}</div>
              <div className="landing-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="landing-features-section">
        <div className="landing-features-inner">
          <h2 className="landing-features-title">Everything You Need to Get Placed</h2>
          <p className="landing-features-sub">A complete ecosystem for placement preparation</p>
          <div className="landing-features-grid">
            {[
              { icon: <BarChart3 />, title: 'Readiness Score', desc: 'AI-powered score analyzing academic performance, projects, certifications, aptitude, and interview skills.' },
              { icon: <FileText />, title: 'Resume Management', desc: 'Upload and manage multiple resume versions. Mark your active resume for applications.' },
              { icon: <Code2 />, title: 'Projects Portfolio', desc: 'Showcase GitHub projects with descriptions, technologies, and live links.' },
              { icon: <Award />, title: 'Certifications', desc: 'Track certifications from any provider with verification URLs and expiry dates.' },
              { icon: <Calculator />, title: 'Aptitude Preparation', desc: 'Aptitude Test Module: Take timed or practice exams across 5 categories with instant scoring and analytics.\nManual Score Log: Quickly record scores from any external test to track alongside it.' },
              { icon: <Mic />, title: 'Interview Readiness', desc: 'Rate mock interviews on communication, technical, and HR dimensions.' },
              { icon: <Building2 />, title: 'Placement Drives', desc: 'Browse active drives, register, and track your application status end-to-end.' },
              { icon: <TrendingUp />, title: 'Progress Analytics', desc: 'Identify strengths, weak areas, and get personalized improvement recommendations.' },
              { icon: <Users />, title: 'Role-based Access', desc: 'Separate dashboards for students, placement coordinators, and admins.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card landing-feature-card">
                <div className="landing-feature-icon">{icon}</div>
                <h3 className="landing-feature-title">{title}</h3>
                <p className="landing-feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta-section">
        <h2 className="landing-cta-title">Ready to Ace Your Placements?</h2>
        <p className="landing-cta-desc">Join thousands of students tracking their way to their dream companies.</p>
        <Link to="/register" className="btn" style={{ background: '#2563EB', color: 'white', padding: '14px 36px', fontSize: 16, fontWeight: 600 }}>
          Create Free Account <ArrowRight size={16} style={{ verticalAlign: -3, marginLeft: 4 }} />
        </Link>
      </section>

      <footer className="landing-footer">
        © 2026 PlaceTrack — College Placement Tracker Platform
      </footer>
    </div>
  );
}