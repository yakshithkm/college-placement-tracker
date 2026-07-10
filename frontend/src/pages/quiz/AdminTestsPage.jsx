import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aptitudeTestAPI } from '../../services/api';
import toast from 'react-hot-toast';

const emptyForm = {
  title: '', description: '', categoryId: '', totalMarks: 10, passingMarks: 5,
  timerEnabled: true, durationMinutes: 30, allowPracticeMode: true,
  randomizeQuestions: false, randomizeOptions: false, questionIds: [],
};

function TestModal({ test, categories, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(test ? {
    title: test.title, description: test.description || '', categoryId: test.category_id || '',
    totalMarks: test.total_marks, passingMarks: test.passing_marks,
    timerEnabled: test.timer_enabled, durationMinutes: test.duration_minutes,
    allowPracticeMode: test.allow_practice_mode, randomizeQuestions: test.randomize_questions,
    randomizeOptions: test.randomize_options, questionIds: [],
  } : emptyForm);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const { data: questionsData } = useQuery({
    queryKey: ['apt-test-builder-questions', form.categoryId],
    queryFn: () => aptitudeTestAPI.getQuestions({ categoryId: form.categoryId || undefined, limit: 100 }).then(r => r.data.data),
    enabled: !test,
  });

  const mutation = useMutation({
    mutationFn: (data) => test ? aptitudeTestAPI.updateTest(test.id, data) : aptitudeTestAPI.createTest(data),
    onSuccess: () => { toast.success(test ? 'Test updated!' : 'Test created!'); qc.invalidateQueries(['apt-admin-tests']); onClose(); },
  });

  const toggleQuestion = (id) => {
    setForm(f => ({
      ...f,
      questionIds: f.questionIds.includes(id) ? f.questionIds.filter(x => x !== id) : [...f.questionIds, id],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      totalQuestions: test ? test.total_questions : form.questionIds.length,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h2 className="modal-title">{test ? 'Edit Test' : 'Create Test'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Test Title <span className="required">*</span></label>
              <input className="form-input" required value={form.title} onChange={set('title')} placeholder="e.g. Quantitative Aptitude — Level 2" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={set('description')} rows={2} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.categoryId} onChange={set('categoryId')}>
                <option value="">Mixed / All categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div className="form-grid form-grid-3">
              <div className="form-group"><label className="form-label">Total Marks</label><input className="form-input" type="number" value={form.totalMarks} onChange={set('totalMarks')} /></div>
              <div className="form-group"><label className="form-label">Passing Marks</label><input className="form-input" type="number" value={form.passingMarks} onChange={set('passingMarks')} /></div>
              <div className="form-group"><label className="form-label">Duration (min)</label><input className="form-input" type="number" value={form.durationMinutes} onChange={set('durationMinutes')} disabled={!form.timerEnabled} /></div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><input type="checkbox" checked={form.timerEnabled} onChange={set('timerEnabled')} /> Timer enabled</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><input type="checkbox" checked={form.allowPracticeMode} onChange={set('allowPracticeMode')} /> Allow practice mode</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><input type="checkbox" checked={form.randomizeQuestions} onChange={set('randomizeQuestions')} /> Randomize questions</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><input type="checkbox" checked={form.randomizeOptions} onChange={set('randomizeOptions')} /> Randomize options</label>
            </div>

            {!test && (
              <div className="form-group">
                <label className="form-label">Select Questions ({form.questionIds.length} selected)</label>
                <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8, padding: 10 }}>
                  {(questionsData || []).length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>No questions found for this category. Add questions first.</div>
                  ) : (questionsData || []).map(q => (
                    <label key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--border-color)', fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.questionIds.includes(q.id)} onChange={() => toggleQuestion(q.id)} style={{ marginTop: 2 }} />
                      <span>{q.question_text} <span className="badge badge-gray" style={{ marginLeft: 6, fontSize: 10 }}>{q.difficulty}</span></span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : test ? 'Update Test' : 'Create Test'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminTestsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['apt-categories'],
    queryFn: () => aptitudeTestAPI.getCategories().then(r => r.data.data),
  });

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['apt-admin-tests'],
    queryFn: () => aptitudeTestAPI.getTests().then(r => r.data.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['apt-admin-stats'],
    queryFn: () => aptitudeTestAPI.getAdminStats().then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => aptitudeTestAPI.deleteTest(id),
    onSuccess: () => { toast.success('Test deleted'); qc.invalidateQueries(['apt-admin-tests']); },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => aptitudeTestAPI.updateTest(id, { isActive }),
    onSuccess: () => qc.invalidateQueries(['apt-admin-tests']),
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">Test Management</div>
          <div className="page-subtitle">Create and configure aptitude tests</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Create Test</button>
      </div>

      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-primary)' }}>{stats.totalTests}</div><div className="stat-label">Active Tests</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-success)' }}>{stats.totalQuestions}</div><div className="stat-label">Total Questions</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: '#7C3AED' }}>{stats.totalAttempts}</div><div className="stat-label">Total Attempts</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-warning)' }}>{stats.avgScore}%</div><div className="stat-label">Avg Score (All Students)</div></div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h3 className="card-title">All Tests ({tests.length})</h3></div>
        {isLoading ? (
          <div className="page-loading"><div className="loading-spinner" /></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Title</th><th>Category</th><th>Questions</th><th>Marks</th><th>Timer</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {tests.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.title}</strong></td>
                    <td>{t.category_icon} {t.category_name || 'Mixed'}</td>
                    <td>{t.actual_question_count}</td>
                    <td>{t.total_marks} (pass: {t.passing_marks})</td>
                    <td>{t.timer_enabled ? `⏱ ${t.duration_minutes}m` : '🧘 Practice only'}</td>
                    <td>
                      <span className={`badge ${t.is_active ? 'badge-green' : 'badge-gray'}`} style={{ cursor: 'pointer' }}
                        onClick={() => toggleActiveMutation.mutate({ id: t.id, isActive: !t.is_active })}>
                        {t.is_active ? '✓ Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal(t)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete test?') && deleteMutation.mutate(t.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <TestModal test={modal === 'add' ? null : modal} categories={categories} onClose={() => setModal(null)} />}
    </div>
  );
}