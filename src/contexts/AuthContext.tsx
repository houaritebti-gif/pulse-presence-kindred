import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Preload critical routes after successful login
        if (event === 'SIGNED_IN' && session) {
          preloadCriticalRoutes();
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Also preload if already logged in
      if (session) {
        preloadCriticalRoutes();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
