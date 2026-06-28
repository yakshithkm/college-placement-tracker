import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewsAPI } from '../services/api';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const emptyForm = { interviewType: 'mock', interviewDate: '', company: '', interviewerName: '', communicationRating: '', technicalRating: '', hrRating: '', problemSolvingRating: '', feedback: '' };

function RatingInput({ label, name, value, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{label} (1-10)</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input className="form-input" type="number" min="1" max="10" value={value} onChange={onChange} placeholder="1-10" style={{ width: 80, flexShrink: 0 }} />
        <div style={{ flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(value || 0) * 10}%`, background: value >= 8 ? 'var(--color-success)' : value >= 5 ? 'var(--color-warning)' : 'var(--color-danger)', borderRadius: 4, transition: 'width 0.2s' }} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 28, textAlign: 'right' }}>{value || 0}/10</span>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data, isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => interviewsAPI.getAll().then(r => r.data),
  });

  const scores = data?.data || [];
  const stats = data?.stats || {};

  const addMutation = useMutation({
    mutationFn: (d) => interviewsAPI.create(d),
    onSuccess: () => { toast.success('Interview recorded!'); qc.invalidateQueries(['interviews']); setForm(emptyForm); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => interviewsAPI.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['interviews']); },
  });

  const radarData = {
    labels: ['Communication', 'Technical', 'HR Skills', 'Problem Solving'],
    datasets: [{
      label: 'Average Ratings',
      data: [
        parseFloat(stats.avg_comm || 0).toFixed(1),
        parseFloat(stats.avg_tech || 0).toFixed(1),
        parseFloat(stats.avg_hr || 0).toFixed(1),
        parseFloat(stats.avg_tech || 0).toFixed(1),
      ],
      backgroundColor: 'rgba(37, 99, 235, 0.2)',
      borderColor: '#2563EB',
      pointBackgroundColor: '#2563EB',
    }],
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="page-title">Interview Performance</div>
          <div className="page-subtitle">Track mock and real interview results to build readiness</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '× Cancel' : '+ Record Interview'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3 className="card-title">Record Interview</h3></div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Interview Type</label>
              <select className="form-select" value={form.interviewType} onChange={set('interviewType')}>
                <option value="mock">Mock Interview</option>
                <option value="technical">Technical Interview</option>
                <option value="hr">HR Interview</option>
                <option value="real">Real Interview</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date <span className="required">*</span></label>
              <input className="form-input" type="date" value={form.interviewDate} onChange={set('interviewDate')} />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-input" value={form.company} onChange={set('company')} placeholder="e.g. TechCorp (or mock)" />
            </div>
            <div className="form-group">
              <label className="form-label">Interviewer Name</label>
              <input className="form-input" value={form.interviewerName} onChange={set('interviewerName')} placeholder="Interviewer's name" />
            </div>
          </div>
          <div className="form-grid">
            <RatingInput label="Communication" value={form.communicationRating} onChange={set('communicationRating')} />
            <RatingInput label="Technical Skills" value={form.technicalRating} onChange={set('technicalRating')} />
            <RatingInput label="HR Skills" value={form.hrRating} onChange={set('hrRating')} />
            <RatingInput label="Problem Solving" value={form.problemSolvingRating} onChange={set('problemSolvingRating')} />
          </div>
          <div className="form-group">
            <label className="form-label">Feedback / Notes</label>
            <textarea className="form-textarea" value={form.feedback} onChange={set('feedback')} rows={3} placeholder="Areas of improvement, key feedback received..." />
          </div>
          <button className="btn btn-primary" onClick={() => form.interviewDate && addMutation.mutate(form)} disabled={addMutation.isPending}>
            {addMutation.isPending ? 'Saving...' : 'Save Interview'}
          </button>
        </div>
      )}

      {scores.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, marginBottom: 24 }}>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Skill Radar</h3></div>
            <div className="chart-container">
              <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 10, ticks: { stepSize: 2 } } } }} />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Performance Summary</h3></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Avg Communication', val: parseFloat(stats.avg_comm || 0).toFixed(1), color: '#2563EB' },
                { label: 'Avg Technical', val: parseFloat(stats.avg_tech || 0).toFixed(1), color: '#059669' },
                { label: 'Avg HR', val: parseFloat(stats.avg_hr || 0).toFixed(1), color: '#7C3AED' },
                { label: 'Avg Overall', val: parseFloat(stats.avg_overall || 0).toFixed(1), color: '#EA580C' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h3 className="card-title">Interview History</h3></div>
        {isLoading ? (
          <div className="page-loading"><div className="loading-spinner" /></div>
        ) : scores.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎤</div>
            <h3>No interviews recorded</h3>
            <p>Start logging mock interviews to track your readiness</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Date</th><th>Type</th><th>Company</th><th>Comm.</th><th>Technical</th><th>HR</th><th>Overall</th><th>Feedback</th><th></th></tr></thead>
              <tbody>
                {scores.map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.interview_date).toLocaleDateString()}</td>
                    <td><span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{s.interview_type}</span></td>
                    <td>{s.company || '—'}</td>
                    <td>{s.communication_rating ?? '—'}/10</td>
                    <td>{s.technical_rating ?? '—'}/10</td>
                    <td>{s.hr_rating ?? '—'}/10</td>
                    <td><strong style={{ color: s.overall_rating >= 7 ? 'var(--color-success)' : 'var(--color-warning)' }}>{s.overall_rating ? parseFloat(s.overall_rating).toFixed(1) : '—'}</strong></td>
                    <td style={{ maxWidth: 160, fontSize: 12, color: 'var(--text-muted)' }}>{s.feedback?.slice(0, 60) || '—'}{s.feedback?.length > 60 && '...'}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete?') && deleteMutation.mutate(s.id)}>🗑</button></td>
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
