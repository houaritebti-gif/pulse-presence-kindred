import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { preloadCriticalRoutes } from "@/utils/lazyWithRetry";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

/**
 * Fail-safe default context.
 *
 * Why: In dev/HMR or during certain initialization races, some modules can render
 * briefly without the provider, which previously caused a hard crash and blank screen.
 * With a safe default, the app stays up and simply behaves as unauthenticated.
 */
const DEFAULT_AUTH_CONTEXT: AuthContextType = {
  user: null,
  session: null,
  loading: true,
  signOut: async () => {
    // no-op when AuthProvider is not mounted
  },
};

const AuthContext = createContext<AuthContextType>(DEFAULT_AUTH_CONTEXT);

/**
 * Check if an error indicates the session is invalid and should be cleared
 */
const isInvalidSessionError = (error: AuthError | null): boolean => {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('refresh_token_not_found') ||
    message.includes('invalid refresh token') ||
    message.includes('session_not_found') ||
    message.includes('invalid session') ||
    error.status === 401 ||
    error.status === 403
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Force clear invalid session and redirect to login
   * This handles cases where the refresh token is expired/invalid
   */
  const handleInvalidSession = useCallback(async () => {
    console.warn('[Auth] Invalid session detected, clearing auth state');
    setSession(null);
    setUser(null);
    
    // Try to sign out cleanly (may fail if already invalid, that's ok)
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      // Ignore errors during cleanup
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // Handle token refresh failures
        if (event === 'TOKEN_REFRESHED' && !currentSession) {
          await handleInvalidSession();
          setLoading(false);
          return;
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        // Preload critical routes after successful login
        if (event === 'SIGNED_IN' && currentSession) {
          preloadCriticalRoutes();
        }
      }
    );

    // THEN check for existing session
    const initSession = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        // Check for invalid session errors
        if (error && isInvalidSessionError(error)) {
          await handleInvalidSession();
          setLoading(false);
          return;
        }
        
        // If we have a session, verify it's still valid by trying to refresh
        if (existingSession) {
          // Attempt a silent token refresh to ensure session is valid
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError && isInvalidSessionError(refreshError)) {
            await handleInvalidSession();
            setLoading(false);
            return;
          }
        }
        
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        setLoading(false);
        
        // Also preload if already logged in
        if (existingSession) {
          preloadCriticalRoutes();
        }
      } catch (error) {
        console.error('[Auth] Error initializing session:', error);
        // On any error, clear state and let user re-login
        await handleInvalidSession();
        setLoading(false);
      }
    };
    
    initSession();

    return () => subscription.unsubscribe();
  }, [handleInvalidSession]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
