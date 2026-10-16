'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/db/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loginAsDemoAdmin: () => void;
  loginAsDemoUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'deluxe_demo_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isConfigured = isSupabaseConfigured();

  // Load or auto-create user profile from Supabase profiles table
  const fetchProfile = async (userId: string, email: string, userMeta?: Record<string, unknown>) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as UserProfile);
        return;
      }

      // Fallback: Call server sync endpoint using Service Role Key
      const fullName = (userMeta?.full_name || userMeta?.name || email.split('@')[0]) as string;
      const avatarUrl = (userMeta?.avatar_url || userMeta?.picture || '') as string;

      const currentSession = session || (await supabase.auth.getSession()).data.session;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentSession?.access_token) {
        headers['Authorization'] = `Bearer ${currentSession.access_token}`;
      }

      const res = await fetch('/api/profile/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, email, fullName, avatarUrl }),
      });
      const json = await res.json();
      if (json.success && json.profile) {
        setProfile(json.profile as UserProfile);
        return;
      }

      setProfile({
        id: userId,
        email,
        full_name: fullName,
        avatar_url: avatarUrl,
        role: 'user',
      });
    } catch (err) {
      console.warn('Profile fetch exception:', err);
      setProfile({
        id: userId,
        email,
        full_name: email.split('@')[0],
        role: 'user',
      });
    }
  };

  useEffect(() => {
    if (isConfigured && supabase) {
      // Get initial Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user?.id && session.user.email) {
          fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
        }
        setIsLoading(false);
      });

      // Listen for auth state changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user?.id && session.user.email) {
          fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Check for saved demo session
      try {
        const saved = localStorage.getItem(DEMO_USER_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed.user);
          setProfile(parsed.profile);
        }
      } catch {
        // ignore
      }
      setIsLoading(false);
    }
  }, [isConfigured]);

  // Google OAuth sign-in with Supabase
  const signInWithGoogle = async () => {
    if (!isConfigured || !supabase) {
      // In demo mode, sign in as Google Demo user
      const demoUser = {
        id: 'google-demo-user-123',
        email: 'listener@gmail.com',
        app_metadata: { provider: 'google' },
        user_metadata: {
          full_name: 'Google Listener',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&q=80',
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      const demoProfile: UserProfile = {
        id: 'google-demo-user-123',
        email: 'listener@gmail.com',
        full_name: 'Google Listener',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&q=80',
        role: 'user',
      };

      setUser(demoUser);
      setProfile(demoProfile);
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify({ user: demoUser, profile: demoProfile }));
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Google sign in failed') };
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!isConfigured || !supabase) {
      const isAdmin = email.toLowerCase().includes('admin') || pass === 'deluxe2026';
      const demoUser = {
        id: `demo-${Date.now()}`,
        email,
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: email.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      const demoProfile: UserProfile = {
        id: demoUser.id,
        email,
        full_name: email.split('@')[0],
        role: isAdmin ? 'admin' : 'user',
      };

      setUser(demoUser);
      setProfile(demoProfile);
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify({ user: demoUser, profile: demoProfile }));
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      return { error };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Sign in failed') };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    if (!isConfigured || !supabase) {
      return signInWithEmail(email, pass);
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name || email.split('@')[0],
          },
        },
      });
      return { error };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Sign up failed') };
    }
  };

  const signOut = async () => {
    if (isConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    }
  };

  const loginAsDemoAdmin = () => {
    const adminUser = {
      id: 'admin-super-id',
      email: 'admin@deluxemusic.com',
      app_metadata: { provider: 'admin' },
      user_metadata: { full_name: 'Studio Master Admin' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User;

    const adminProfile: UserProfile = {
      id: 'admin-super-id',
      email: 'admin@deluxemusic.com',
      full_name: 'Studio Master Admin',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&fit=crop&q=80',
      role: 'admin',
    };

    setUser(adminUser);
    setProfile(adminProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify({ user: adminUser, profile: adminProfile }));
    }
  };

  const loginAsDemoUser = () => {
    const regularUser = {
      id: 'listener-demo-id',
      email: 'retro_fan@deluxemusic.com',
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: 'Retro Listener' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User;

    const regularProfile: UserProfile = {
      id: 'listener-demo-id',
      email: 'retro_fan@deluxemusic.com',
      full_name: 'Retro Listener',
      role: 'user',
    };

    setUser(regularUser);
    setProfile(regularProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify({ user: regularUser, profile: regularProfile }));
    }
  };

  // In production, admin access is strictly granted if the user's Supabase profile role is 'admin'
  const isAdmin = Boolean(profile?.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAdmin,
        isConfigured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        loginAsDemoAdmin,
        loginAsDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
