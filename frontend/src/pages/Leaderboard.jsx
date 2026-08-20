import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const SCOPES = [
  { value: 'OVERALL', label: 'Overall' },
  { value: 'CATEGORY', label: 'Category-wise' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

const METRICS = [
  { value: 'HIGHEST_SCORE', label: 'Highest score', column: 'bestPercentage' },
  { value: 'AVERAGE_SCORE', label: 'Average score', column: 'averagePercentage' },
  { value: 'QUIZZES_COMPLETED', label: 'Quizzes completed', column: 'quizzesCompleted' },
];

const SUBTITLES = {
  OVERALL: 'Ranked across every quiz attempted, all-time.',
  CATEGORY: 'Ranked within a single category.',
  WEEKLY: 'Ranked on attempts submitted since Monday this week.',
  MONTHLY: 'Ranked on attempts submitted so far this month.',
};

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [scope, setScope] = useState('OVERALL');
  const [metric, setMetric] = useState('HIGHEST_SCORE');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    api.get('/categories').then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (scope === 'CATEGORY' && !categoryId) {
      setEntries([]); // wait for the student to pick a category before querying
      return;
    }
    setEntries(null);
    const params = new URLSearchParams({ scope, metric });
    if (scope === 'CATEGORY' && categoryId) params.set('categoryId', categoryId);
    api.get(`/leaderboard/global?${params.toString()}`).then(setEntries).catch((e) => setError(e.message));
  }, [scope, metric, categoryId]);

  const activeMetric = METRICS.find((m) => m.value === metric);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <div className="eyebrow">Rankings</div>
            <h1 className="page-title">Leaderboard</h1>
            <p className="page-subtitle">{SUBTITLES[scope]}</p>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        {/* Scope tabs: Overall / Category-wise / Weekly / Monthly */}
        <div className="tabs">
          {SCOPES.map((s) => (
            <div
              key={s.value}
              className={'tab' + (scope === s.value ? ' active' : '')}
              onClick={() => setScope(s.value)}
            >
              {s.label}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
          {/* Rank-by tabs: Highest score / Average score / Quizzes completed */}
          <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none', gap: 8 }}>
            {METRICS.map((m) => (
              <div
                key={m.value}
                className={'tab' + (metric === m.value ? ' active' : '')}
                style={{ borderBottom: 'none' }}
                onClick={() => setMetric(m.value)}
              >
                <span
                  className={'badge ' + (metric === m.value ? 'badge-accent' : 'badge-muted')}
                  style={{ cursor: 'pointer' }}
                >
                  {m.label}
                </span>
              </div>
            ))}
          </div>

          {scope === 'CATEGORY' && (
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ minWidth: 200 }}>
              <option value="">Choose a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {scope === 'CATEGORY' && !categoryId ? (
          <div className="empty-state">Pick a category above to see its leaderboard.</div>
        ) : !entries ? (
          <div className="loading">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">No completed attempts yet — be the first!</div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Total score</th>
                  <th>Highest score %</th>
                  <th>Average score %</th>
                  <th>Quizzes completed</th>
                  <th>Best quiz</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.userId} style={user?.id === e.userId ? { background: 'var(--accent-soft)' } : undefined}>
                    <td style={{ fontWeight: 700, color: e.rank <= 3 ? 'var(--accent)' : undefined }}>#{e.rank}</td>
                    <td style={{ padding: '14px 10px' }}>{e.userName}</td>
                    <td>{e.totalScore}</td>
                    <td style={activeMetric.column === 'bestPercentage' ? { fontWeight: 700, color: 'var(--accent)' } : undefined}>
                      {Math.round(e.bestPercentage * 10) / 10}%
                    </td>
                    <td style={activeMetric.column === 'averagePercentage' ? { fontWeight: 700, color: 'var(--accent)' } : undefined}>
                      {Math.round(e.averagePercentage * 10) / 10}%
                    </td>
                    <td style={activeMetric.column === 'quizzesCompleted' ? { fontWeight: 700, color: 'var(--accent)' } : undefined}>
                      {e.quizzesCompleted}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{e.bestQuizTitle || '—'}</td>
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
