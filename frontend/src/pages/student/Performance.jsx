import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function Performance() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics/me').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="page"><div className="container"><div className="error-box">{error}</div></div></div>;
  if (!data) return <div className="loading">Loading…</div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <div className="eyebrow">Your progress</div>
            <h1 className="page-title">My performance</h1>
          </div>
        </div>

        <div className="grid grid-4">
          <div className="card stat-card"><div className="stat-value">{data.totalAttempts}</div><div className="stat-label">Quizzes attempted</div></div>
          <div className="card stat-card"><div className="stat-value" style={{ color: 'var(--accent)' }}>{data.averagePercentage}%</div><div className="stat-label">Average score</div></div>
          <div className="card stat-card"><div className="stat-value" style={{ color: 'var(--success)' }}>{data.bestPercentage}%</div><div className="stat-label">Best score</div></div>
          <div className="card stat-card"><div className="stat-value">{data.quizzesPassed} / {data.quizzesPassed + data.quizzesFailed}</div><div className="stat-label">Passed</div></div>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <h3 style={{ marginBottom: 16, fontSize: 17 }}>Performance by category</h3>
          {data.byCategory.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No completed attempts yet.</p>
          ) : (
            data.byCategory.map((c) => (
              <div key={c.categoryName} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                  <span>{c.categoryName} <span style={{ color: 'var(--text-muted)' }}>({c.attempts} attempts)</span></span>
                  <span style={{ fontWeight: 700 }}>{c.averagePercentage}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.max(0, c.averagePercentage)}%` }} /></div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
