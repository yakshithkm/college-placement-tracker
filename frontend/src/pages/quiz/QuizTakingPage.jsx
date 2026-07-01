import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { aptitudeTestAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function QuizTakingPage() {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'practice' ? 'practice' : 'timed';
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});       // questionId -> 'A'|'B'|'C'|'D'
  const [flagged, setFlagged] = useState({});        // questionId -> bool
  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  // ── Start / resume attempt ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await aptitudeTestAPI.startAttempt({ testId, mode });
        if (cancelled) return;
        const data = res.data.data;
        setAttemptId(data.attemptId);
        setQuestions(data.questions);

        const initAnswers = {};
        const initFlags = {};
        data.questions.forEach(q => {
          if (q.selected_answer) initAnswers[q.id] = q.selected_answer;
          if (q.is_flagged) initFlags[q.id] = true;
        });
        setAnswers(initAnswers);
        setFlagged(initFlags);

        if (mode === 'timed' && data.durationMinutes) {
          setSecondsLeft(data.durationMinutes * 60);
        }
        startTimeRef.current = Date.now();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not start test');
        navigate('/aptitude-tests');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, mode]);

  // ── Submit logic ──────────────────────────────────────────────────────────
  const doSubmit = useCallback(async (auto = false) => {
    clearTimeout(timerRef.current);
    const timeTakenSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      await aptitudeTestAPI.submitAttempt(attemptId, { timeTakenSeconds });
      toast.success(auto ? 'Time up! Test auto-submitted.' : 'Test submitted successfully!');
      navigate(`/aptitude-tests/result/${attemptId}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
      setSubmitting(false);
    }
  }, [attemptId, navigate]);

  // ── Countdown timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'timed' || secondsLeft === null || submitting) return;
    if (secondsLeft <= 0) {
      setSubmitting(true);
      doSubmit(true);
      return;
    }
    timerRef.current = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, mode, submitting]);

  // ── Warn before leaving / refresh ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const saveAnswer = useCallback((questionId, value, flagValue) => {
    aptitudeTestAPI.saveAnswer(attemptId, {
      questionId,
      selectedAnswer: value,
      isFlagged: flagValue,
    }).catch(() => {});
  }, [attemptId]);

  const selectAnswer = (questionId, option) => {
    setAnswers(prev => {
      const next = { ...prev, [questionId]: option };
      saveAnswer(questionId, option, !!flagged[questionId]);
      return next;
    });
  };

  const toggleFlag = (questionId) => {
    setFlagged(prev => {
      const next = { ...prev, [questionId]: !prev[questionId] };
      saveAnswer(questionId, answers[questionId] || null, next[questionId]);
      return next;
    });
  };

  const onSubmitClick = () => {
    if (submitting) return;
    setSubmitting(true);
    doSubmit(false);
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (questions.length === 0) return <div className="card"><div className="empty-state"><h3>No questions found</h3></div></div>;

  const current = questions[currentIdx];
  const answeredCount = Object.keys(answers).filter(k => answers[k]).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  const getStatus = (idx) => {
    const q = questions[idx];
    if (flagged[q.id]) return 'flagged';
    if (answers[q.id]) return 'answered';
    return 'unanswered';
  };

  const statusColors = {
    answered: { bg: 'var(--color-success)', color: 'white' },
    flagged: { bg: 'var(--color-warning)', color: 'white' },
    unanswered: { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
    current: { bg: 'var(--color-primary)', color: 'white' },
  };

  return (
    <div>
      {/* Sticky header: title, progress, timer */}
      <div className="card" style={{ position: 'sticky', top: 0, zIndex: 10, marginBottom: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Question {currentIdx + 1} of {questions.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {mode === 'timed' ? '⏱ Timed Mode' : '🧘 Practice Mode'} · {answeredCount}/{questions.length} answered
            </div>
          </div>
          {mode === 'timed' && secondsLeft !== null && (
            <div style={{
              fontSize: 22, fontWeight: 700, fontFamily: 'monospace',
              padding: '8px 18px', borderRadius: 8,
              background: secondsLeft < 60 ? 'var(--color-danger-light)' : 'var(--color-primary-light)',
              color: secondsLeft < 60 ? 'var(--color-danger)' : 'var(--color-primary)',
            }}>
              ⏱ {formatTime(secondsLeft)}
            </div>
          )}
        </div>
        <div className="progress-bar" style={{ marginTop: 12 }}>
          <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--color-success)' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
        {/* Question panel */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <span className="badge badge-blue">{current.category_name}</span>
            <button
              className="btn btn-sm"
              style={{ background: flagged[current.id] ? 'var(--color-warning)' : 'var(--bg-tertiary)', color: flagged[current.id] ? 'white' : 'var(--text-primary)', border: 'none' }}
              onClick={() => toggleFlag(current.id)}
            >
              🚩 {flagged[current.id] ? 'Flagged' : 'Flag for review'}
            </button>
          </div>

          <h3 style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.6, marginBottom: 24 }}>{current.question_text}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {['A', 'B', 'C', 'D'].map(opt => {
              const text = current[`option_${opt.toLowerCase()}`];
              const selected = answers[current.id] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => selectAnswer(current.id, opt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                    padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    background: selected ? 'var(--color-primary-light)' : 'var(--bg-primary)',
                    transition: 'all 0.15s', fontSize: 14, color: 'var(--text-primary)',
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: selected ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                    color: selected ? 'white' : 'var(--text-secondary)', fontWeight: 600, fontSize: 13,
                  }}>{opt}</span>
                  {text}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <button className="btn btn-secondary" disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)}>
              ← Previous
            </button>
            {currentIdx < questions.length - 1 ? (
              <button className="btn btn-primary" onClick={() => setCurrentIdx(i => i + 1)}>
                Next →
              </button>
            ) : (
              <button className="btn" style={{ background: 'var(--color-success)', color: 'white' }} onClick={onSubmitClick} disabled={submitting}>
                {submitting ? 'Submitting...' : '✓ Submit Test'}
              </button>
            )}
          </div>
        </div>

        {/* Navigation panel */}
        <div className="card" style={{ alignSelf: 'flex-start' }}>
          <div className="card-header"><h3 className="card-title" style={{ fontSize: 14 }}>Question Navigator</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 18 }}>
            {questions.map((q, idx) => {
              const status = idx === currentIdx ? 'current' : getStatus(idx);
              const colors = statusColors[status];
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: colors.bg, color: colors.color, fontWeight: 600, fontSize: 13,
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-success)', display: 'inline-block' }} /> Answered ({answeredCount})</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-warning)', display: 'inline-block' }} /> Flagged ({Object.values(flagged).filter(Boolean).length})</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--bg-tertiary)', display: 'inline-block', border: '1px solid var(--border-color)' }} /> Unanswered ({questions.length - answeredCount})</div>
          </div>

          <button
            className="btn w-full"
            style={{ background: 'var(--color-success)', color: 'white' }}
            onClick={onSubmitClick}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : '✓ Submit Test'}
          </button>
        </div>
      </div>
    </div>
  );
}