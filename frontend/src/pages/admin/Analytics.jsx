import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [quizAnalytics, setQuizAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/analytics/overview').then(setOverview).catch((e) => setError(e.message));
    api.get('/admin/quizzes').then(setQuizzes).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      api.get(`/admin/analytics/quiz/${selectedQuizId}`).then(setQuizAnalytics).catch((e) => setError(e.message));
    } else {
      setQuizAnalytics(null);
    }
  }, [selectedQuizId]);

  // Chart 1: Attempts by day data
  const attemptsData = overview ? Object.entries(overview.attemptsByDay || {}).map(([date, count]) => ({
    date: date.slice(5),
    Attempts: count,
  })) : [];

  // Chart 2: Student registrations by day data
  const registrationsData = overview ? Object.entries(overview.registrationsByDay || {}).map(([date, count]) => ({
    date: date.slice(5),
    Registrations: count,
  })) : [];

  // Chart 3: Pass vs Fail Pie Data
  const passFailData = overview ? [
    { name: 'Passed', value: overview.passedAttempts || 0, color: '#34d399' },
    { name: 'Failed', value: overview.failedAttempts || 0, color: '#f87171' },
  ] : [];

  const totalPassFail = (overview?.passedAttempts || 0) + (overview?.failedAttempts || 0);
  const passRate = totalPassFail > 0 ? Math.round(((overview?.passedAttempts || 0) / totalPassFail) * 100) : 0;

  // Chart 4: Average score per quiz data
  const quizScoresData = (overview?.quizScores || []).map((q) => ({
    name: q.quizTitle.length > 16 ? q.quizTitle.slice(0, 14) + '…' : q.quizTitle,
    fullName: q.quizTitle,
    AverageScore: q.averagePercentage,
    Attempts: q.attemptCount,
  }));

  // Chart 5: Most popular quizzes
  const popularQuizzesData = (overview?.popularQuizzes || []).map((q) => ({
    name: q.quizTitle.length > 16 ? q.quizTitle.slice(0, 14) + '…' : q.quizTitle,
    fullName: q.quizTitle,
    category: q.categoryName,
    Attempts: q.attemptCount,
    Average: q.averagePercentage,
  }));

  // Chart 6: Most popular categories
  const popularCategoriesData = (overview?.popularCategories || []).map((c) => ({
    name: c.categoryName,
    Attempts: c.attemptCount,
    Quizzes: c.quizCount,
  }));

  const tooltipStyle = {
    background: '#1e2230',
    border: '1px solid #2a2f42',
    borderRadius: 8,
    color: '#eef0f6',
    fontSize: 13,
  };

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="eyebrow">Admin Control Panel</div>
            <h1 className="page-title">Dashboard & Analytics</h1>
            <p className="page-subtitle">
              Comprehensive overview of platform statistics, student engagement, and assessment metrics.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/admin/quizzes" className="btn btn-secondary btn-sm">
              Manage Quizzes
            </Link>
            <Link to="/admin/users" className="btn btn-primary btn-sm">
              Manage Users
            </Link>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        {!overview ? (
          <div className="loading">Loading dashboard metrics…</div>
        ) : (
          <>
            {/* Section 1: Dashboard KPI Statistics (9 Cards) */}
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, marginBottom: 14 }}>Platform Statistics</h2>
            </div>

            <div className="grid grid-3" style={{ marginBottom: 16 }}>
              {/* Row 1 */}
              <div className="card stat-card">
                <div className="stat-value" style={{ color: '#60a5fa' }}>{overview.totalStudents}</div>
                <div className="stat-label">Total Students</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {overview.totalUsers} total platform users
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-value">{overview.totalQuizzes}</div>
                <div className="stat-label">Total Quizzes</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Across all assessment categories
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-value" style={{ color: 'var(--success)' }}>
                  {overview.publishedQuizzes}
                </div>
                <div className="stat-label">Published Quizzes</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Active & accessible to students
                </div>
              </div>

              {/* Row 2 */}
              <div className="card stat-card">
                <div className="stat-value" style={{ color: 'var(--text-muted)' }}>
                  {overview.draftQuizzes}
                </div>
                <div className="stat-label">Draft Quizzes</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Unpublished / under edit
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-value" style={{ color: '#a78bfa' }}>
                  {overview.totalQuestions}
                </div>
                <div className="stat-label">Total Questions</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  In the assessment question bank
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-value">{overview.totalAttempts}</div>
                <div className="stat-label">Total Quiz Attempts</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {overview.completedAttempts} completed attempts
                </div>
              </div>

              {/* Row 3 */}
              <div className="card stat-card">
                <div className="stat-value" style={{ color: 'var(--accent)' }}>
                  {overview.averageScorePercentage}%
                </div>
                <div className="stat-label">Average Score</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Across all completed assessments
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-value" style={{ color: 'var(--success)' }}>
                  {overview.passedAttempts}
                </div>
                <div className="stat-label">Total Passed Attempts</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {totalPassFail > 0 ? `${passRate}% pass rate` : '0%'}
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-value" style={{ color: 'var(--danger)' }}>
                  {overview.failedAttempts}
                </div>
                <div className="stat-label">Total Failed Attempts</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {totalPassFail > 0 ? `${100 - passRate}% fail rate` : '0%'}
                </div>
              </div>
            </div>

            {/* Section 2: Dashboard Analytics Charts */}
            <div style={{ marginTop: 32, marginBottom: 14 }}>
              <h2 style={{ fontSize: 18 }}>Activity Trends & Analytics</h2>
            </div>

            {/* Charts Row 1: Attempts over time & Student registrations */}
            <div className="grid grid-2" style={{ marginBottom: 18 }}>
              {/* Chart 1: Quiz attempts over time */}
              <div className="card">
                <h3 style={{ marginBottom: 4, fontSize: 16 }}>Quiz Attempts (Last 14 Days)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Daily student assessment volume</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={attemptsData}>
                    <defs>
                      <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f0b429" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f0b429" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#2a2f42" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#9299b5" fontSize={12} />
                    <YAxis stroke="#9299b5" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="Attempts" stroke="#f0b429" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAttempts)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 2: Student registrations over time */}
              <div className="card">
                <h3 style={{ marginBottom: 4, fontSize: 16 }}>Student Registrations (Last 14 Days)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>New student sign-ups trend</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={registrationsData}>
                    <defs>
                      <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#2a2f42" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#9299b5" fontSize={12} />
                    <YAxis stroke="#9299b5" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="Registrations" stroke="#60a5fa" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 2: Pass/Fail Ratio & Average Quiz Scores */}
            <div className="grid grid-2" style={{ marginBottom: 18 }}>
              {/* Chart 3: Pass/Fail ratio */}
              <div className="card">
                <h3 style={{ marginBottom: 4, fontSize: 16 }}>Pass / Fail Ratio</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Overall completion success breakdown</p>
                {totalPassFail === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 0' }}>No completed attempts recorded yet.</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 220 }}>
                    <ResponsiveContainer width="55%" height={200}>
                      <PieChart>
                        <Pie
                          data={passFailData}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {passFailData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '40%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#34d399' }} />
                        <span style={{ fontSize: 13.5 }}>Passed: <strong>{overview.passedAttempts}</strong> ({passRate}%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#f87171' }} />
                        <span style={{ fontSize: 13.5 }}>Failed: <strong>{overview.failedAttempts}</strong> ({100 - passRate}%)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart 4: Average Quiz Scores */}
              <div className="card">
                <h3 style={{ marginBottom: 4, fontSize: 16 }}>Average Quiz Scores</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Performance comparison across quizzes (%)</p>
                {quizScoresData.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 0' }}>No quiz scores available yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={quizScoresData}>
                      <CartesianGrid stroke="#2a2f42" strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#9299b5" fontSize={11} />
                      <YAxis stroke="#9299b5" fontSize={12} unit="%" domain={[0, 100]} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="AverageScore" fill="#f0b429" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Charts Row 3: Most Popular Quizzes & Categories */}
            <div className="grid grid-2" style={{ marginBottom: 24 }}>
              {/* Chart 5: Most popular quizzes */}
              <div className="card">
                <h3 style={{ marginBottom: 4, fontSize: 16 }}>Most Popular Quizzes</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Quizzes with highest attempt volume</p>
                {popularQuizzesData.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 0' }}>No quizzes attempted yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={popularQuizzesData} layout="vertical">
                      <CartesianGrid stroke="#2a2f42" strokeDasharray="3 3" />
                      <XAxis type="number" stroke="#9299b5" fontSize={12} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#9299b5" fontSize={11} width={110} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="Attempts" fill="#818cf8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Chart 6: Most popular categories */}
              <div className="card">
                <h3 style={{ marginBottom: 4, fontSize: 16 }}>Most Popular Categories</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Assessment attempts grouped by category</p>
                {popularCategoriesData.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 0' }}>No category data available yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={popularCategoriesData}>
                      <CartesianGrid stroke="#2a2f42" strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#9299b5" fontSize={12} />
                      <YAxis stroke="#9299b5" fontSize={12} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="Attempts" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Section 3: Deep-Dive Per-Quiz Analytics */}
            <div className="card" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: 17 }}>Quiz Drilldown Analysis</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Inspect question-level toughness and individual quiz outcomes</p>
                </div>
                <select
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                  style={{ width: 280 }}
                >
                  <option value="">Select a quiz to drill down…</option>
                  {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
                </select>
              </div>

              {quizAnalytics ? (
                <>
                  <div className="grid grid-4" style={{ marginBottom: 16 }}>
                    <div className="stat-card">
                      <div className="stat-value">{quizAnalytics.totalAttempts}</div>
                      <div className="stat-label">Total Attempts</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value" style={{ color: 'var(--accent)' }}>{quizAnalytics.averagePercentage}%</div>
                      <div className="stat-label">Average Score</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value" style={{ color: 'var(--success)' }}>{quizAnalytics.passCount}</div>
                      <div className="stat-label">Passed</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value" style={{ color: 'var(--danger)' }}>{quizAnalytics.failCount}</div>
                      <div className="stat-label">Failed</div>
                    </div>
                  </div>

                  {quizAnalytics.toughestQuestions.length > 0 ? (
                    <div style={{ marginTop: 20 }}>
                      <h4 style={{ fontSize: 14.5, marginBottom: 12, color: 'var(--text-muted)' }}>
                        All Questions - Correct Rate (Toughest First)
                      </h4>
                      {quizAnalytics.toughestQuestions.map((q, idx) => (
                        <div key={q.questionId || idx} style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 5 }}>
                            <span style={{ fontWeight: 500 }}>{q.questionText}</span>
                            <span style={{ fontWeight: 700, color: q.correctRate < 40 ? 'var(--danger)' : 'var(--text)' }}>
                              {q.correctRate}% correct ({q.timesCorrect}/{q.timesAnswered})
                            </span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${q.correctRate}%`,
                                background: q.correctRate < 40 ? 'var(--danger)' : 'var(--accent)',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 13.5 }}>
                      No question response data recorded for this quiz yet.
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  Select a quiz from the dropdown above to view per-question analytics.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
