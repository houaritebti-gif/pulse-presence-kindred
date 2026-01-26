import { useAppNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

const NotificationInitializer = () => {
  // Only initialize notifications when auth context is available
  const { user, loading } = useAuth();
  
  // Skip notification setup if auth is still loading or no user
  useAppNotifications();
  
  return null;
};

// Provider component for app-wide notifications
const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <NotificationInitializer />
      {children}
    </>
  );
};

export default NotificationProvider;

