import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * requireRole: 'ADMIN' | 'STUDENT' | undefined
 *   - undefined = any authenticated user may view this route (e.g. the shared leaderboard)
 *   - 'ADMIN' / 'STUDENT' = only that role may view it; the other role is redirected home
 */
export default function ProtectedRoute({ children, requireRole }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireRole && user.role !== requireRole) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/quizzes' : '/quizzes'} replace />;
  }

  return children;
}
