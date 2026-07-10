import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aptitudeAPI } from '../services/api';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const emptyForm = { testName: '', testDate: '', quantitative: '', logical: '', verbal: '', maxScore: 300, percentile: '', notes: '' };

export default function AptitudePage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data, isLoading } = useQuery({
    queryKey: ['aptitude'],
    queryFn: () => aptitudeAPI.getAll().then(r => r.data),
  });

  const scores = data?.data || [];
  const stats = data?.stats || {};

  const addMutation = useMutation({
    mutationFn: (d) => aptitudeAPI.create(d),
    onSuccess: () => { toast.success('Score added!'); qc.invalidateQueries(['aptitude']); setForm(emptyForm); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => aptitudeAPI.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['aptitude']); },
  });

  const chartColors = {
    quantitative: 'rgba(37, 99, 235, 0.8)',
    logical: 'rgba(5, 150, 105, 0.8)',
    verbal: 'rgba(124, 58, 237, 0.8)',
  };

  const barData = {
    labels: ['Quantitative', 'Logical', 'Verbal'],
    datasets: [{
      label: 'Average Score',
      data: [
        parseFloat(stats.avg_quant || 0).toFixed(1),
        parseFloat(stats.avg_logical || 0).toFixed(1),
        parseFloat(stats.avg_verbal || 0).toFixed(1),
      ],
      backgroundColor: Object.values(chartColors),
      borderRadius: 6,
    }],
  };

  const trendLabels = scores.slice().reverse().map(s => new Date(s.test_date).toLocaleDateString());
  const trendData = {
    labels: trendLabels,
    datasets: [{
      label: 'Overall %',
      data: scores.slice().reverse().map(s => s.max_score ? ((s.total_score / s.max_score) * 100).toFixed(1) : 0),
      borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)',
      tension: 0.3, fill: true, pointRadius: 5,
    }],
  };

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">Aptitude Tests</div>
          <div className="page-subtitle">Track your quantitative, logical, and verbal performance</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '× Cancel' : '+ Log Score'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3 className="card-title">Log Aptitude Score</h3></div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Test Name</label>
              <input className="form-input" value={form.testName} onChange={set('testName')} placeholder="e.g. TCS NQT Mock" />
            </div>
            <div className="form-group">
              <label className="form-label">Test Date <span className="required">*</span></label>
              <input className="form-input" type="date" required value={form.testDate} onChange={set('testDate')} />
            </div>
          </div>
          <div className="grid-4">
            {['quantitative', 'logical', 'verbal'].map(k => (
              <div key={k} className="form-group">
                <label className="form-label" style={{ textTransform: 'capitalize' }}>{k}</label>
                <input className="form-input" type="number" min="0" value={form[k]} onChange={set(k)} placeholder="0-100" />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Percentile</label>
              <input className="form-input" type="number" min="0" max="100" value={form.percentile} onChange={set('percentile')} placeholder="e.g. 85" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" value={form.notes} onChange={set('notes')} placeholder="Any observations about this test..." />
          </div>
          <button className="btn btn-primary" onClick={() => form.testDate && addMutation.mutate(form)} disabled={addMutation.isPending}>
            {addMutation.isPending ? 'Saving...' : 'Save Score'}
          </button>
        </div>
      )}

      {/* Charts */}
      {scores.length > 0 && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Category Averages</h3></div>
            <div className="chart-container"><Bar data={barData} options={chartOpts} /></div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Score Trend</h3></div>
            <div className="chart-container"><Line data={trendData} options={chartOpts} /></div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      {scores.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Avg Quantitative', val: parseFloat(stats.avg_quant || 0).toFixed(1), color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Avg Logical', val: parseFloat(stats.avg_logical || 0).toFixed(1), color: '#059669', bg: '#ECFDF5' },
            { label: 'Avg Verbal', val: parseFloat(stats.avg_verbal || 0).toFixed(1), color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Best Overall %', val: parseFloat(stats.best_pct || 0).toFixed(1) + '%', color: '#EA580C', bg: '#FFF7ED' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">Score History</h3></div>
        {isLoading ? (
          <div className="page-loading"><div className="loading-spinner" /></div>
        ) : scores.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧮</div>
            <h3>No scores recorded</h3>
            <p>Start logging your aptitude test results</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Test Name</th><th>Quant</th><th>Logical</th><th>Verbal</th><th>Overall %</th><th>Percentile</th><th></th></tr>
              </thead>
              <tbody>
                {scores.map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.test_date).toLocaleDateString()}</td>
                    <td>{s.test_name || '—'}</td>
                    <td>{s.quantitative ?? '—'}</td>
                    <td>{s.logical ?? '—'}</td>
                    <td>{s.verbal ?? '—'}</td>
                    <td>
                      <strong style={{ color: s.total_score / s.max_score > 0.7 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {s.max_score ? ((s.total_score / s.max_score) * 100).toFixed(1) + '%' : '—'}
                      </strong>
                    </td>
                    <td>{s.percentile ? s.percentile + 'th' : '—'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete?') && deleteMutation.mutate(s.id)}>🗑</button>
                    </td>
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
