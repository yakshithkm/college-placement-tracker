import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { aptitudeTestAPI } from '../../services/api';

export default function QuizResultPage() {
  const { attemptId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['apt-result', attemptId],
    queryFn: () => aptitudeTestAPI.getAttemptResult(attemptId).then(r => r.data.data),
  });

  if (isLoading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (!data) return null;

  const { attempt, answers, categoryBreakdown } = data;
  const passed = attempt.passed;
  const mins = Math.floor((attempt.time_taken_seconds || 0) / 60);
  const secs = (attempt.time_taken_seconds || 0) % 60;

  return (
    <div>
      <div className="page-title">{attempt.test_title} — Result</div>
      <div className="page-subtitle">Completed on {new Date(attempt.submitted_at).toLocaleString()}</div>

      <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: '32px 24px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 110, height: 110, borderRadius: '50%', marginBottom: 16,
          background: passed ? 'var(--color-success-light)' : 'var(--color-danger-light)',
          border: `4px solid ${passed ? 'var(--color-success)' : 'var(--color-danger)'}`,
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: passed ? 'var(--color-success)' : 'var(--color-danger)' }}>{attempt.percentage}%</div>
        </div>
        <h2 style={{ fontSize: 22, marginBottom: 6 }}>{passed ? '🎉 You Passed!' : '📚 Keep Practicing'}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          You scored <strong>{attempt.score}</strong> out of <strong>{attempt.total_marks}</strong> marks
          {' '}(Passing: {attempt.passing_marks})
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 24, flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-success)' }}>{attempt.correct_count}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Correct</div></div>
          <div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-danger)' }}>{attempt.wrong_count}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Wrong</div></div>
          <div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-muted)' }}>{attempt.skipped_count}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Skipped</div></div>
          <div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>{mins}m {secs}s</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Time Taken</div></div>
        </div>
      </div>

      {Object.keys(categoryBreakdown).length > 1 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3 className="card-title">Category-wise Performance</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(categoryBreakdown).map(([cat, stats]) => {
              const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 500 }}>{cat}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{stats.correct}/{stats.total} correct ({pct}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 70 ? 'var(--color-success)' : pct >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h3 className="card-title">Detailed Answer Review</h3></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {answers.map((a, idx) => {
            const status = !a.selected_answer ? 'skipped' : a.is_correct ? 'correct' : 'wrong';
            const statusConfig = {
              correct: { badge: 'badge-green', label: '✓ Correct', color: 'var(--color-success)' },
              wrong: { badge: 'badge-red', label: '✗ Wrong', color: 'var(--color-danger)' },
              skipped: { badge: 'badge-gray', label: '— Skipped', color: 'var(--text-muted)' },
            }[status];

            return (
              <div key={a.id} style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Q{idx + 1}. {a.category_name}</span>
                  <span className={`badge ${statusConfig.badge}`}>{statusConfig.label}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, lineHeight: 1.6 }}>{a.question_text}</div>

                <div className="grid-2-sm" style={{ marginBottom: 10 }}>
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const text = a[`option_${opt.toLowerCase()}`];
                    const isCorrectOpt = opt === a.correct_answer;
                    const isSelectedOpt = opt === a.selected_answer;
                    let bg = 'var(--bg-secondary)', border = 'var(--border-color)', textColor = 'var(--text-secondary)';
                    if (isCorrectOpt) { bg = 'var(--color-success-light)'; border = 'var(--color-success)'; textColor = 'var(--color-success)'; }
                    else if (isSelectedOpt && !isCorrectOpt) { bg = 'var(--color-danger-light)'; border = 'var(--color-danger)'; textColor = 'var(--color-danger)'; }
                    return (
                      <div key={opt} style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${border}`, background: bg, fontSize: 12, color: textColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong>{opt}.</strong> {text}
                        {isCorrectOpt && ' ✓'}
                        {isSelectedOpt && !isCorrectOpt && ' (your answer)'}
                      </div>
                    );
                  })}
                </div>

                {a.explanation && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 6, lineHeight: 1.6 }}>
                    💡 <strong>Explanation:</strong> {a.explanation}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                  Marks: <strong style={{ color: statusConfig.color }}>{a.marks_awarded > 0 ? '+' : ''}{a.marks_awarded}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <Link to="/aptitude-tests" className="btn btn-primary">← Back to Tests</Link>
        <Link to="/aptitude-tests/history" className="btn btn-secondary">📊 View My Analytics</Link>
      </div>
    </div>
  );
}