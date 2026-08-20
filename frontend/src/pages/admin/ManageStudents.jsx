import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function ManageStudents() {
  const [students, setStudents] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DISABLED'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected student for Profile modal
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password reset modal state
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');

  function load() {
    api.get(`/admin/users/students${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      .then(setStudents)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  function notify(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  function openProfile(studentId) {
    setSelectedStudentId(studentId);
    setProfileLoading(true);
    setProfileData(null);
    api.get(`/admin/users/${studentId}/profile`)
      .then(setProfileData)
      .catch((e) => setError(e.message))
      .finally(() => setProfileLoading(false));
  }

  async function toggleStatus(s) {
    try {
      await api.put(`/admin/users/${s.id}`, { enabled: !s.enabled });
      notify(`Account for ${s.fullName} is now ${!s.enabled ? 'Active' : 'Disabled'}.`);
      load();
      if (selectedStudentId === s.id && profileData) {
        setProfileData({
          ...profileData,
          user: { ...profileData.user, enabled: !s.enabled }
        });
      }
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAdminResetPassword(e) {
    e.preventDefault();
    if (!resetTargetUser) return;
    setResetError('');
    setResetBusy(true);
    try {
      await api.put(`/admin/users/${resetTargetUser.id}/reset-password`, { newPassword: resetPassword });
      notify(`Password for ${resetTargetUser.email} has been updated.`);
      setResetTargetUser(null);
      setResetPassword('');
    } catch (err) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetBusy(false);
    }
  }

  async function removeStudent(id, email) {
    if (!confirm(`Delete student account "${email}" and all their test history? This action cannot be undone.`)) return;
    try {
      await api.del(`/admin/users/${id}`);
      notify(`Deleted student account ${email}.`);
      if (selectedStudentId === id) setSelectedStudentId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  const filteredStudents = students?.filter((s) => {
    if (statusFilter === 'ACTIVE') return s.enabled;
    if (statusFilter === 'DISABLED') return !s.enabled;
    return true;
  });

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="eyebrow">Student Administration</div>
            <h1 className="page-title">Manage Students</h1>
            <p className="page-subtitle">
              View registered students, inspect quiz histories, monitor performance metrics, and manage account statuses.
            </p>
          </div>
          <div>
            <Link to="/admin/users" className="btn btn-secondary btn-sm">
              All Users & Admins
            </Link>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}
        {successMsg && <div className="success-box">{successMsg}</div>}

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <input
              type="text"
              placeholder="🔍 Search students by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: 'ALL', label: 'All Students' },
              { key: 'ACTIVE', label: 'Active' },
              { key: 'DISABLED', label: 'Disabled' },
            ].map((f) => (
              <button
                key={f.key}
                className={`btn btn-sm ${statusFilter === f.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(f.key)}
              >
                {f.label} {students && (
                  `(${f.key === 'ALL'
                    ? students.length
                    : f.key === 'ACTIVE'
                    ? students.filter(s => s.enabled).length
                    : students.filter(s => !s.enabled).length})`
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Student Table */}
        {!students ? (
          <div className="loading">Loading student directory…</div>
        ) : filteredStudents.length === 0 ? (
          <div className="card empty-state">
            {search ? `No students found matching "${search}".` : 'No student accounts registered yet.'}
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Registration Date</th>
                  <th>Status</th>
                  <th>Quizzes Attempted</th>
                  <th>Average Score</th>
                  <th>Highest Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td style={{ padding: '14px 10px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
                          {s.fullName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span>{s.fullName}</span>
                      </div>
                    </td>
                    <td>{s.email}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${s.enabled ? 'badge-success' : 'badge-danger'}`}>
                        {s.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {s.quizzesAttempted}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: s.quizzesAttempted > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {s.quizzesAttempted > 0 ? `${s.averageScore}%` : '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: s.quizzesAttempted > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                        {s.quizzesAttempted > 0 ? `${s.highestScore}%` : '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openProfile(s.id)}
                          title="View student profile & complete attempt history"
                        >
                          View Profile
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleStatus(s)}
                          title={s.enabled ? 'Deactivate this student account' : 'Activate this student account'}
                        >
                          {s.enabled ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setResetTargetUser(s); setResetPassword(''); setResetError(''); }}
                          title="Reset student password"
                        >
                          Reset Pwd
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => removeStudent(s.id, s.email)}
                          title="Permanently delete student account"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Student Profile & History */}
      {selectedStudentId && (
        <div className="modal-backdrop" onClick={() => setSelectedStudentId(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">Student Profile</div>
              <button className="modal-close" onClick={() => setSelectedStudentId(null)}>×</button>
            </div>

            {profileLoading || !profileData ? (
              <div className="loading" style={{ padding: '40px 0' }}>Loading profile details…</div>
            ) : (
              <div>
                {/* Profile Header Info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
                      {profileData.user.fullName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h2 style={{ fontSize: 20, marginBottom: 2 }}>{profileData.user.fullName}</h2>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>{profileData.user.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${profileData.user.enabled ? 'badge-success' : 'badge-danger'}`}>
                      {profileData.user.enabled ? 'Active Account' : 'Deactivated'}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleStatus(profileData.user)}
                    >
                      {profileData.user.enabled ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>

                {/* Account Details Row */}
                <div className="card" style={{ padding: 14, marginBottom: 20, background: 'var(--surface-raised)', display: 'flex', justifyContent: 'space-around', fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Registered: </span>
                    <strong>{new Date(profileData.user.createdAt).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Last Login: </span>
                    <strong>{profileData.user.lastLoginAt ? new Date(profileData.user.lastLoginAt).toLocaleString() : 'Never'}</strong>
                  </div>
                </div>

                {/* Performance Stats KPI Grid */}
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>Performance Summary</h3>
                <div className="grid grid-4" style={{ marginBottom: 20 }}>
                  <div className="card stat-card" style={{ padding: 14 }}>
                    <div className="stat-value">{profileData.stats.quizzesAttempted}</div>
                    <div className="stat-label">Quizzes Attempted</div>
                  </div>
                  <div className="card stat-card" style={{ padding: 14 }}>
                    <div className="stat-value" style={{ color: 'var(--accent)' }}>{profileData.stats.averageScore}%</div>
                    <div className="stat-label">Average Score</div>
                  </div>
                  <div className="card stat-card" style={{ padding: 14 }}>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>{profileData.stats.highestScore}%</div>
                    <div className="stat-label">Highest Score</div>
                  </div>
                  <div className="card stat-card" style={{ padding: 14 }}>
                    <div className="stat-value">
                      <span style={{ color: 'var(--success)' }}>{profileData.stats.quizzesPassed}</span> / {profileData.stats.quizzesAttempted}
                    </div>
                    <div className="stat-label">Quizzes Passed</div>
                  </div>
                </div>

                {/* Category Performance Breakdown */}
                {profileData.categoryPerformance.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, marginBottom: 12 }}>Performance by Category</h3>
                    <div className="card" style={{ padding: 16 }}>
                      {profileData.categoryPerformance.map((c) => (
                        <div key={c.categoryName} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 4 }}>
                            <span>{c.categoryName} <span style={{ color: 'var(--text-muted)' }}>({c.attempts} attempts)</span></span>
                            <span style={{ fontWeight: 700 }}>{c.averagePercentage}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${Math.max(0, c.averagePercentage)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attempt History Table */}
                <div>
                  <h3 style={{ fontSize: 16, marginBottom: 12 }}>Quiz Attempt History</h3>
                  {profileData.history.length === 0 ? (
                    <div className="card empty-state" style={{ padding: 24 }}>This student has not completed any quizzes yet.</div>
                  ) : (
                    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Quiz Title</th>
                            <th>Status</th>
                            <th>Score</th>
                            <th>Result</th>
                            <th>Date</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {profileData.history.map((h) => (
                            <tr key={h.attemptId}>
                              <td style={{ padding: '10px 10px', fontWeight: 500 }}>{h.quizTitle}</td>
                              <td><span className="badge badge-muted">{h.status.replace('_', ' ')}</span></td>
                              <td style={{ fontWeight: 700 }}>{Math.round(h.percentage * 10) / 10}%</td>
                              <td>
                                <span className={`badge ${h.passed ? 'badge-success' : 'badge-danger'}`}>
                                  {h.passed ? 'Passed' : 'Failed'}
                                </span>
                              </td>
                              <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                                {h.submittedAt ? new Date(h.submittedAt).toLocaleDateString() : '—'}
                              </td>
                              <td>
                                <Link
                                  to={`/result/${h.attemptId}`}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '3px 8px', fontSize: 11 }}
                                >
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

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setSelectedStudentId(null)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Admin Reset Student Password */}
      {resetTargetUser && (
        <div className="modal-backdrop" onClick={() => setResetTargetUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Reset Student Password</div>
              <button className="modal-close" onClick={() => setResetTargetUser(null)}>×</button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              Set a new password for <strong>{resetTargetUser.fullName}</strong> ({resetTargetUser.email}).
            </p>

            {resetError && <div className="error-box">{resetError}</div>}

            <form onSubmit={handleAdminResetPassword}>
              <div className="field">
                <label>New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setResetTargetUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={resetBusy}
                >
                  {resetBusy ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
