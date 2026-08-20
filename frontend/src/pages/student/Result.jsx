import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';

export default function Result() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showReview, setShowReview] = useState(true);

  useEffect(() => {
    api.get(`/attempts/${attemptId}/result`)
      .then(setResult)
      .catch((e) => {
        setError(e.message || 'Failed to load result.');
      });
  }, [attemptId]);

  if (error) {
    const isInProgress = error.toLowerCase().includes('in progress');
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 780 }}>
          <div className="error-box">{error}</div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            {isInProgress && (
              <Link to={`/attempt/${attemptId}`} className="btn btn-primary">
                Continue Quiz Attempt →
              </Link>
            )}
            <Link to="/quizzes" className="btn btn-secondary">Back to Quizzes</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return <div className="loading">Processing and loading your quiz result…</div>;

  const pct = Math.round(result.percentage * 10) / 10;
  const totalQ = result.totalQuestions || (result.answers ? result.answers.length : 0);

  function formatTime(secs) {
    if (!secs || secs <= 0) return '< 1 min';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s > 0 ? `${s}s` : ''}`;
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 840 }}>
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="eyebrow">Assessment Results</div>
            <h1 className="page-title">{result.quizTitle}</h1>
            <p className="page-subtitle">
              {result.status === 'AUTO_SUBMITTED' ? '⏱ Auto-submitted when countdown timer expired' : '✓ Submitted'} · {new Date(result.submittedAt).toLocaleString()}
            </p>
          </div>
          <span
            className={'badge ' + (result.passed ? 'badge-success' : 'badge-danger')}
            style={{ fontSize: 15, padding: '10px 20px', fontWeight: 800, letterSpacing: '0.5px' }}
          >
            {result.passed ? 'PASSED' : 'FAILED'}
          </span>
        </div>

        {/* 4 Main Summary Cards */}
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <div className="card stat-card">
            <div className="stat-value">{totalQ}</div>
            <div className="stat-label">Total Questions</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{result.correctCount}</div>
            <div className="stat-label">Correct Answers</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{result.wrongCount}</div>
            <div className="stat-label">Incorrect Answers</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--text-muted)' }}>{result.unansweredCount}</div>
            <div className="stat-label">Unanswered</div>
          </div>
        </div>

        {/* Secondary Details Cards: Score, Obtained Marks, Time Taken */}
        <div className="grid grid-3" style={{ marginBottom: 20 }}>
          <div className="card stat-card" style={{ background: 'var(--surface-raised)' }}>
            <div className="stat-value" style={{ color: result.passed ? 'var(--success)' : 'var(--danger)' }}>
              {pct}%
            </div>
            <div className="stat-label">Final Score Percentage</div>
          </div>
          <div className="card stat-card" style={{ background: 'var(--surface-raised)' }}>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>
              {result.totalScore} <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>/ {result.maxPossibleScore}</span>
            </div>
            <div className="stat-label">Marks Obtained</div>
          </div>
          <div className="card stat-card" style={{ background: 'var(--surface-raised)' }}>
            <div className="stat-value">
              {formatTime(result.timeTakenSeconds)}
            </div>
            <div className="stat-label">Time Taken</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="card" style={{ marginBottom: 24, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
            <span><strong>Score Progress</strong> ({result.totalScore} of {result.maxPossibleScore} marks)</span>
            <span style={{ fontWeight: 700, color: result.passed ? 'var(--success)' : 'var(--danger)' }}>{pct}%</span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div
              className="progress-fill"
              style={{
                width: `${Math.max(0, Math.min(100, pct))}%`,
                background: result.passed ? 'var(--success)' : 'var(--danger)',
              }}
            />
          </div>
        </div>

        {/* Actions Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button className="btn btn-secondary" onClick={() => setShowReview((s) => !s)}>
            {showReview ? 'Hide Answer Review' : 'Show Answer Review'}
          </button>
          <Link to="/quizzes" className="btn btn-primary">
            Explore More Quizzes
          </Link>
          <Link to="/history" className="btn btn-secondary">
            View Attempt History
          </Link>
        </div>

        {/* Question-by-Question Review */}
        {showReview && result.answers && (
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Detailed Answer Review</h3>
            {result.answers.map((a, idx) => (
              <div key={a.questionId} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10 }}>
                  <strong style={{ fontSize: 15.5, lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--accent)', marginRight: 6 }}>Q{idx + 1}.</span>
                    {a.questionText}
                  </strong>
                  <span
                    className={
                      'badge ' +
                      (a.correct === true
                        ? 'badge-success'
                        : a.correct === false
                        ? 'badge-danger'
                        : 'badge-muted')
                    }
                    style={{ flexShrink: 0 }}
                  >
                    {a.correct === true
                      ? `+${a.marksAwarded} marks`
                      : a.correct === false
                      ? `${a.marksAwarded} marks`
                      : 'Unanswered (0 marks)'}
                  </span>
                </div>

                {/* Options Review */}
                <div style={{ display: 'grid', gap: 6, margin: '10px 0' }}>
                  {a.options.map((opt) => {
                    const wasSelected = a.selectedOptionIds && a.selectedOptionIds.includes(opt.id);
                    const isCorrect = a.correctOptionIds && a.correctOptionIds.includes(opt.id);
                    let cls = 'option-row';
                    if (isCorrect) cls += ' correct';
                    else if (wasSelected && !isCorrect) cls += ' incorrect';

                    return (
                      <div key={opt.id} className={cls} style={{ cursor: 'default', padding: '8px 12px' }}>
                        <div className="option-marker">
                          {isCorrect ? '✓' : wasSelected ? '✗' : ''}
                        </div>
                        <span style={{ whiteSpace: 'pre-wrap', flex: 1, wordBreak: 'break-word', fontWeight: isCorrect || wasSelected ? 600 : 400 }}>
                          {opt.text}
                        </span>
                        {wasSelected && (
                          <span style={{ marginLeft: 8, fontSize: 11.5, color: isCorrect ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                            (Your choice)
                          </span>
                        )}
                        {isCorrect && !wasSelected && (
                          <span style={{ marginLeft: 8, fontSize: 11.5, color: 'var(--success)', fontWeight: 600 }}>
                            (Correct Answer)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {a.explanation && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '10px 14px',
                      borderRadius: 6,
                      borderLeft: '3px solid var(--accent)',
                      fontSize: 13,
                      marginTop: 10,
                    }}
                  >
                    <strong style={{ color: 'var(--text)' }}>Explanation: </strong>
                    {a.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
