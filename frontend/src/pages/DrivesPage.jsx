import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { drivesAPI, companiesAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  upcoming: 'badge-blue', active: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red',
};

function DriveModal({ onClose }) {
  const qc = useQueryClient();
  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: () => companiesAPI.getAll().then(r => r.data.data) });
  const [form, setForm] = useState({ companyId: '', title: '', role: '', packageLpa: '', description: '', status: 'upcoming', registrationDeadline: '', driveDate: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (data) => drivesAPI.create(data),
    onSuccess: () => { toast.success('Drive created!'); qc.invalidateQueries(['drives']); onClose(); },
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Create Placement Drive</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Company <span className="required">*</span></label>
              <select className="form-select" required value={form.companyId} onChange={set('companyId')}>
                <option value="">Select company...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Drive Title <span className="required">*</span></label>
              <input className="form-input" required value={form.title} onChange={set('title')} placeholder="e.g. TechCorp Campus Drive 2025" />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Role <span className="required">*</span></label>
                <input className="form-input" required value={form.role} onChange={set('role')} placeholder="Software Engineer" />
              </div>
              <div className="form-group">
                <label className="form-label">Package (LPA)</label>
                <input className="form-input" type="number" step="0.1" value={form.packageLpa} onChange={set('packageLpa')} placeholder="8.5" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={set('description')} rows={3} placeholder="Job description, eligibility, process..." />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Registration Deadline</label>
                <input className="form-input" type="datetime-local" value={form.registrationDeadline} onChange={set('registrationDeadline')} />
              </div>
              <div className="form-group">
                <label className="form-label">Drive Date</label>
                <input className="form-input" type="datetime-local" value={form.driveDate} onChange={set('driveDate')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={set('status')}>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Creating...' : 'Create Drive'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DrivesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(false);
  const isCoord = ['coordinator', 'admin'].includes(user?.role);

  const { data: drives = [], isLoading } = useQuery({
    queryKey: ['drives', filter],
    queryFn: () => drivesAPI.getAll(filter ? { status: filter } : {}).then(r => r.data.data),
  });

  const applyMutation = useMutation({
    mutationFn: ({ driveId, role }) => applicationsAPI.create({ driveId, role, appliedDate: new Date().toISOString().slice(0, 10) }),
    onSuccess: () => toast.success('Applied successfully!'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => drivesAPI.delete(id),
    onSuccess: () => { toast.success('Drive deleted'); qc.invalidateQueries(['drives']); },
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="page-title">Placement Drives</div>
          <div className="page-subtitle">Browse and apply to active placement drives</div>
        </div>
        {isCoord && <button className="btn btn-primary" onClick={() => setModal(true)}>+ Create Drive</button>}
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {[['', 'All'], ['upcoming', 'Upcoming'], ['active', 'Active'], ['completed', 'Completed']].map(([v, l]) => (
          <button key={v} className={`tab ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="page-loading"><div className="loading-spinner" /></div>
      ) : drives.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <h3>No drives found</h3>
          <p>{isCoord ? 'Create the first placement drive' : 'Check back soon for placement opportunities'}</p>
        </div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {drives.map(d => {
            const isPast = d.registration_deadline && new Date(d.registration_deadline) < new Date();
            return (
              <div key={d.id} className="card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏢</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{d.title}</h3>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{d.company_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.industry}</div>
                  </div>
                  <span className={`badge ${STATUS_COLORS[d.status]}`} style={{ textTransform: 'capitalize' }}>{d.status}</span>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span className="badge badge-green">💼 {d.role}</span>
                  {d.package_lpa && <span className="badge badge-purple">💰 {d.package_lpa} LPA</span>}
                  {d.application_count > 0 && <span className="badge badge-gray">👥 {d.application_count} applicants</span>}
                </div>

                {d.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>{d.description.slice(0, 120)}{d.description.length > 120 && '...'}</p>}

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                  {d.registration_deadline && <div>🗓 Deadline: {new Date(d.registration_deadline).toLocaleDateString()} {isPast && <span style={{ color: 'var(--color-danger)' }}>(Closed)</span>}</div>}
                  {d.drive_date && <div>📅 Drive: {new Date(d.drive_date).toLocaleDateString()}</div>}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {user?.role === 'student' && d.status === 'active' && !isPast && (
                    <button className="btn btn-primary btn-sm" onClick={() => applyMutation.mutate({ driveId: d.id, role: d.role })} disabled={applyMutation.isPending}>
                      Apply Now
                    </button>
                  )}
                  {isCoord && (
                    <button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete drive?') && deleteMutation.mutate(d.id)}>Delete</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <DriveModal onClose={() => setModal(false)} />}
    </div>
  );
}
