import { useAppNotifications } from "@/hooks/useNotifications";

// Provider component for app-wide notifications
const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  useAppNotifications();
  return <>{children}</>;
};

export default NotificationProvider;
