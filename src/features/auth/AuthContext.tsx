// =============================================================================
// AuthContext – session, profile, and auth actions
// =============================================================================
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getProfile, signOut as authSignOut } from '../../lib/services/auth.service';
import type { Profile } from '../../lib/database.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

// ─── Mock data (dev without .env) ─────────────────────────────────────────────

const MOCK_SESSION = { user: { id: 'dev-user' } } as unknown as Session;
const MOCK_PROFILE: Profile = {
  id: 'dev-user',
  display_name: 'Dev User',
  handle: 'devuser',
  avatar_url: null,
  created_at: new Date().toISOString(),
};

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─ Fetch profile helper ──────────────────────────────────────────────────

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const data = await getProfile(userId);
      setProfile(data);
    } catch (e) {
      console.error('[AuthContext] fetchProfile error', e);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─ Boot: read existing session + subscribe to changes ────────────────────

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured!");
      setIsLoading(false);
      return;
    }

    // Get the persisted session (from SecureStore)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for future auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ─ Public actions ────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await authSignOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
