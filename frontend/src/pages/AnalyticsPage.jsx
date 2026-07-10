import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, LineElement, BarElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, CategoryScale, LinearScale, LineElement, BarElement, PointElement, Title, Tooltip, Legend, Filler);

function ScoreGauge({ score, label, color }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 128 128" style={{ width: '100%', maxWidth: 128, height: 'auto' }}>
        <circle cx="64" cy="64" r="54" fill="none" stroke="#E2E8F0" strokeWidth="10" />
        <circle cx="64" cy="64" r="54" fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x="64" y="60" textAnchor="middle" fontSize="22" fontWeight="700" fill={color} fontFamily="Space Grotesk">{score.toFixed(0)}</text>
        <text x="64" y="76" textAnchor="middle" fontSize="9" fill="#94A3B8" fontFamily="Inter">out of 100</text>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsAPI.getMyAnalytics().then(r => r.data.data),
  });

  const refreshMutation = useMutation({
    mutationFn: () => analyticsAPI.refresh(),
    onSuccess: () => { toast.success('Analytics refreshed!'); qc.invalidateQueries(['analytics']); },
  });

  if (isLoading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  const current = data?.current || {};
  const trends = data?.trends || [];

  const scores = [
    { key: 'projectsScore', label: 'Projects', color: '#059669' },
    { key: 'certificationsScore', label: 'Certifications', color: '#7C3AED' },
    { key: 'aptitudeScore', label: 'Aptitude', color: '#2563EB' },
    { key: 'interviewReadinessScore', label: 'Interview', color: '#EA580C' },
    { key: 'skillsScore', label: 'Skills', color: '#0891B2' },
    { key: 'resumeScore', label: 'Resume', color: '#D97706' },
  ];

  const donutData = {
    labels: scores.map(s => s.label),
    datasets: [{
      data: scores.map(s => Math.max(current[s.key] || 0, 1)),
      backgroundColor: scores.map(s => s.color + 'CC'),
      borderColor: scores.map(s => s.color),
      borderWidth: 2,
    }],
  };

  const trendLabels = trends.map(t => new Date(t.calculated_at).toLocaleDateString());
  const trendData = {
    labels: trendLabels,
    datasets: [
      { label: 'Overall Readiness', data: trends.map(t => t.placement_readiness_score), borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.3, pointRadius: 4 },
      { label: 'Aptitude', data: trends.map(t => t.aptitude_score), borderColor: '#059669', backgroundColor: 'transparent', tension: 0.3, pointRadius: 4 },
      { label: 'Interview', data: trends.map(t => t.interview_readiness_score), borderColor: '#EA580C', backgroundColor: 'transparent', tension: 0.3, pointRadius: 4 },
    ],
  };

  const barData = {
    labels: scores.map(s => s.label),
    datasets: [{
      label: 'Score',
      data: scores.map(s => current[s.key] || 0),
      backgroundColor: scores.map(s => s.color + 'BB'),
      borderColor: scores.map(s => s.color),
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">Placement Analytics</div>
          <div className="page-subtitle">Your comprehensive readiness analysis</div>
        </div>
        <button className="btn btn-primary" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
          {refreshMutation.isPending ? '⟳ Refreshing...' : '⟳ Refresh Score'}
        </button>
      </div>

      {/* Main score + sub gauges */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="analytics-score-row">
          <div style={{ textAlign: 'center' }}>
            <svg width="180" height="180">
              <circle cx="90" cy="90" r="78" fill="none" stroke="#E2E8F0" strokeWidth="12" />
              <circle cx="90" cy="90" r="78" fill="none"
                stroke={current.placementReadinessScore >= 80 ? '#059669' : current.placementReadinessScore >= 60 ? '#D97706' : '#DC2626'}
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 78}
                strokeDashoffset={2 * Math.PI * 78 - (Math.min(current.placementReadinessScore || 0, 100) / 100) * 2 * Math.PI * 78}
                strokeLinecap="round" transform="rotate(-90 90 90)"
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
              <text x="90" y="82" textAnchor="middle" fontSize="36" fontWeight="800" fill="#0F172A" fontFamily="Space Grotesk">{(current.placementReadinessScore || 0).toFixed(0)}</text>
              <text x="90" y="102" textAnchor="middle" fontSize="12" fill="#94A3B8" fontFamily="Inter">Readiness Score</text>
            </svg>
          </div>
          <div className="analytics-gauges-grid">
            {scores.map(s => (
              <ScoreGauge key={s.key} score={current[s.key] || 0} label={s.label} color={s.color} />
            ))}
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Score Distribution</h3></div>
          <div className="chart-container">
            <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 12 } } } } }} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Score Breakdown</h3></div>
          <div className="chart-container"><Bar data={barData} options={chartOpts} /></div>
        </div>
      </div>

      {trends.length > 1 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3 className="card-title">Progress Trend</h3></div>
          <div className="chart-container" style={{ height: 250 }}>
            <Line data={trendData} options={{ ...chartOpts, plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12 } } } }} />
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">💪 Strengths</h3></div>
          {current.strengthAreas?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {current.strengthAreas.map(area => (
                <div key={area} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--color-success-light)', borderRadius: 8, color: 'var(--color-success)', fontWeight: 500, fontSize: 14 }}>
                  ✅ {area}
                </div>
              ))}
            </div>
          ) : <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Build your profile to identify strengths</div>}
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">🚧 Areas to Improve</h3></div>
          {current.weakAreas?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {current.weakAreas.map(area => (
                <div key={area} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--color-warning-light)', borderRadius: 8, color: 'var(--color-warning)', fontWeight: 500, fontSize: 14 }}>
                  ⚠️ {area}
                </div>
              ))}
            </div>
          ) : <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No weak areas — excellent work! 🎉</div>}
        </div>
      </div>

      {/* Recommendations */}
      {current.recommendations?.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header"><h3 className="card-title">💡 Recommendations</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {current.recommendations.map((rec, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: 'var(--color-primary-light)', borderRadius: 8, border: '1px solid #BFDBFE' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                <span style={{ fontSize: 14, color: 'var(--color-primary)', fontWeight: 500 }}>{rec.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
