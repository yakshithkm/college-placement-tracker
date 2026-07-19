import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Award, Medal, ExternalLink } from 'lucide-react';

const emptyForm = { name: '', provider: '', issueDate: '', expiryDate: '', credentialId: '', verificationUrl: '' };

function CertModal({ cert, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(cert ? { ...cert, issueDate: cert.issue_date?.slice(0,10), expiryDate: cert.expiry_date?.slice(0,10) || '' } : emptyForm);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const mutation = useMutation({
    mutationFn: (data) => cert ? certsAPI.update(cert.id, data) : certsAPI.create(data),
    onSuccess: () => { toast.success(cert ? 'Updated!' : 'Certification added!'); qc.invalidateQueries(['certs']); onClose(); },
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{cert ? 'Edit Certification' : 'Add Certification'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Certification Name <span className="required">*</span></label>
              <input className="form-input" required value={form.name} onChange={set('name')} placeholder="e.g. AWS Solutions Architect" />
            </div>
            <div className="form-group">
              <label className="form-label">Provider / Issuer <span className="required">*</span></label>
              <input className="form-input" required value={form.provider} onChange={set('provider')} placeholder="e.g. Amazon Web Services" />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Issue Date <span className="required">*</span></label>
                <input className="form-input" type="date" required value={form.issueDate} onChange={set('issueDate')} />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input className="form-input" type="date" value={form.expiryDate} onChange={set('expiryDate')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Credential ID</label>
              <input className="form-input" value={form.credentialId} onChange={set('credentialId')} placeholder="e.g. ABC-123-XYZ" />
            </div>
            <div className="form-group">
              <label className="form-label">Verification URL</label>
              <input className="form-input" type="url" value={form.verificationUrl} onChange={set('verificationUrl')} placeholder="https://..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : cert ? 'Update' : 'Add Certification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const providerColors = {
  'Amazon': '#FF9900', 'AWS': '#FF9900', 'Google': '#4285F4', 'Microsoft': '#00A4EF',
  'Coursera': '#0056D3', 'Udemy': '#A435F0', 'Meta': '#0866FF', 'Oracle': '#F80000',
};

function getCertColor(provider) {
  for (const [key, color] of Object.entries(providerColors)) {
    if (provider?.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#2563EB';
}

export default function CertificationsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['certs'],
    queryFn: () => certsAPI.getAll().then(r => r.data.data),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => certsAPI.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['certs']); },
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">Certifications</div>
          <div className="page-subtitle">Track your professional certifications and courses</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Certification</button>
      </div>

      {isLoading ? (
        <div className="page-loading"><div className="loading-spinner" /></div>
      ) : certs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Award /></div>
            <h3>No certifications yet</h3>
            <p>Add certifications to validate your skills and boost your placement score</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal('add')}>Add Certification</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {certs.map(c => {
            const color = getCertColor(c.provider);
            const isExpired = c.expiry_date && new Date(c.expiry_date) < new Date();
            return (
              <div key={c.id} className="card" style={{ borderLeft: `4px solid ${color}`, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}><Medal size={22} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: 13, color, fontWeight: 600, marginBottom: 6 }}>{c.provider}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Issued: {new Date(c.issue_date).toLocaleDateString()}
                      {c.expiry_date && <> · Expires: <span style={{ color: isExpired ? 'var(--color-danger)' : 'inherit' }}>{new Date(c.expiry_date).toLocaleDateString()}</span></>}
                    </div>
                    {c.credential_id && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>ID: {c.credential_id}</div>}
                  </div>
                </div>
                {isExpired && <span className="badge badge-red" style={{ marginTop: 10, display: 'inline-flex' }}>Expired</span>}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {c.verification_url && <a href={c.verification_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ExternalLink size={14} /> Verify</a>}
                  <button className="btn btn-secondary btn-sm" onClick={() => setModal(c)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete?') && deleteMutation.mutate(c.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <CertModal cert={modal === 'add' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
