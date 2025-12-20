import { useAppNotifications } from "@/hooks/useNotifications";

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  useAppNotifications();
  return <>{children}</>;
};

export default NotificationProvider;
