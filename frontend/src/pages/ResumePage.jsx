import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumesAPI } from '../services/api';
import toast from 'react-hot-toast';

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ResumePage() {
  const qc = useQueryClient();
  const fileRef = useRef();
  const [versionName, setVersionName] = useState('');
  const [dragging, setDragging] = useState(false);

  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumesAPI.getAll().then(r => r.data.data),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, name }) => {
      const fd = new FormData();
      fd.append('resume', file);
      fd.append('versionName', name || `Resume ${new Date().toLocaleDateString()}`);
      return resumesAPI.upload(fd);
    },
    onSuccess: () => { toast.success('Resume uploaded!'); qc.invalidateQueries(['resumes']); setVersionName(''); },
  });

  const activateMutation = useMutation({
    mutationFn: (id) => resumesAPI.setActive(id),
    onSuccess: () => { toast.success('Active resume set'); qc.invalidateQueries(['resumes']); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => resumesAPI.delete(id),
    onSuccess: () => { toast.success('Resume deleted'); qc.invalidateQueries(['resumes']); },
  });

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Only PDF files accepted'); return; }
    uploadMutation.mutate({ file, name: versionName || file.name.replace('.pdf', '') });
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <div className="page-title">Resume Management</div>
      <div className="page-subtitle">Upload and manage multiple resume versions</div>

      {/* Upload zone */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3 className="card-title">Upload New Resume</h3></div>
        <div className="form-group" style={{ maxWidth: 400 }}>
          <label className="form-label">Version Name</label>
          <input className="form-input" value={versionName} onChange={e => setVersionName(e.target.value)} placeholder="e.g. SDE Resume v2, Data Science Resume" />
        </div>
        <div
          style={{
            border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--border-color)'}`,
            borderRadius: 10,
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'var(--color-primary-light)' : 'var(--bg-secondary)',
            transition: 'all 0.15s',
          }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {uploadMutation.isPending ? 'Uploading...' : 'Drop your PDF here or click to browse'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>PDF files only · Max 10MB</div>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
        </div>
      </div>

      {/* Resume list */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Your Resumes ({resumes.length})</h3>
        </div>
        {isLoading ? (
          <div className="page-loading"><div className="loading-spinner" /></div>
        ) : resumes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h3>No resumes yet</h3>
            <p>Upload your first resume to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resumes.map(r => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                border: `1px solid ${r.is_active ? 'var(--color-primary)' : 'var(--border-color)'}`,
                borderRadius: 8,
                background: r.is_active ? 'var(--color-primary-light)' : 'var(--bg-primary)',
              }}>
                <div style={{ fontSize: 28 }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{r.version_name}</span>
                    {r.is_active && <span className="badge badge-blue">✓ Active</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatBytes(r.file_size)} · Uploaded {new Date(r.uploaded_at).toLocaleDateString()}
                    {r.score && <> · ATS Score: <strong>{r.score}</strong></>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={r.file_url} target="_blank" rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >👁 View</a>
                  {!r.is_active && (
                    <button className="btn btn-primary btn-sm" onClick={() => activateMutation.mutate(r.id)}>
                      Set Active
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => {
                    if (window.confirm('Delete this resume?')) deleteMutation.mutate(r.id);
                  }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
