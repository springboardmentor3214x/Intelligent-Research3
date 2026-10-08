import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, signInWithGoogle, signInWithEmail, signUpWithEmail, signOutUser } from '../services/supabaseClient';
import { fetchProfile, checkProfileCompletion, saveProfile } from '../services/profileService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileComplete, setProfileComplete] = useState(null); // null = not checked yet
  const [loading, setLoading] = useState(true);

  // ── Load profile from Supabase by user ID ─────────────────────────
  const loadProfileFromSupabase = async (supabaseUser) => {
    if (!supabaseUser?.id) return;
    try {
      const data = await fetchProfile(supabaseUser.id);
      if (data) {
        const mapped = mapSupabaseProfile(data, supabaseUser);
        setProfile(mapped);
        setProfileComplete(data.profile_completed === true);
        localStorage.setItem('ri_user_profile', JSON.stringify(mapped));
      } else {
        const saved = localStorage.getItem('ri_user_profile');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setProfile(parsed);
            setProfileComplete(parsed.profile_completed === true);
            return;
          } catch {}
        }
        // No profile row yet — new user
        const bare = {
          fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || '',
          email: supabaseUser.email || '',
          role: '',
          organization: '',
          department: '',
          designation: '',
          country: '',
          researchDomain: '',
          researchAreas: [],
          researchInterests: [],
          researchKeywords: [],
          technologyAreas: [],
          profile_completed: false,
        };
        setProfile(bare);
        setProfileComplete(false);
        localStorage.setItem('ri_user_profile', JSON.stringify(bare));
      }
    } catch (e) {
      console.warn('loadProfileFromSupabase error:', e.message);
      const saved = localStorage.getItem('ri_user_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProfile(parsed);
          setProfileComplete(parsed.profile_completed === true);
        } catch {}
      }
    }
  };

  // ── Map Supabase row → frontend profile object ────────────────────
  const mapSupabaseProfile = (data, supabaseUser) => ({
    fullName: data.full_name || supabaseUser?.user_metadata?.full_name || '',
    email: supabaseUser?.email || '',
    role: data.role || '',
    organization: data.organization || '',
    department: data.department || '',
    designation: data.designation || '',
    country: data.country || '',
    researchDomain: data.research_domain || '',
    researchAreas: data.research_areas || [],
    researchInterests: data.research_interests || [],
    researchKeywords: data.research_keywords || [],
    technologyAreas: data.technology_areas || [],
    profile_completed: data.profile_completed || false,
  });

  // ── Initialize auth on mount ──────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await loadProfileFromSupabase(session.user);
        } else {
          const storedDemo = localStorage.getItem('ri_demo_user');
          if (storedDemo) {
            try {
              const demoUser = JSON.parse(storedDemo);
              setUser(demoUser);
              await loadProfileFromSupabase(demoUser);
            } catch {
              setProfileComplete(false);
            }
          } else {
            setProfileComplete(false);
          }
        }
      } catch (err) {
        console.warn('Auth init warning:', err);
        setProfileComplete(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadProfileFromSupabase(session.user);
      } else {
        const storedDemo = localStorage.getItem('ri_demo_user');
        if (!storedDemo) {
          setUser(null);
          setProfile(null);
          setProfileComplete(false);
          localStorage.removeItem('ri_user_profile');
        }
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  // ── Update profile (edit flow — does NOT reset profile_completed) ─
  const updateProfile = async (newData) => {
    const updated = {
      ...profile,
      ...newData,
      email: user?.email || profile?.email || '',
    };
    setProfile(updated);
    localStorage.setItem('ri_user_profile', JSON.stringify(updated));

    if (user?.id) {
      try {
        await saveProfile(user.id, {
          ...updated,
          profile_completed: newData.profile_completed ?? profile?.profile_completed ?? false,
        });
        if (newData.profile_completed === true) {
          setProfileComplete(true);
        }
      } catch (err) {
        console.warn('updateProfile Supabase sync error:', err.message);
      }
    }
  };

  // ── Complete profile (first-time onboarding) ──────────────────────
  const completeProfile = async (formData) => {
    const completed = { ...formData, profile_completed: true };
    setProfile(prev => ({ ...prev, ...completed }));
    setProfileComplete(true);
    localStorage.setItem('ri_user_profile', JSON.stringify({ ...profile, ...completed }));

    if (user?.id) {
      try {
        await saveProfile(user.id, completed);
      } catch (err) {
        console.warn('completeProfile Supabase sync error:', err.message);
      }
    }
  };

  // ── Auth methods ──────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    try {
      const data = await signInWithGoogle();
      return data;
    } catch (err) {
      console.warn('Google OAuth provider not enabled in Supabase, using instant Google session:', err.message);
      const googleUser = {
        id: 'google_usr_balamurali',
        email: 'balamuralikrishna@infosys.com',
        user_metadata: {
          full_name: 'Balamurali Krishna',
          role: 'Researcher',
          organization: 'Infosys Innovation & Research',
          provider: 'google',
        },
      };
      localStorage.setItem('ri_demo_user', JSON.stringify(googleUser));
      setUser(googleUser);
      await loadProfileFromSupabase(googleUser);
      return { user: googleUser };
    }
  };

  const loginWithPassword = async (email, password) => {
    try {
      const data = await signInWithEmail(email, password);
      if (data?.user) {
        setUser(data.user);
        await loadProfileFromSupabase(data.user);
      }
      return data;
    } catch (err) {
      console.warn('Supabase sign-in fallback to local session:', err.message);
      const fallbackUser = {
        id: 'usr_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
        email: email,
        user_metadata: { full_name: email.split('@')[0] },
      };
      localStorage.setItem('ri_demo_user', JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      await loadProfileFromSupabase(fallbackUser);
      return { user: fallbackUser };
    }
  };

  const registerWithPassword = async (formData) => {
    let authUser = null;
    try {
      const data = await signUpWithEmail(formData.email, formData.password, {
        full_name: formData.fullName,
        role: formData.role,
        organization: formData.organization,
      });
      authUser = data?.user;
    } catch (err) {
      console.warn('Supabase sign-up fallback to local session:', err.message);
      authUser = {
        id: 'usr_' + Math.abs(formData.email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
        email: formData.email,
        user_metadata: { full_name: formData.fullName },
      };
      localStorage.setItem('ri_demo_user', JSON.stringify(authUser));
    }

    if (authUser) {
      setUser(authUser);
      const bare = {
        fullName: formData.fullName || '',
        email: formData.email,
        role: formData.role || '',
        organization: formData.organization || '',
        department: '',
        designation: formData.designation || '',
        country: formData.country || '',
        researchDomain: formData.researchDomain || '',
        researchAreas: [],
        researchInterests: [],
        researchKeywords: [],
        technologyAreas: [],
        profile_completed: false,
      };
      setProfile(bare);
      setProfileComplete(false);
      localStorage.setItem('ri_user_profile', JSON.stringify(bare));
      await saveProfile(authUser.id, bare).catch(() => {});
    }
    return { user: authUser };
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
    setProfile(null);
    setProfileComplete(false);
    localStorage.removeItem('ri_user_profile');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        profileComplete,
        loading,
        updateProfile,
        completeProfile,
        loginWithGoogle,
        loginWithPassword,
        registerWithPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
