import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently added' },
  { value: 'popular', label: 'Popularity' },
];

export default function QuizList() {
  const [quizzes, setQuizzes] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Search
  const [search, setSearch] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    api.get('/quizzes').then(setQuizzes).catch((e) => setError(e.message));
    api.get('/categories').then(setCategories).catch(() => {});
  }, []);

  async function startQuiz(quizId) {
    try {
      const attempt = await api.post(`/attempts/start/${quizId}`);
      sessionStorage.setItem(`attempt_${attempt.attemptId}`, JSON.stringify(attempt));
      navigate(`/attempt/${attempt.attemptId}`);
    } catch (e) {
      setError(e.message);
    }
  }

  const filteredQuizzes = useMemo(() => {
    if (!quizzes) return null;
    const term = search.trim().toLowerCase();

    let result = quizzes.filter((q) => {
      const matchesSearch =
        !term ||
        q.title.toLowerCase().includes(term) ||
        (q.categoryName && q.categoryName.toLowerCase().includes(term));
      const matchesCategory = !categoryFilter || String(q.categoryId) === categoryFilter;
      const matchesDifficulty = !difficultyFilter || q.difficulty === difficultyFilter;
      const matchesDuration =
        !durationFilter ||
        (durationFilter === 'short' && q.durationMinutes <= 15) ||
        (durationFilter === 'medium' && q.durationMinutes > 15 && q.durationMinutes <= 30) ||
        (durationFilter === 'long' && q.durationMinutes > 30);
      return matchesSearch && matchesCategory && matchesDifficulty && matchesDuration;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'popular') return (b.popularityCount || 0) - (a.popularityCount || 0);
      return new Date(b.createdAt) - new Date(a.createdAt); // recent
    });

    return result;
  }, [quizzes, search, categoryFilter, difficultyFilter, durationFilter, sortBy]);

  const hasActiveFilters = search || categoryFilter || difficultyFilter || durationFilter;

  function clearFilters() {
    setSearch('');
    setCategoryFilter('');
    setDifficultyFilter('');
    setDurationFilter('');
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <div className="eyebrow">Browse</div>
            <h1 className="page-title">Available quizzes</h1>
            <p className="page-subtitle">Pick a quiz — the timer starts the moment you begin.</p>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        {/* Search + Filters bar */}
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by quiz title or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: '1 1 240px', minWidth: 200 }}
            />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ flex: '0 1 170px' }}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
            <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} style={{ flex: '0 1 150px' }}>
              <option value="">All difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
            <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value)} style={{ flex: '0 1 160px' }}>
              <option value="">Any duration</option>
              <option value="short">Short (≤15 min)</option>
              <option value="medium">Medium (16–30 min)</option>
              <option value="long">Long (30+ min)</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ flex: '0 1 170px' }}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>Sort: {o.label}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        </div>

        {!quizzes ? (
          <div className="loading">Loading quizzes…</div>
        ) : quizzes.length === 0 ? (
          <div className="empty-state">No quizzes are available right now. Check back soon.</div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="empty-state">No quizzes match your search or filters. Try adjusting them.</div>
        ) : (
          <div className="grid grid-3">
            {filteredQuizzes.map((q) => (
              <div key={q.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span className="badge badge-accent">{q.difficulty}</span>
                  {q.categoryName && <span className="badge badge-muted">{q.categoryName}</span>}
                </div>
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>{q.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16, minHeight: 40 }}>
                  {q.description || 'No description provided.'}
                </p>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, flexWrap: 'wrap' }}>
                  <span>⏱ {q.durationMinutes} min</span>
                  <span>❓ {q.questionCount} questions</span>
                  {q.passPercentage != null && <span>🎯 {q.passPercentage}% to pass</span>}
                  {q.maxAttempts > 0 && <span>🔁 {q.attemptsUsed}/{q.maxAttempts} used</span>}
                </div>
                <button className="btn btn-primary btn-block" disabled={!q.available} onClick={() => startQuiz(q.id)}>
                  {q.available ? 'Start quiz' : (q.unavailableReason || 'Unavailable')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
