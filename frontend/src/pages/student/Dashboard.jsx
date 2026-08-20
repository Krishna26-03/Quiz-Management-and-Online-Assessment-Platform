import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics/me').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <div className="error-box">{error}</div>
        </div>
      </div>
    );
  }
  if (!data) return <div className="loading">Loading your dashboard…</div>;

  const totalCompleted = data.quizzesPassed + data.quizzesFailed;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <div className="eyebrow">Overview</div>
            <h1 className="page-title">
              {user?.fullName ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'Student dashboard'}
            </h1>
            <p className="page-subtitle">A snapshot of your quiz activity so far.</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-3" style={{ marginBottom: 16 }}>
          <div className="card stat-card">
            <div className="stat-value">{data.totalAttempts}</div>
            <div className="stat-label">Quizzes Attempted</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{data.averagePercentage}%</div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{data.bestPercentage}%</div>
            <div className="stat-label">Highest Score</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{data.quizzesPassed}</div>
            <div className="stat-label">Passed</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{data.quizzesFailed}</div>
            <div className="stat-label">Failed</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{data.totalQuestionsAnswered}</div>
            <div className="stat-label">Questions Answered</div>
          </div>
        </div>

        {totalCompleted > 0 && (
          <div className="card" style={{ marginBottom: 24, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span><strong>Pass rate</strong></span>
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                {Math.round((data.quizzesPassed / totalCompleted) * 1000) / 10}%
              </span>
            </div>
            <div className="progress-bar" style={{ height: 10 }}>
              <div
                className="progress-fill"
                style={{ width: `${(data.quizzesPassed / totalCompleted) * 100}%`, background: 'var(--success)' }}
              />
            </div>
          </div>
        )}

        {/* Recent Attempts */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 18px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 17 }}>Recent Attempts</h3>
            <Link to="/history" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {data.recentAttempts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, padding: '4px 18px 18px' }}>
              You haven't completed any quizzes yet — <Link to="/quizzes">browse quizzes</Link> to get started.
            </p>
          ) : (
            <table>
              <thead>
                <tr><th>Quiz</th><th>Score</th><th>Result</th></tr>
              </thead>
              <tbody>
                {data.recentAttempts.map((a) => (
                  <tr key={a.attemptId}>
                    <td style={{ padding: '14px 18px' }}>{a.quizTitle}</td>
                    <td style={{ fontWeight: 700 }}>{Math.round(a.percentage * 10) / 10}%</td>
                    <td>
                      <span className={'badge ' + (a.passed ? 'badge-success' : 'badge-danger')}>
                        {a.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
