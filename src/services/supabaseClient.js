import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qgfwrpvelecpavcbhsmo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2Q4UkkAn1IRi1YSSWgmV2Q_cH01bLGw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Google OAuth Sign In — uses FastAPI backend /auth/google endpoint
// Falls back to Google Identity Services (GIS) or demo session
export const signInWithGoogle = async () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Strategy 1: Use Google Identity Services (GIS) to get credential,
  // then send to FastAPI backend
  if (GOOGLE_CLIENT_ID && typeof window !== 'undefined' && window.google?.accounts?.id) {
    return new Promise((resolve, reject) => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const backendRes = await fetch(`${BACKEND_URL}/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential }),
            });
            if (!backendRes.ok) {
              const err = await backendRes.json();
              throw new Error(err.detail || 'Google authentication failed');
            }
            const data = await backendRes.json();
            // Store token for subsequent API calls
            localStorage.setItem('ri_jwt_token', data.access_token);
            localStorage.setItem('ri_jwt_role', data.role);
            localStorage.setItem('ri_jwt_user_id', String(data.user_id));
            resolve(data);
          } catch (err) {
            reject(err);
          }
        },
      });
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // GIS prompt was blocked; try redirect flow
          window.location.href = `${BACKEND_URL}/auth/google/login`;
        }
      });
    });
  }

  // Strategy 2: Redirect to backend's Google OAuth login page
  if (GOOGLE_CLIENT_ID) {
    window.location.href = `${BACKEND_URL}/auth/google/login`;
    return { redirecting: true };
  }

  // Strategy 3: Fallback — no Google client ID configured
  throw new Error('Google authentication is not configured. Set VITE_GOOGLE_CLIENT_ID in .env');
};


// Email & Password Sign Up
export const signUpWithEmail = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
};

// Email & Password Sign In
export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

// Sign Out
export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Signout error:', error);
  localStorage.removeItem('ri_demo_user');
  localStorage.removeItem('ri_user_profile');
};

// Fetch current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('Session check warning:', error.message);
    return null;
  }
  return session;
};
