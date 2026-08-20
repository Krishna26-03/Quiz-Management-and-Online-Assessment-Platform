import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function History() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/attempts/history').then(setItems).catch((e) => setError(e.message));
  }, []);

  function formatTime(secs) {
    if (!secs || secs <= 0) return '< 1 min';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s > 0 ? `${s}s` : ''}`;
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <div className="eyebrow">Your Assessment Record</div>
            <h1 className="page-title">Attempt History</h1>
            <p className="page-subtitle">Review all your previous quiz submissions, scores, and detailed answer breakdowns.</p>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        {!items ? (
          <div className="loading">Loading attempt history…</div>
        ) : items.length === 0 ? (
          <div className="card empty-state">
            You haven't attempted any quizzes yet. <Link to="/quizzes" style={{ color: 'var(--accent)', marginLeft: 4 }}>Explore available quizzes</Link>.
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Status</th>
                  <th>Marks</th>
                  <th>Score %</th>
                  <th>Result</th>
                  <th>Time Taken</th>
                  <th>Submitted At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.attemptId}>
                    <td style={{ padding: '14px 10px', fontWeight: 600 }}>{a.quizTitle}</td>
                    <td>
                      <span className={'badge ' + (a.status === 'AUTO_SUBMITTED' ? 'badge-accent' : 'badge-muted')}>
                        {a.status === 'AUTO_SUBMITTED' ? 'Auto-submitted' : 'Submitted'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {a.totalScore} / {a.maxPossibleScore}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: a.passed ? 'var(--success)' : 'var(--danger)' }}>
                        {Math.round(a.percentage * 10) / 10}%
                      </span>
                    </td>
                    <td>
                      <span className={'badge ' + (a.passed ? 'badge-success' : 'badge-danger')}>
                        {a.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {formatTime(a.timeTakenSeconds)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '—'}
                    </td>
                    <td>
                      <Link to={`/result/${a.attemptId}`} className="btn btn-secondary btn-sm">
                        View Result
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
