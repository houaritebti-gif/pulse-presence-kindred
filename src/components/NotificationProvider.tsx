import { useAppNotifications } from "@/hooks/useNotifications";

// A stable key that changes on hot reload (module replacement), forcing a remount
// and avoiding React Fast Refresh hook-order mismatches.
const HOT_RELOAD_KEY = Math.random().toString(36);

const NotificationInitializer = () => {
  useAppNotifications();
  return null;
};

// Provider component for app-wide notifications
const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <NotificationInitializer key={HOT_RELOAD_KEY} />
      {children}
    </>
  );
};

export default NotificationProvider;

