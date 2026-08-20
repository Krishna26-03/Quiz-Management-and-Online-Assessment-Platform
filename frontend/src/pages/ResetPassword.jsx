import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await api.post('/auth/reset-password', {
        token: token.trim(),
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The token may be expired or invalid.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="eyebrow">Quizly Security</div>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-sub">
          Enter your password reset token and choose a new password.
        </p>

        {error && <div className="error-box">{error}</div>}

        {success ? (
          <div>
            <div className="success-box">
              Your password has been reset successfully! You can now sign in with your new credentials.
            </div>
            <button
              className="btn btn-primary btn-block"
              onClick={() => navigate('/login')}
              style={{ marginTop: 16 }}
            >
              Go to Sign in →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Reset Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              />
            </div>

            <div className="field">
              <label>New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="field">
              <label>Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            <button className="btn btn-primary btn-block" disabled={busy} style={{ marginTop: 8 }}>
              {busy ? 'Updating password…' : 'Reset Password'}
            </button>

            <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                ← Back to Login
              </Link>
              <Link to="/forgot-password" style={{ color: 'var(--text-muted)' }}>
                Request new token
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
