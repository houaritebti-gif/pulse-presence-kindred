// Browser Notifications API utility

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const getNotificationPermission = (): NotificationPermission | null => {
  if (!("Notification" in window)) {
    return null;
  }
  return Notification.permission;
};

export const showBrowserNotification = (
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }
) => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  if (Notification.permission !== "granted") {
    console.log("Notification permission not granted");
    return;
  }

  // Only show if tab is not visible
  if (document.visibilityState === "visible") {
    return;
  }

  const notification = new Notification(title, {
    body: options?.body,
    icon: options?.icon || "/favicon.ico",
    tag: options?.tag,
  });

  if (options?.onClick) {
    notification.onclick = () => {
      window.focus();
      options.onClick?.();
      notification.close();
    };
  }

  // Auto close after 5 seconds
  setTimeout(() => notification.close(), 5000);
};
