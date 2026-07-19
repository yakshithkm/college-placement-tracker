import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { aptitudeTestAPI } from '../../services/api';
import { BarChart3, ClipboardList, HelpCircle, Award, Timer, BookOpen } from 'lucide-react';
import { getCategoryIcon } from '../../utils/categoryIcon';

export default function AptitudeTestListPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['apt-categories'],
    queryFn: () => aptitudeTestAPI.getCategories().then(r => r.data.data),
  });

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['apt-tests', activeCategory],
    queryFn: () => aptitudeTestAPI.getTests(activeCategory ? { categoryId: activeCategory, active: 'true' } : { active: 'true' }).then(r => r.data.data),
  });

  return (
    <div>
      <div className="page-title">Aptitude Test Module</div>
      <div className="page-subtitle">Practice real exam-style tests and track your performance</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <a href="/aptitude-tests/history" onClick={(e) => { e.preventDefault(); navigate('/aptitude-tests/history'); }} className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><BarChart3 size={15} /> My History &amp; Analytics</a>
      </div>

      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          className="btn btn-sm"
          style={{ background: !activeCategory ? 'var(--color-primary)' : 'var(--bg-tertiary)', color: !activeCategory ? 'white' : 'var(--text-primary)', border: 'none' }}
          onClick={() => setActiveCategory('')}
        >
          All categories
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            className="btn btn-sm"
            style={{ background: activeCategory === c.id ? c.color : 'var(--bg-tertiary)', color: activeCategory === c.id ? 'white' : 'var(--text-primary)', border: 'none' }}
            onClick={() => setActiveCategory(c.id)}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{getCategoryIcon(c.name, { size: 15 })} {c.name} <span style={{ opacity: 0.8 }}>({c.test_count})</span></span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="page-loading"><div className="loading-spinner" /></div>
      ) : tests.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon"><ClipboardList /></div>
          <h3>No tests available</h3>
          <p>Check back soon for new aptitude tests</p>
        </div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {tests.map(t => (
            <div key={t.id} className="card" style={{ borderTop: `3px solid ${t.category_color || '#2563EB'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ color: t.category_color || '#2563EB' }}>{getCategoryIcon(t.category_name, { size: 26 })}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.category_name || 'Mixed categories'}</div>
                </div>
              </div>
              {t.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>{t.description}</p>}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className="badge badge-blue" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><HelpCircle size={13} /> {t.actual_question_count} questions</span>
                <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Award size={13} /> {t.total_marks} marks</span>
                {t.timer_enabled && <span className="badge badge-yellow" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Timer size={13} /> {t.duration_minutes} min</span>}
                {t.allow_practice_mode && <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><BookOpen size={13} /> Practice available</span>}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {t.timer_enabled && (
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/aptitude-tests/take/${t.id}?mode=timed`)}>
                    <Timer size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> Start Timed
                  </button>
                )}
                {t.allow_practice_mode && (
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/aptitude-tests/take/${t.id}?mode=practice`)}>
                    <BookOpen size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> Practice Mode
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}