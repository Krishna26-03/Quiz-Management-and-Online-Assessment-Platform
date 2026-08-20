import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import TimerRing from '../../components/TimerRing';

export default function QuizAttempt() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> [optionId,...]
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const targetEndRef = useRef(null);

  function applyAttemptData(data) {
    setAttempt(data);
    if (data.savedAnswers && Object.keys(data.savedAnswers).length > 0) {
      setAnswers((prev) => ({ ...data.savedAnswers, ...prev }));
    }

    const totalSecs = (data.durationMinutes ? data.durationMinutes * 60 : 0) || (data.remainingSeconds || 60);
    setTotalSeconds(Math.max(1, totalSecs));

    let remSecs = data.remainingSeconds;
    if (remSecs == null || remSecs === undefined) {
      remSecs = totalSecs;
    }

    setSecondsLeft(remSecs);
    targetEndRef.current = Date.now() + remSecs * 1000;
  }

  useEffect(() => {
    let isMounted = true;

    // Load from cache first if present for instant rendering
    const cached = sessionStorage.getItem(`attempt_${attemptId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (isMounted) {
          applyAttemptData(parsed);
        }
      } catch (e) {
        // ignore cache parse error
      }
    }

    // Always fetch fresh attempt state from backend
    api.get(`/attempts/${attemptId}`)
      .then((data) => {
        if (!isMounted) return;
        applyAttemptData(data);
        sessionStorage.setItem(`attempt_${attemptId}`, JSON.stringify(data));
      })
      .catch((err) => {
        if (!isMounted) return;
        const msg = err.message || '';
        if (msg.includes('already been submitted') || msg.includes('auto-submitted') || msg.includes('Time is up')) {
          navigate(`/result/${attemptId}`, { replace: true });
          return;
        }
        if (!cached) {
          setError(msg || 'Failed to load quiz attempt.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [attemptId, navigate]);

  useEffect(() => {
    if (!targetEndRef.current) return;
    const tick = () => {
      if (!targetEndRef.current) return;
      const remaining = Math.round((targetEndRef.current - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
      if (remaining <= 0 && !submittedRef.current) {
        submittedRef.current = true;
        handleSubmit(true);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [attempt]);

  const questions = attempt?.questions || [];
  const question = questions[current];
  const answeredCount = useMemo(() => Object.values(answers).filter((v) => v && v.length > 0).length, [answers]);

  async function toggleOption(optionId) {
    if (!question) return;
    const isMulti = question.type === 'MULTIPLE_CHOICE' || question.type === 'MATCH_FOLLOWING';
    const prevSelected = answers[question.id] || [];
    let next;
    if (isMulti) {
      next = prevSelected.includes(optionId) ? prevSelected.filter((id) => id !== optionId) : [...prevSelected, optionId];
    } else {
      next = [optionId];
    }
    const updated = { ...answers, [question.id]: next };
    setAnswers(updated);

    try {
      await api.put(`/attempts/${attemptId}/answer`, { questionId: question.id, selectedOptionIds: next });
    } catch (e) {
      console.warn('Autosave failed', e.message);
    }
  }

  async function handleSubmit(auto = false) {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (auto) {
        // Timer already hit 0, so the deadline has passed. Calling /submit here would just be
        // rejected by the backend (it validates the deadline and auto-submits + throws instead),
        // which used to leave the student stuck on an error screen instead of seeing their result.
        // The backend already auto-finalizes an expired attempt the moment its result is fetched,
        // so just go straight to the result page - it'll show the same result view as a manual
        // submit, with an "Auto-submitted" note.
        sessionStorage.removeItem(`attempt_${attemptId}`);
        navigate(`/result/${attemptId}`);
        return;
      }

      const payload = {
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedOptionIds: answers[q.id] || [],
        })),
      };
      await api.post(`/attempts/${attemptId}/submit`, payload);
      sessionStorage.removeItem(`attempt_${attemptId}`);
      navigate(`/result/${attemptId}`);
    } catch (e) {
      // Edge case: the deadline slipped past between the last timer tick and this manual submit
      // request reaching the server. The backend treats that as an auto-submit and rejects the
      // manual submit with an error - but the attempt is still finalized server-side, so send the
      // student to their result instead of showing them a raw error.
      if (e.message && e.message.toLowerCase().includes('auto-submitted')) {
        sessionStorage.removeItem(`attempt_${attemptId}`);
        navigate(`/result/${attemptId}`);
        return;
      }
      setError(e.message);
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <div className="error-box">{error}</div>
          <button className="btn btn-secondary" onClick={() => navigate('/quizzes')}>
            Back to quizzes
          </button>
        </div>
      </div>
    );
  }
  if (!attempt) return <div className="loading">Loading attempt…</div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <div className="eyebrow">Quiz In Progress</div>
            <h1 className="page-title">{attempt.quizTitle}</h1>
            <p className="page-subtitle">
              Question {current + 1} of {questions.length} · {answeredCount} answered
            </p>
          </div>
        </div>

        <div className="attempt-shell">
          <div className="card">
            {question && (
              <>
                {/* Badges Bar */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="badge badge-accent">
                    {question.type ? question.type.replace(/_/g, ' ') : 'QUESTION'}
                  </span>
                  {question.difficulty && (
                    <span className="badge badge-muted">{question.difficulty}</span>
                  )}
                  {question.marks && (
                    <span className="badge badge-muted">{question.marks} marks</span>
                  )}
                </div>

                {/* Question Prompt */}
                <h3 style={{ fontSize: 18, marginBottom: 16, lineHeight: 1.5 }}>
                  {question.text}
                </h3>

                {/* Image if IMAGE_BASED */}
                {question.imageUrl && (
                  <div style={{ marginBottom: 16, textAlign: 'center' }}>
                    <img
                      src={question.imageUrl}
                      alt="Question illustration"
                      style={{ maxHeight: 240, maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                  </div>
                )}

                {/* Code Block if CODE_BASED */}
                {question.codeSnippet && (
                  <pre
                    style={{
                      background: 'var(--surface-raised)',
                      padding: 14,
                      borderRadius: 8,
                      fontSize: 13.5,
                      fontFamily: 'monospace',
                      overflowX: 'auto',
                      border: '1px solid var(--border)',
                      marginBottom: 16,
                    }}
                  >
                    <code>{question.codeSnippet}</code>
                  </pre>
                )}

                {question.type === 'MULTIPLE_CHOICE' && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                    💡 Select all correct answers that apply.
                  </p>
                )}

                {/* Options List */}
                <div style={{ display: 'grid', gap: 8 }}>
                  {question.options.map((opt, optIdx) => {
                    const selected = (answers[question.id] || []).includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={'option-row' + (selected ? ' selected' : '')}
                        onClick={() => toggleOption(opt.id)}
                      >
                        <div className="option-marker">
                          {selected ? '✓' : String.fromCharCode(65 + optIdx)}
                        </div>
                        <span style={{ whiteSpace: 'pre-wrap', flex: 1, wordBreak: 'break-word' }}>
                          {opt.text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Question Nav Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                  <button
                    className="btn btn-secondary"
                    disabled={current === 0}
                    onClick={() => setCurrent((c) => c - 1)}
                  >
                    ← Previous
                  </button>
                  {current < questions.length - 1 ? (
                    <button className="btn btn-primary" onClick={() => setCurrent((c) => c + 1)}>
                      Next →
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      disabled={submitting}
                      onClick={() => handleSubmit(false)}
                    >
                      {submitting ? 'Submitting…' : 'Submit Quiz'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Sidebar: Timer & Question Matrix */}
          <div className="timer-ring-wrap card">
            <TimerRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
            <div className="question-nav">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className={
                    'q-dot' +
                    ((answers[q.id]?.length > 0) ? ' answered' : '') +
                    (i === current ? ' current' : '')
                  }
                  onClick={() => setCurrent(i)}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary btn-block"
              disabled={submitting}
              onClick={() => handleSubmit(false)}
            >
              {submitting ? 'Submitting…' : 'Submit Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
