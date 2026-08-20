import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('quizly_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  function persist(authResponse) {
    localStorage.setItem('quizly_token', authResponse.token);
    const u = {
      id: authResponse.userId,
      fullName: authResponse.fullName,
      email: authResponse.email,
      role: authResponse.role,
    };
    localStorage.setItem('quizly_user', JSON.stringify(u));
    setUser(u);
    return u;
  }

  async function login(email, password, expectedRole) {
    const res = await api.post('/auth/login', { email, password });
    if (expectedRole && res.role !== expectedRole) {
      if (expectedRole === 'ADMIN') {
        throw new Error('Access denied: This account is a Student account. Please use the Student Login tab.');
      } else {
        throw new Error('Access denied: This account is an Administrator account. Please use the Admin Login tab.');
      }
    }
    return persist(res);
  }

  async function register(fullName, email, password) {
    const res = await api.post('/auth/register', { fullName, email, password });
    return persist(res);
  }

  function logout() {
    localStorage.removeItem('quizly_token');
    localStorage.removeItem('quizly_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
