import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => studentsAPI.getProfile().then(r => r.data.data),
  });
  const { data: skills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: () => studentsAPI.getSkills().then(r => r.data.data),
  });
  const { data: semesters = [] } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => studentsAPI.getSemesters().then(r => r.data.data),
  });

  const [form, setForm] = useState({});
  const [newSkill, setNewSkill] = useState({ skillName: '', proficiencyLevel: 3, category: 'Programming' });
  const [semForm, setSemForm] = useState({ semester: '', year: '', sgpa: '' });

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        department: profile.department || '',
        batchYear: profile.batch_year || '',
        graduationYear: profile.graduation_year || '',
        cgpa: profile.cgpa || '',
        tenthPercentage: profile.tenth_percentage || '',
        twelfthPercentage: profile.twelfth_percentage || '',
        linkedinUrl: profile.linkedin_url || '',
        githubUrl: profile.github_url || '',
        portfolioUrl: profile.portfolio_url || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data) => studentsAPI.updateProfile(data),
    onSuccess: () => { toast.success('Profile updated!'); qc.invalidateQueries(['profile']); },
  });

  const addSkillMutation = useMutation({
    mutationFn: (data) => studentsAPI.addSkill(data),
    onSuccess: () => { toast.success('Skill added!'); qc.invalidateQueries(['skills']); setNewSkill({ skillName: '', proficiencyLevel: 3, category: 'Programming' }); },
  });

  const removeSkillMutation = useMutation({
    mutationFn: (id) => studentsAPI.removeSkill(id),
    onSuccess: () => { qc.invalidateQueries(['skills']); },
  });

  const addSemMutation = useMutation({
    mutationFn: (data) => studentsAPI.addSemester(data),
    onSuccess: () => { toast.success('Semester added!'); qc.invalidateQueries(['semesters']); setSemForm({ semester: '', year: '', sgpa: '' }); },
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  if (isLoading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  const skillCategories = ['Programming', 'Frontend', 'Backend', 'Database', 'DevOps', 'Tools', 'General'];
  const categoryColors = { Programming: '#2563EB', Frontend: '#7C3AED', Backend: '#059669', Database: '#EA580C', DevOps: '#0891B2', Tools: '#D97706', General: '#64748B' };

  return (
    <div>
      <div className="page-title">My Profile</div>
      <div className="page-subtitle">Keep your profile updated for the best placement readiness score</div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Personal Info */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Personal Information</h3></div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-input" value={form.firstName || ''} onChange={set('firstName')} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" value={form.lastName || ''} onChange={set('lastName')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone || ''} onChange={set('phone')} />
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-textarea" value={form.bio || ''} onChange={set('bio')} rows={3} placeholder="Tell us about yourself..." />
          </div>
          <div className="form-group">
            <label className="form-label">LinkedIn URL</label>
            <input className="form-input" value={form.linkedinUrl || ''} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/yourname" />
          </div>
          <div className="form-group">
            <label className="form-label">GitHub URL</label>
            <input className="form-input" value={form.githubUrl || ''} onChange={set('githubUrl')} placeholder="https://github.com/yourname" />
          </div>
          <div className="form-group">
            <label className="form-label">Portfolio URL</label>
            <input className="form-input" value={form.portfolioUrl || ''} onChange={set('portfolioUrl')} placeholder="https://yoursite.com" />
          </div>
        </div>

        {/* Academic Info */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Academic Details</h3></div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input className="form-input" value={form.department || ''} onChange={set('department')} placeholder="Computer Science and Engineering" />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Batch Year</label>
              <input className="form-input" type="number" value={form.batchYear || ''} onChange={set('batchYear')} placeholder="2021" />
            </div>
            <div className="form-group">
              <label className="form-label">Graduation Year</label>
              <input className="form-input" type="number" value={form.graduationYear || ''} onChange={set('graduationYear')} placeholder="2025" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">CGPA (out of 10)</label>
            <input className="form-input" type="number" step="0.01" min="0" max="10" value={form.cgpa || ''} onChange={set('cgpa')} placeholder="8.5" />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">10th % </label>
              <input className="form-input" type="number" step="0.1" value={form.tenthPercentage || ''} onChange={set('tenthPercentage')} placeholder="92.5" />
            </div>
            <div className="form-group">
              <label className="form-label">12th %</label>
              <input className="form-input" type="number" step="0.1" value={form.twelfthPercentage || ''} onChange={set('twelfthPercentage')} placeholder="88.0" />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <button className="btn btn-primary w-full" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : '💾 Save Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3 className="card-title">Technical Skills</h3>
        </div>
        <div className="skills-grid" style={{ marginBottom: 20 }}>
          {skills.map(skill => (
            <div key={skill.id} className="skill-tag">
              <span style={{ color: categoryColors[skill.category] || '#64748B', fontSize: 12, fontWeight: 600 }}>{skill.category}</span>
              <span>{skill.skill_name}</span>
              <div className="skill-dots">
                {[1,2,3,4,5].map(d => (
                  <div key={d} className={`skill-dot ${d <= skill.proficiency_level ? 'filled' : ''}`} />
                ))}
              </div>
              <button onClick={() => removeSkillMutation.mutate(skill.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          ))}
          {skills.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>No skills added yet</span>}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 160px' }}>
            <label className="form-label">Skill Name</label>
            <input className="form-input" value={newSkill.skillName} onChange={e => setNewSkill(s => ({ ...s, skillName: e.target.value }))} placeholder="e.g. React.js" />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 140px' }}>
            <label className="form-label">Category</label>
            <select className="form-select" value={newSkill.category} onChange={e => setNewSkill(s => ({ ...s, category: e.target.value }))}>
              {skillCategories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 120px' }}>
            <label className="form-label">Level (1-5)</label>
            <input className="form-input" type="number" min="1" max="5" value={newSkill.proficiencyLevel} onChange={e => setNewSkill(s => ({ ...s, proficiencyLevel: parseInt(e.target.value) }))} />
          </div>
          <button className="btn btn-primary" onClick={() => newSkill.skillName && addSkillMutation.mutate(newSkill)}>
            + Add Skill
          </button>
        </div>
      </div>

      {/* Semester Results */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">Semester Results</h3></div>
        <div className="table-container" style={{ marginBottom: 20 }}>
          <table className="table">
            <thead><tr><th>Semester</th><th>Year</th><th>SGPA</th></tr></thead>
            <tbody>
              {semesters.map(s => (
                <tr key={s.id}><td>Semester {s.semester}</td><td>{s.year}</td><td><strong>{s.sgpa}</strong></td></tr>
              ))}
              {semesters.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No semester data</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {['semester', 'year', 'sgpa'].map(k => (
            <div key={k} className="form-group" style={{ marginBottom: 0, flex: '1 1 120px' }}>
              <label className="form-label" style={{ textTransform: 'capitalize' }}>{k}</label>
              <input className="form-input" type="number" step={k === 'sgpa' ? '0.01' : '1'} value={semForm[k]} onChange={e => setSemForm(f => ({ ...f, [k]: e.target.value }))} placeholder={k === 'sgpa' ? '8.5' : k === 'semester' ? '1-8' : '2023'} />
            </div>
          ))}
          <button className="btn btn-primary" onClick={() => semForm.semester && semForm.year && addSemMutation.mutate(semForm)}>
            + Add Semester
          </button>
        </div>
      </div>
    </div>
  );
}
