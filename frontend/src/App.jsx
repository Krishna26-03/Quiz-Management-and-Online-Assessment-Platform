import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Leaderboard from './pages/Leaderboard';

import QuizList from './pages/student/QuizList';
import QuizAttempt from './pages/student/QuizAttempt';
import Result from './pages/student/Result';
import History from './pages/student/History';
import Performance from './pages/student/Performance';
import Dashboard from './pages/student/Dashboard';

import AdminQuizzes from './pages/admin/AdminQuizzes';
import QuizEditor from './pages/admin/QuizEditor';
import ManageStudents from './pages/admin/ManageStudents';
import ManageUsers from './pages/admin/ManageUsers';
import ManageCategories from './pages/admin/ManageCategories';
import Analytics from './pages/admin/Analytics';

function Shell() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
        <Route path="/reset-password" element={user ? <Navigate to="/" replace /> : <ResetPassword />} />

        <Route path="/" element={<Navigate to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} replace />} />

        {/* Student */}
        <Route path="/dashboard" element={<ProtectedRoute requireRole="STUDENT"><Dashboard /></ProtectedRoute>} />
        <Route path="/quizzes" element={<ProtectedRoute requireRole="STUDENT"><QuizList /></ProtectedRoute>} />
        <Route path="/attempt/:attemptId" element={<ProtectedRoute requireRole="STUDENT"><QuizAttempt /></ProtectedRoute>} />
        <Route path="/result/:attemptId" element={<ProtectedRoute requireRole="STUDENT"><Result /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute requireRole="STUDENT"><History /></ProtectedRoute>} />
        <Route path="/performance" element={<ProtectedRoute requireRole="STUDENT"><Performance /></ProtectedRoute>} />

        {/* Shared - any authenticated user */}
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute requireRole="ADMIN"><Analytics /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute requireRole="ADMIN"><Analytics /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute requireRole="ADMIN"><ManageStudents /></ProtectedRoute>} />
        <Route path="/admin/quizzes" element={<ProtectedRoute requireRole="ADMIN"><AdminQuizzes /></ProtectedRoute>} />
        <Route path="/admin/quizzes/:quizId" element={<ProtectedRoute requireRole="ADMIN"><QuizEditor /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireRole="ADMIN"><ManageUsers /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute requireRole="ADMIN"><ManageCategories /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
