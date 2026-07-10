import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { aptitudeTestAPI } from '../../services/api';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, BarElement, PointElement, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, BarElement, PointElement, Tooltip, Legend, Filler);

export default function QuizHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['apt-my-attempts'],
    queryFn: () => aptitudeTestAPI.getMyAttempts().then(r => r.data.data),
  });

  if (isLoading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  const { attempts = [], stats = {}, trend = [] } = data || {};

  const trendData = {
    labels: trend.map(t => new Date(t.submitted_at).toLocaleDateString()),
    datasets: [{
      label: 'Score %',
      data: trend.map(t => t.percentage),
      borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)',
      fill: true, tension: 0.3, pointRadius: 5,
    }],
  };

  const catMap = {};
  attempts.forEach(a => {
    const cat = a.category_name || 'Mixed';
    if (!catMap[cat]) catMap[cat] = { total: 0, count: 0, color: a.category_color || '#2563EB' };
    catMap[cat].total += parseFloat(a.percentage || 0);
    catMap[cat].count += 1;
  });
  const catLabels = Object.keys(catMap);
  const catData = {
    labels: catLabels,
    datasets: [{
      label: 'Avg Score %',
      data: catLabels.map(c => Math.round(catMap[c].total / catMap[c].count)),
      backgroundColor: catLabels.map(c => catMap[c].color + 'CC'),
      borderColor: catLabels.map(c => catMap[c].color),
      borderWidth: 2, borderRadius: 6,
    }],
  };

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">Aptitude Test Analytics</div>
          <div className="page-subtitle">Your complete test history and performance trends</div>
        </div>
        <Link to="/aptitude-tests" className="btn btn-primary">+ Take a Test</Link>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-primary)' }}>{stats.total_attempts || 0}</div><div className="stat-label">Tests Attempted</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-success)' }}>{parseFloat(stats.avg_score || 0).toFixed(1)}%</div><div className="stat-label">Average Score</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#7C3AED' }}>{parseFloat(stats.best_score || 0).toFixed(1)}%</div><div className="stat-label">Highest Score</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-warning)' }}>{stats.passed_count || 0}</div><div className="stat-label">Tests Passed</div></div>
      </div>

      {trend.length > 0 && (
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Improvement Trend</h3></div>
            <div className="chart-container"><Line data={trendData} options={chartOpts} /></div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Category-wise Strength</h3></div>
            <div className="chart-container"><Bar data={catData} options={chartOpts} /></div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h3 className="card-title">Attempt History</h3></div>
        {attempts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No attempts yet</h3>
            <p>Take your first aptitude test to start tracking progress</p>
            <Link to="/aptitude-tests" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Tests</Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Test</th><th>Category</th><th>Mode</th><th>Score</th><th>Result</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {attempts.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.test_title}</strong></td>
                    <td>{a.category_icon} {a.category_name || 'Mixed'}</td>
                    <td><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{a.mode}</span></td>
                    <td><strong style={{ color: a.percentage >= 70 ? 'var(--color-success)' : a.percentage >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }}>{a.percentage}%</strong> ({a.score}/{a.total_marks})</td>
                    <td><span className={`badge ${a.passed ? 'badge-green' : 'badge-red'}`}>{a.passed ? '✓ Passed' : '✗ Failed'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(a.submitted_at).toLocaleDateString()}</td>
                    <td><Link to={`/aptitude-tests/result/${a.id}`} className="btn btn-secondary btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}