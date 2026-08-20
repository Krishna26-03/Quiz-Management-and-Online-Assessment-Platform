import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function ManageUsers() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', password: '', role: 'ADMIN' });
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState('');

  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');

  function load() {
    api.get('/admin/users')
      .then(setUsers)
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  function notify(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setCreateError('');
    setCreateBusy(true);
    try {
      await api.post('/admin/users', createForm);
      setShowCreateModal(false);
      setCreateForm({ fullName: '', email: '', password: '', role: 'ADMIN' });
      notify(`Successfully created new ${createForm.role.toLowerCase()}: ${createForm.email}`);
      load();
    } catch (err) {
      setCreateError(err.message || 'Failed to create user');
    } finally {
      setCreateBusy(false);
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
      load();
    } catch (err) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetBusy(false);
    }
  }

  async function toggleEnabled(u) {
    try {
      await api.put(`/admin/users/${u.id}`, { enabled: !u.enabled });
      notify(`Account for ${u.email} is now ${!u.enabled ? 'Active' : 'Disabled'}.`);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleRole(u) {
    const nextRole = u.role === 'ADMIN' ? 'STUDENT' : 'ADMIN';
    if (!confirm(`Change ${u.fullName}'s role from ${u.role} to ${nextRole}?`)) return;
    try {
      await api.put(`/admin/users/${u.id}`, { role: nextRole });
      notify(`Updated ${u.email} role to ${nextRole}.`);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(id, email) {
    if (!confirm(`Delete user "${email}" and all their test history? This action cannot be undone.`)) return;
    try {
      await api.del(`/admin/users/${id}`);
      notify(`Deleted user ${email}.`);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  const filteredUsers = users?.filter(u => {
    if (roleFilter === 'ADMIN') return u.role === 'ADMIN';
    if (roleFilter === 'STUDENT') return u.role === 'STUDENT';
    return true;
  });

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <div className="eyebrow">Administration</div>
            <h1 className="page-title">User & Admin Management</h1>
            <p className="page-subtitle">
              Manage accounts, create additional administrators, and configure user permissions.
            </p>
          </div>
          <div>
            <button className="btn btn-primary" onClick={() => { setShowCreateModal(true); setCreateError(''); }}>
              + Create User / Admin
            </button>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}
        {successMsg && <div className="success-box">{successMsg}</div>}

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['ALL', 'ADMIN', 'STUDENT'].map((rf) => (
            <button
              key={rf}
              className={`btn btn-sm ${roleFilter === rf ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRoleFilter(rf)}
            >
              {rf === 'ALL' ? 'All Accounts' : `${rf}s`} {users && `(${rf === 'ALL' ? users.length : users.filter(u => u.role === rf).length})`}
            </button>
          ))}
        </div>

        {!users ? (
          <div className="loading">Loading accounts…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="card empty-state">No users found under this filter.</div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td style={{ padding: '14px 10px', fontWeight: 600 }}>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-accent' : 'badge-muted'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.enabled ? 'badge-success' : 'badge-danger'}`}>
                        {u.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setResetTargetUser(u); setResetPassword(''); setResetError(''); }}
                          title="Set a new password for this user"
                        >
                          Reset Pwd
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleRole(u)}
                          title={`Switch role to ${u.role === 'ADMIN' ? 'STUDENT' : 'ADMIN'}`}
                        >
                          Make {u.role === 'ADMIN' ? 'Student' : 'Admin'}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleEnabled(u)}
                        >
                          {u.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => remove(u.id, u.email)}
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

      {/* Modal: Create User / Admin */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Create Account</div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            {createError && <div className="error-box">{createError}</div>}

            <form onSubmit={handleCreateUser}>
              <div className="field">
                <label>Account Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  <option value="ADMIN">Administrator (Full Access)</option>
                  <option value="STUDENT">Student (Quiz Taker)</option>
                </select>
              </div>

              <div className="field">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="e.g. Alex Smith"
                />
              </div>

              <div className="field">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="alex@quizplatform.com"
                />
              </div>

              <div className="field">
                <label>Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="At least 6 characters"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={createBusy}
                >
                  {createBusy ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Admin Reset User Password */}
      {resetTargetUser && (
        <div className="modal-backdrop" onClick={() => setResetTargetUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Reset Password</div>
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
