import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI, studentsAPI } from '../services/api';

export function CoordinatorPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['coordinator-stats'],
    queryFn: () => analyticsAPI.getCoordinatorStats().then(r => r.data.data),
  });

  if (isLoading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <div>
      <div className="page-title">Coordinator Dashboard</div>
      <div className="page-subtitle">Placement statistics and student readiness overview</div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Students', val: stats?.totalStudents, color: '#2563EB', bg: '#EFF6FF', icon: '🎓' },
          { label: 'Eligible Students', val: stats?.eligibleStudents, color: '#059669', bg: '#ECFDF5', icon: '✅' },
          { label: 'Students Applied', val: stats?.studentsApplied, color: '#7C3AED', bg: '#F5F3FF', icon: '📤' },
          { label: 'Students Selected', val: stats?.studentsSelected, color: '#EA580C', bg: '#FFF7ED', icon: '🎊' },
          { label: 'Avg Readiness Score', val: stats?.avgReadinessScore + '%', color: '#0891B2', bg: '#ECFEFF', icon: '📊' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, fontSize: 22 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.val ?? '—'}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Department Breakdown</h3></div>
          {stats?.departments?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Department</th><th>Students</th><th>Avg CGPA</th></tr></thead>
                <tbody>
                  {stats.departments.map(d => (
                    <tr key={d.department}>
                      <td>{d.department || 'Not Set'}</td>
                      <td><strong>{d.count}</strong></td>
                      <td>{d.avg_cgpa ? parseFloat(d.avg_cgpa).toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No department data</div>}
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Recent Placement Drives</h3></div>
          {stats?.recentDrives?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Drive</th><th>Company</th><th>Status</th><th>Applicants</th></tr></thead>
                <tbody>
                  {stats.recentDrives.map((d, i) => (
                    <tr key={i}>
                      <td style={{ maxWidth: 140, fontSize: 13 }}>{d.title}</td>
                      <td style={{ fontSize: 13 }}>{d.company}</td>
                      <td><span className={`badge ${d.status === 'active' ? 'badge-green' : d.status === 'upcoming' ? 'badge-blue' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{d.status}</span></td>
                      <td>{d.applicants}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No drives yet</div>}
        </div>
      </div>
    </div>
  );
}

export function AdminPage() {
  const [tab, setTab] = useState('students');
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['all-students'],
    queryFn: () => studentsAPI.getAllStudents({ limit: 50 }).then(r => r.data.data),
  });

  return (
    <div>
      <div className="page-title">Administration</div>
      <div className="page-subtitle">Manage students, companies, and platform settings</div>

      <div className="tabs">
        {[['students', '🎓 Students'], ['overview', '📊 Overview']].map(([k, l]) => (
          <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'students' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">All Students ({students.length})</h3>
          </div>
          {studentsLoading ? (
            <div className="page-loading"><div className="loading-spinner" /></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Roll No.</th><th>Department</th><th>CGPA</th><th>Readiness</th><th>Eligible</th></tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.first_name} {s.last_name}</strong></td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.email}</td>
                      <td>{s.roll_number || '—'}</td>
                      <td style={{ fontSize: 13 }}>{s.department || '—'}</td>
                      <td>{s.cgpa || '—'}</td>
                      <td>
                        {s.readiness_score ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${s.readiness_score}%`, height: '100%', background: s.readiness_score >= 70 ? 'var(--color-success)' : 'var(--color-warning)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12 }}>{parseFloat(s.readiness_score).toFixed(0)}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not calculated</span>}
                      </td>
                      <td>
                        <span className={`badge ${s.placement_eligible ? 'badge-green' : 'badge-red'}`}>
                          {s.placement_eligible ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No students registered</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'overview' && (
        <div className="card">
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
            <h3 style={{ marginBottom: 8 }}>Admin Controls</h3>
            <p>Platform configuration, data exports, and system settings would go here.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoordinatorPage;
