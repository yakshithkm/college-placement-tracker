import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Code2, Star, Github, ExternalLink } from 'lucide-react';

const emptyForm = { title: '', description: '', technologies: '', githubUrl: '', liveUrl: '', startDate: '', endDate: '', isFeatured: false };

function ProjectModal({ project, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(project ? {
    ...project,
    technologies: (project.technologies || []).join(', '),
  } : emptyForm);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const mutation = useMutation({
    mutationFn: (data) => project ? projectsAPI.update(project.id, data) : projectsAPI.create(data),
    onSuccess: () => {
      toast.success(project ? 'Project updated!' : 'Project added!');
      qc.invalidateQueries(['projects']);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      technologies: form.technologies ? form.technologies.split(',').map(t => t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{project ? 'Edit Project' : 'Add Project'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project Title <span className="required">*</span></label>
              <input className="form-input" required value={form.title} onChange={set('title')} placeholder="e.g. College Placement Tracker" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={set('description')} placeholder="Describe what the project does, your role, and key achievements..." rows={4} />
            </div>
            <div className="form-group">
              <label className="form-label">Technologies Used</label>
              <input className="form-input" value={form.technologies} onChange={set('technologies')} placeholder="React, Node.js, PostgreSQL, Docker (comma separated)" />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <input className="form-input" type="url" value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/..." />
              </div>
              <div className="form-group">
                <label className="form-label">Live URL</label>
                <input className="form-input" type="url" value={form.liveUrl} onChange={set('liveUrl')} placeholder="https://..." />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input className="form-input" type="date" value={form.startDate?.slice(0,10) || ''} onChange={set('startDate')} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input className="form-input" type="date" value={form.endDate?.slice(0,10) || ''} onChange={set('endDate')} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} />
              Mark as Featured Project
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : project ? 'Update Project' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'add' | project object

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll().then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => projectsAPI.delete(id),
    onSuccess: () => { toast.success('Project deleted'); qc.invalidateQueries(['projects']); },
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">Projects</div>
          <div className="page-subtitle">Showcase your technical work and achievements</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Project</button>
      </div>

      {isLoading ? (
        <div className="page-loading"><div className="loading-spinner" /></div>
      ) : projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Code2 /></div>
            <h3>No projects yet</h3>
            <p>Add your projects to strengthen your placement profile</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal('add')}>Add Your First Project</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {projects.map(p => (
            <div key={p.id} className="card" style={{ position: 'relative', borderTop: p.is_featured ? '3px solid var(--color-primary)' : undefined }}>
              {p.is_featured && (
                <div style={{ position: 'absolute', top: -1, right: 16 }}>
                  <span className="badge badge-blue" style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}><Star size={12} /> Featured</span>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 12 }}>
                  {p.description || 'No description provided'}
                </p>
                {p.technologies?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {p.technologies.map(t => (
                      <span key={t} className="badge badge-gray" style={{ fontSize: 11 }}>{t}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Github size={14} /> GitHub</a>}
                  {p.live_url && <a href={p.live_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ExternalLink size={14} /> Live</a>}
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setModal(p)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete project?') && deleteMutation.mutate(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <ProjectModal project={modal === 'add' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
