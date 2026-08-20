import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;
  const isAdmin = user.role === 'ADMIN';

  const studentLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/quizzes', label: 'Quizzes' },
    { to: '/history', label: 'History' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/performance', label: 'My Performance' },
  ];
  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/quizzes', label: 'Quizzes' },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/students', label: 'Students' },
    { to: '/admin/users', label: 'Users' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ];
  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="brand-mark">Q</div>
          Quizly
        </div>
        <nav className="nav-links">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="user-chip">
          <div className="avatar">{user.fullName?.[0]?.toUpperCase() || '?'}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login'); }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
