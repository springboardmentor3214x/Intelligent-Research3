/**
 * AuthContext.jsx
 * Author: Kaviya (Member 4 — Pair B Frontend)
 *
 * Provides global authentication state:
 *   - token     : JWT string stored in localStorage
 *   - user      : { id, email, name, role } object
 *   - role      : shorthand derived from user.role
 *   - isAuthenticated : boolean
 *   - loading   : true while fetching /users/me on mount
 *
 * Exposed actions:
 *   - login(token, user)   : called by Login page after successful POST /auth/login
 *   - logout()             : clears state + localStorage, redirects to /login
 *   - refreshUser()        : re-fetches /users/me and updates user state
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../services/api';

/* ── Context creation ── */
const AuthContext = createContext(null);

/* ── Provider ── */
export function AuthProvider({ children }) {
  /* Initialise from localStorage so state persists across page reloads */
  const [token, setToken] = useState(
    () => localStorage.getItem('auth_token') || ''
  );
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!!localStorage.getItem('auth_token'));

  const navigate = useNavigate();

  /* ── On mount: if we have a stored token, validate it with /users/me ── */
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await getMe();
        if (!cancelled) {
          setUser(data);
          localStorage.setItem('auth_user', JSON.stringify(data));
        }
      } catch {
        /* Token is invalid / expired — clean up */
        if (!cancelled) {
          _clearStorage();
          setToken('');
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  /* ── Helpers ── */
  function _clearStorage() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  /* ── login() — called by Login page after successful API response ── */
  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  /* ── logout() — clears everything and redirects to /login ── */
  const logout = useCallback(() => {
    _clearStorage();
    setToken('');
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  /* ── refreshUser() — re-fetches /users/me (e.g., after profile update) ── */
  const refreshUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data);
      localStorage.setItem('auth_user', JSON.stringify(data));
      return data;
    } catch {
      logout();
    }
  }, [logout]);

  /* ── Memoised context value ── */
  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role ?? null,
      isAuthenticated: !!token && !!user,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [token, user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ── Hook ── */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
