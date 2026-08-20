import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setBusy(true);

    try {
      const data = await api.post('/auth/forgot-password', { email });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to process password reset request');
    } finally {
      setBusy(false);
    }
  }

  function handleProceedToReset() {
    if (result?.resetToken) {
      navigate(`/reset-password?token=${encodeURIComponent(result.resetToken)}&email=${encodeURIComponent(email)}`);
    } else {
      navigate('/reset-password');
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="eyebrow">Quizly Security</div>
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-sub">
          Enter your registered email address to generate a secure password reset token.
        </p>

        {error && <div className="error-box">{error}</div>}

        {result ? (
          <div>
            <div className="success-box">
              {result.message}
            </div>

            {result.resetToken && (
              <div className="token-callout">
                <div className="token-callout-label">Your Reset Token (Valid for 30 min)</div>
                <code className="token-code">{result.resetToken}</code>
              </div>
            )}

            <button
              className="btn btn-primary btn-block"
              onClick={handleProceedToReset}
              style={{ marginTop: 16 }}
            >
              Proceed to Set New Password →
            </button>

            <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
              Remembered your password? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Account Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
              />
            </div>

            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Generating token…' : 'Generate Reset Token'}
            </button>

            <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                ← Back to Login
              </Link>
              <Link to="/reset-password" style={{ color: 'var(--text-muted)' }}>
                Have a token? Reset here
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
