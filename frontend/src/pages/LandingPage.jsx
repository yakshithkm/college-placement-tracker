import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 60px', background: 'white', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>PT</div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>PlaceTrack</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" className="btn btn-secondary">Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #7C3AED 100%)', padding: '100px 60px', textAlign: 'center', color: 'white' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: 20, fontSize: 13, marginBottom: 28 }}>
            🎓 Built for CSE Students • Multi-College Platform
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15, marginBottom: 24 }}>
            Your Placement Journey,<br />
            <span style={{ background: 'linear-gradient(90deg, #93C5FD, #C4B5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tracked & Optimized</span>
          </h1>
          <p style={{ fontSize: 20, opacity: 0.85, marginBottom: 44, lineHeight: 1.7 }}>
            From resume to offer letter — manage your entire placement preparation in one platform. Track skills, projects, aptitude, and interviews with real-time analytics.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ background: 'white', color: '#2563EB', padding: '14px 32px', fontSize: 16, fontWeight: 600 }}>
              Start Tracking Free →
            </Link>
            <Link to="/login" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '14px 32px', fontSize: 16 }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'white', padding: '60px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40, textAlign: 'center' }}>
          {[['10+', 'Modules'], ['Real-time', 'Analytics'], ['Role-based', 'Access'], ['Docker', 'Ready']].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#2563EB', marginBottom: 6 }}>{val}</div>
              <div style={{ fontSize: 14, color: '#64748B' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 60px', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>Everything You Need to Get Placed</h2>
          <p style={{ textAlign: 'center', color: '#64748B', marginBottom: 56, fontSize: 16 }}>A complete ecosystem for placement preparation</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { icon: '📊', title: 'Readiness Score', desc: 'AI-powered score analyzing academic performance, projects, certifications, aptitude, and interview skills.' },
              { icon: '📄', title: 'Resume Management', desc: 'Upload and manage multiple resume versions. Mark your active resume for applications.' },
              { icon: '💻', title: 'Projects Portfolio', desc: 'Showcase GitHub projects with descriptions, technologies, and live links.' },
              { icon: '🏆', title: 'Certifications', desc: 'Track certifications from any provider with verification URLs and expiry dates.' },
              { icon: '🧮', title: 'Aptitude Tracking', desc: 'Log quantitative, logical, and verbal scores. Visualize progress with trend charts.' },
              { icon: '🎤', title: 'Interview Readiness', desc: 'Rate mock interviews on communication, technical, and HR dimensions.' },
              { icon: '🏢', title: 'Placement Drives', desc: 'Browse active drives, register, and track your application status end-to-end.' },
              { icon: '📈', title: 'Progress Analytics', desc: 'Identify strengths, weak areas, and get personalized improvement recommendations.' },
              { icon: '👥', title: 'Role-based Access', desc: 'Separate dashboards for students, placement coordinators, and admins.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card" style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0F172A', padding: '80px 60px', textAlign: 'center', color: 'white' }}>
        <h2 style={{ fontSize: 36, marginBottom: 16 }}>Ready to Ace Your Placements?</h2>
        <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 36 }}>Join thousands of students tracking their way to their dream companies.</p>
        <Link to="/register" className="btn" style={{ background: '#2563EB', color: 'white', padding: '14px 36px', fontSize: 16, fontWeight: 600 }}>
          Create Free Account →
        </Link>
      </section>

      <footer style={{ background: '#0F172A', borderTop: '1px solid #1E293B', padding: '24px 60px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
        © 2026 PlaceTrack — College Placement Tracker Platform
      </footer>
    </div>
  );
}
