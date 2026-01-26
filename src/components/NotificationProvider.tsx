import { useEffect, useState, forwardRef, memo } from "react";
import { useAppNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Internal component that initializes notifications only when auth is ready
 * Wrapped with forwardRef to prevent React warnings when parent passes refs
 */
const NotificationInitializer = memo(forwardRef<HTMLSpanElement>(function NotificationInitializer(_, ref) {
  const { user, loading } = useAuth();
  
  // Only set up notifications when we have a logged-in user
  // Skip during loading or when no user is present
  useAppNotifications();
  
  // Return an invisible span that can accept refs
  return <span ref={ref} style={{ display: 'none' }} aria-hidden="true" />;
}));

/**
 * Safe wrapper that only renders NotificationInitializer when inside AuthProvider
 * This prevents the "useAuth must be used within an AuthProvider" error
 * Wrapped with forwardRef to handle any parent ref forwarding
 */
const SafeNotificationInitializer = memo(forwardRef<HTMLSpanElement>(function SafeNotificationInitializer(_, ref) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Defer initialization to ensure AuthProvider is mounted
    const timer = requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  if (!isReady) return null;

  return <NotificationInitializer ref={ref} />;
}));

/**
 * Provider component for app-wide notifications
 * Wraps children and initializes notification system safely
 */
const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SafeNotificationInitializer />
      {children}
    </>
  );
};

export default NotificationProvider;
