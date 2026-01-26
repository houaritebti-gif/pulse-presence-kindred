import { useEffect, useState } from "react";
import { useAppNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Internal component that initializes notifications only when auth is ready
 */
const NotificationInitializer = () => {
  const { user, loading } = useAuth();
  
  // Only set up notifications when we have a logged-in user
  // Skip during loading or when no user is present
  useAppNotifications();
  
  return null;
};

/**
 * Safe wrapper that only renders NotificationInitializer when inside AuthProvider
 * This prevents the "useAuth must be used within an AuthProvider" error
 */
const SafeNotificationInitializer = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Defer initialization to ensure AuthProvider is mounted
    const timer = requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  if (!isReady) return null;

  return <NotificationInitializer />;
};

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
