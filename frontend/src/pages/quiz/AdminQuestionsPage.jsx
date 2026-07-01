import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aptitudeTestAPI } from '../../services/api';
import toast from 'react-hot-toast';

const emptyForm = { categoryId: '', questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', explanation: '', difficulty: 'medium', marks: 1, negativeMarks: 0 };

function QuestionModal({ question, categories, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(question ? {
    categoryId: question.category_id, questionText: question.question_text,
    optionA: question.option_a, optionB: question.option_b, optionC: question.option_c, optionD: question.option_d,
    correctAnswer: question.correct_answer, explanation: question.explanation || '',
    difficulty: question.difficulty, marks: question.marks, negativeMarks: question.negative_marks,
  } : emptyForm);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (data) => question ? aptitudeTestAPI.updateQuestion(question.id, data) : aptitudeTestAPI.createQuestion(data),
    onSuccess: () => { toast.success(question ? 'Question updated!' : 'Question added!'); qc.invalidateQueries(['apt-admin-questions']); onClose(); },
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2 className="modal-title">{question ? 'Edit Question' : 'Add Question'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Category <span className="required">*</span></label>
              <select className="form-select" required value={form.categoryId} onChange={set('categoryId')}>
                <option value="">Select category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Question Text <span className="required">*</span></label>
              <textarea className="form-textarea" required value={form.questionText} onChange={set('questionText')} rows={2} placeholder="Enter the question..." />
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Option A <span className="required">*</span></label><input className="form-input" required value={form.optionA} onChange={set('optionA')} /></div>
              <div className="form-group"><label className="form-label">Option B <span className="required">*</span></label><input className="form-input" required value={form.optionB} onChange={set('optionB')} /></div>
              <div className="form-group"><label className="form-label">Option C <span className="required">*</span></label><input className="form-input" required value={form.optionC} onChange={set('optionC')} /></div>
              <div className="form-group"><label className="form-label">Option D <span className="required">*</span></label><input className="form-input" required value={form.optionD} onChange={set('optionD')} /></div>
            </div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="form-label">Correct Answer <span className="required">*</span></label>
                <select className="form-select" required value={form.correctAnswer} onChange={set('correctAnswer')}>
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-select" value={form.difficulty} onChange={set('difficulty')}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Marks</label>
                <input className="form-input" type="number" min="1" value={form.marks} onChange={set('marks')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Negative Marks (optional)</label>
              <input className="form-input" type="number" step="0.25" min="0" value={form.negativeMarks} onChange={set('negativeMarks')} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Explanation</label>
              <textarea className="form-textarea" value={form.explanation} onChange={set('explanation')} rows={2} placeholder="Explain why the correct answer is right..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : question ? 'Update' : 'Add Question'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkImportModal({ onClose }) {
  const qc = useQueryClient();
  const [jsonText, setJsonText] = useState(`[
  {
    "categoryId": "PASTE_CATEGORY_ID_HERE",
    "questionText": "Sample question?",
    "optionA": "Option A", "optionB": "Option B", "optionC": "Option C", "optionD": "Option D",
    "correctAnswer": "A",
    "explanation": "Why A is correct.",
    "difficulty": "easy",
    "marks": 1,
    "negativeMarks": 0
  }
]`);

  const mutation = useMutation({
    mutationFn: (questions) => aptitudeTestAPI.bulkImportQuestions(questions),
    onSuccess: (res) => { toast.success(res.data.message); qc.invalidateQueries(['apt-admin-questions']); onClose(); },
    onError: () => toast.error('Invalid JSON or import failed'),
  });

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error('Must be an array');
      mutation.mutate(parsed);
    } catch {
      toast.error('Invalid JSON format');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2 className="modal-title">Bulk Import Questions (JSON)</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Paste a JSON array of question objects below. Each must include <code>categoryId</code>, options A-D, and <code>correctAnswer</code>.</p>
          <textarea className="form-textarea" style={{ fontFamily: 'monospace', fontSize: 12, height: 280 }} value={jsonText} onChange={e => setJsonText(e.target.value)} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleImport} disabled={mutation.isPending}>{mutation.isPending ? 'Importing...' : 'Import Questions'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminQuestionsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [filters, setFilters] = useState({ categoryId: '', difficulty: '', search: '' });

  const { data: categories = [] } = useQuery({
    queryKey: ['apt-categories'],
    queryFn: () => aptitudeTestAPI.getCategories().then(r => r.data.data),
  });

  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['apt-admin-questions', filters],
    queryFn: () => aptitudeTestAPI.getQuestions({
      categoryId: filters.categoryId || undefined,
      difficulty: filters.difficulty || undefined,
      search: filters.search || undefined,
      limit: 50,
    }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => aptitudeTestAPI.deleteQuestion(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['apt-admin-questions']); },
  });

  const questions = questionsData?.data || [];
  const difficultyColor = { easy: 'badge-green', medium: 'badge-yellow', hard: 'badge-red' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="page-title">Question Management</div>
          <div className="page-subtitle">Manage the aptitude question bank</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}>📥 Bulk Import (JSON)</button>
          <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Question</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: '1 1 200px' }} placeholder="Search questions..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
          <select className="form-select" style={{ flex: '0 1 200px' }} value={filters.categoryId} onChange={e => setFilters(f => ({ ...f, categoryId: e.target.value }))}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select className="form-select" style={{ flex: '0 1 160px' }} value={filters.difficulty} onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value }))}>
            <option value="">All difficulties</option>
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Questions ({questionsData?.pagination?.total ?? questions.length})</h3></div>
        {isLoading ? (
          <div className="page-loading"><div className="loading-spinner" /></div>
        ) : questions.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">❓</div><h3>No questions found</h3></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {questions.map(q => (
              <div key={q.id} style={{ padding: 14, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: q.category_color + '20', color: q.category_color }}>{q.category_name}</span>
                    <span className={`badge ${difficultyColor[q.difficulty]}`} style={{ textTransform: 'capitalize' }}>{q.difficulty}</span>
                    <span className="badge badge-gray">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setModal(q)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete?') && deleteMutation.mutate(q.id)}>🗑</button>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{q.question_text}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Correct: <strong style={{ color: 'var(--color-success)' }}>{q.correct_answer}</strong> — {q[`option_${q.correct_answer.toLowerCase()}`]}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && <QuestionModal question={modal === 'add' ? null : modal} categories={categories} onClose={() => setModal(null)} />}
      {showImport && <BulkImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}