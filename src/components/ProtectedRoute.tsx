import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session, loading } = useAuth();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile();
  const location = useLocation();

  // Show loading while auth or profile is being determined
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No user or no session = redirect to auth
  // This catches cases where session expired or refresh token is invalid
  if (!user || !session) {
    return <Navigate to="/auth" replace />;
  }

  // If profile fetch failed (e.g., due to auth issues), redirect to auth
  if (profileError) {
    console.warn('[ProtectedRoute] Profile fetch failed, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Redirect to onboarding if profile is incomplete (no name set)
  const isOnboardingRoute = location.pathname === "/onboarding";
  const needsOnboarding = profile && !profile.name;

  if (needsOnboarding && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
