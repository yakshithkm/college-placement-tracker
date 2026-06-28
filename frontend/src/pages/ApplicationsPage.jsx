import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  applied: { label: 'Applied', class: 'badge-blue', icon: '📤' },
  test_cleared: { label: 'Test Cleared', class: 'badge-yellow', icon: '✅' },
  interview_scheduled: { label: 'Interview Scheduled', class: 'badge-purple', icon: '📅' },
  selected: { label: 'Selected 🎉', class: 'badge-green', icon: '🎊' },
  rejected: { label: 'Rejected', class: 'badge-red', icon: '❌' },
};

const emptyForm = { companyName: '', role: '', appliedDate: '', status: 'applied', notes: '' };

function AppModal({ app, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(app ? {
    ...app,
    companyName: app.company_name || '',
    appliedDate: app.applied_date?.slice(0, 10),
  } : emptyForm);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (data) => app ? applicationsAPI.update(app.id, data) : applicationsAPI.create(data),
    onSuccess: () => { toast.success(app ? 'Updated!' : 'Application added!'); qc.invalidateQueries(['applications']); onClose(); },
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{app ? 'Update Application' : 'Add Application'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Company <span className="required">*</span></label>
              <input className="form-input" required value={form.companyName} onChange={set('companyName')} placeholder="e.g. TechCorp Solutions" />
            </div>
            <div className="form-group">
              <label className="form-label">Role <span className="required">*</span></label>
              <input className="form-input" required value={form.role} onChange={set('role')} placeholder="e.g. Software Engineer" />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Applied Date</label>
                <input className="form-input" type="date" value={form.appliedDate} onChange={set('appliedDate')} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={set('status')}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            {form.status === 'selected' && (
              <div className="form-group">
                <label className="form-label">Package Offered (LPA)</label>
                <input className="form-input" type="number" step="0.1" value={form.packageOffered || ''} onChange={set('packageOffered')} placeholder="e.g. 8.5" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={set('notes')} rows={3} placeholder="Job description link, referral info, etc." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : app ? 'Update' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['applications', filter],
    queryFn: () => applicationsAPI.getAll(filter ? { status: filter } : {}).then(r => r.data),
  });

  const apps = data?.data || [];
  const statsRaw = data?.stats || [];
  const statsByStatus = Object.fromEntries(statsRaw.map(s => [s.status, parseInt(s.count)]));

  const deleteMutation = useMutation({
    mutationFn: (id) => applicationsAPI.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['applications']); },
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="page-title">Placement Applications</div>
          <div className="page-subtitle">Track your job applications and their progress</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Application</button>
      </div>

      {/* Status summary */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <div key={k} className="stat-card" style={{ cursor: 'pointer', border: filter === k ? '2px solid var(--color-primary)' : undefined }}
            onClick={() => setFilter(filter === k ? '' : k)}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{v.icon}</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{statsByStatus[k] || 0}</div>
            <div className="stat-label">{v.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {filter ? `${STATUS_CONFIG[filter]?.label} Applications` : `All Applications`}
            {filter && <button onClick={() => setFilter('')} className="btn btn-secondary btn-sm" style={{ marginLeft: 12 }}>Clear filter</button>}
          </h3>
        </div>

        {isLoading ? (
          <div className="page-loading"><div className="loading-spinner" /></div>
        ) : apps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No applications {filter ? 'with this status' : 'yet'}</h3>
            <p>Start tracking your placement applications</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal('add')}>Add Application</button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Company</th><th>Role</th><th>Applied</th><th>Status</th><th>Package</th><th>Notes</th><th></th></tr>
              </thead>
              <tbody>
                {apps.map(a => {
                  const cfg = STATUS_CONFIG[a.status] || {};
                  return (
                    <tr key={a.id}>
                      <td><strong>{a.company_name || a.company_full_name || '—'}</strong></td>
                      <td>{a.role}</td>
                      <td>{new Date(a.applied_date).toLocaleDateString()}</td>
                      <td><span className={`badge ${cfg.class}`}>{cfg.icon} {cfg.label}</span></td>
                      <td>{a.package_offered ? `${a.package_offered} LPA` : '—'}</td>
                      <td style={{ maxWidth: 140, fontSize: 12, color: 'var(--text-muted)' }}>{a.notes?.slice(0, 50) || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(a)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete?') && deleteMutation.mutate(a.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <AppModal app={modal === 'add' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
