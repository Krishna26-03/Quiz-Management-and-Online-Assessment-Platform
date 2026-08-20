import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('STUDENT'); // 'STUDENT' | 'ADMIN'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password, activeTab);
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/quizzes');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setBusy(false);
    }
  }

  function handleQuickFillAdmin() {
    setEmail('admin@quizplatform.com');
    setPassword('Admin@123');
    setError('');
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="eyebrow">Quizly Assessment Platform</div>
        <h1 className="auth-title">
          {activeTab === 'ADMIN' ? 'Admin Portal' : 'Welcome back'}
        </h1>
        <p className="auth-sub">
          {activeTab === 'ADMIN'
            ? 'Sign in with your administrator credentials to manage quizzes and users.'
            : 'Sign in to access quizzes and track your performance.'}
        </p>

        {/* Role Selection Tabs */}
        <div className="auth-role-tabs">
          <button
            type="button"
            className={`auth-role-tab ${activeTab === 'STUDENT' ? 'active' : ''}`}
            onClick={() => { setActiveTab('STUDENT'); setError(''); }}
          >
            Student Login
          </button>
          <button
            type="button"
            className={`auth-role-tab ${activeTab === 'ADMIN' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ADMIN'); setError(''); }}
          >
            Admin Login
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {activeTab === 'ADMIN' && (
          <div className="info-note" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Default Seed Admin: <strong>admin@quizplatform.com</strong></span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleQuickFillAdmin}
              style={{ fontSize: 11, padding: '3px 8px' }}
            >
              Fill Demo
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={activeTab === 'ADMIN' ? 'admin@quizplatform.com' : 'student@example.com'}
              autoFocus
            />
          </div>

          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ margin: 0 }}>Password</label>
              <Link
                to={`/forgot-password?role=${activeTab}`}
                style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 500 }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button className="btn btn-primary btn-block" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'Authenticating…' : (activeTab === 'ADMIN' ? 'Sign in as Admin' : 'Sign in')}
          </button>
        </form>

        {activeTab === 'STUDENT' ? (
          <p style={{ marginTop: 22, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            New student? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create an account</Link>
          </p>
        ) : (
          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Admin accounts are provisioned by existing administrators. Contact your system owner if you need access.
          </p>
        )}
      </div>
    </div>
  );
}
