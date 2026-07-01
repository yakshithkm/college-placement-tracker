import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function ScoreRing({ score, size = 140, color = '#2563EB' }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (pct / 100) * circumference;
  const grade = pct >= 80 ? 'Excellent' : pct >= 65 ? 'Good' : pct >= 50 ? 'Average' : 'Needs Work';

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="score-text">
        <div className="score-value" style={{ color, fontSize: size > 120 ? 28 : 20 }}>{pct.toFixed(0)}</div>
        <div className="score-label" style={{ fontSize: size > 120 ? 10 : 9 }}>{grade}</div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg, link }) {
  const card = (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg, fontSize: 22 }}>{icon}</div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
  return link ? <Link to={link} style={{ textDecoration: 'none' }}>{card}</Link> : card;
}

function QuickAction({ icon, title, desc, to, color }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: 'pointer', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = '#F8FAFC'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsAPI.getDashboard().then(r => r.data.data),
    enabled: user?.role === 'student',
  });

  if (user?.role !== 'student') {
    return (
      <div>
        <div className="page-title">Welcome, {user?.firstName}!</div>
        <div className="page-subtitle">
          {user?.role === 'coordinator' ? (
            <><Link to="/coordinator">View placement statistics →</Link></>
          ) : (
            <><Link to="/admin">Go to admin panel →</Link></>
          )}
        </div>
      </div>
    );
  }

  const stats = data || {};

  return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-subtitle">Your placement readiness at a glance</div>

      {isLoading ? (
        <div className="page-loading"><div className="loading-spinner" /></div>
      ) : (
        <>
          {/* Readiness overview */}
          <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <ScoreRing score={stats.readinessScore || 0} color="#2563EB" />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Placement Readiness</div>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h2 style={{ fontSize: 22, marginBottom: 6 }}>
                {stats.readinessScore >= 80 ? '🎉 You\'re placement ready!' :
                 stats.readinessScore >= 60 ? '📈 Almost there!' :
                 '🚀 Let\'s build your profile!'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                Your score is computed from academics, projects, certifications, aptitude, and interview performance.
                {stats.readinessScore < 70 && ' Keep adding achievements to improve your score.'}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to="/analytics" className="btn btn-primary btn-sm">View Full Analytics</Link>
                <Link to="/profile" className="btn btn-secondary btn-sm">Update Profile</Link>
              </div>
            </div>

            {/* Sub-scores */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minWidth: 260 }}>
              {[
                { label: 'Resume Score', val: stats.resumeScore, color: '#7C3AED' },
                { label: 'Aptitude Avg', val: stats.aptitudeAvg, color: '#059669' },
                { label: 'Interview Score', val: stats.interviewScore ? (stats.interviewScore * 10).toFixed(0) : 0, color: '#EA580C' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <ScoreRing score={parseFloat(val) || 0} size={80} color={color} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats grid */}
          <div className="stats-grid">
            <StatCard icon="🧮" label="Aptitude Tests Taken" value={stats.quizAttemptCount} color="#0891B2" bg="#ECFEFF" link="/aptitude-tests/history" />
            <StatCard icon="🏆" label="Certifications" value={stats.certCount} color="#7C3AED" bg="#F5F3FF" link="/certifications" />
            <StatCard icon="💻" label="Projects" value={stats.projectCount} color="#059669" bg="#ECFDF5" link="/projects" />
            <StatCard icon="📋" label="Applications" value={stats.applicationCount} color="#2563EB" bg="#EFF6FF" link="/applications" />
            <StatCard icon="✅" label="Offers Received" value={stats.selectedCount} color="#EA580C" bg="#FFF7ED" link="/applications" />
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              <QuickAction icon="🧮" title="Take Aptitude Test" desc="Attempt a quiz, build your score" to="/aptitude-tests" color="#0891B2" />
              <QuickAction icon="📄" title="Upload Resume" desc="Add a new resume version" to="/resumes" color="#2563EB" />
              <QuickAction icon="💻" title="Add Project" desc="Showcase your work" to="/projects" color="#059669" />
              <QuickAction icon="🏆" title="Add Certification" desc="Validate your skills" to="/certifications" color="#7C3AED" />
              <QuickAction icon="📝" title="Log Aptitude Score" desc="Manually record a score" to="/aptitude" color="#EA580C" />
              <QuickAction icon="🎤" title="Add Interview" desc="Record mock interview" to="/interviews" color="#0891B2" />
              <QuickAction icon="🏢" title="Browse Drives" desc="Find placement opportunities" to="/drives" color="#D97706" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}