import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

export const PushNotificationToggle = () => {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } = usePushNotifications();
  const [toggling, setToggling] = useState(false);

  if (!isSupported) {
    return (
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-body text-sm text-muted-foreground">
              Push no disponible
            </p>
            <p className="font-body text-xs text-muted-foreground/70">
              Tu navegador no soporta notificaciones push
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleToggle = async () => {
    setToggling(true);
    try {
      if (isSubscribed) {
        const success = await unsubscribe();
        if (success) {
          toast.success("Notificaciones desactivadas");
        } else {
          toast.error("Error al desactivar notificaciones");
        }
      } else {
        const success = await subscribe();
        if (success) {
          toast.success("¡Notificaciones activadas!");
        } else if (permission === "denied") {
          toast.error("Permiso denegado. Activa las notificaciones en ajustes del navegador.");
        } else {
          toast.error("Error al activar notificaciones");
        }
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setToggling(false);
    }
  };

  const loading = isLoading || toggling;

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isSubscribed ? "bg-primary/10" : "bg-muted"
        }`}>
          {loading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : isSubscribed ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-display font-semibold text-foreground text-sm">
            Notificaciones push
          </p>
          <p className="font-body text-xs text-muted-foreground">
            {isSubscribed 
              ? "Recibirás alertas aunque la app esté cerrada" 
              : "Activa para no perderte nada"}
          </p>
        </div>
      </div>
      <Switch
        checked={isSubscribed}
        onCheckedChange={handleToggle}
        disabled={loading}
      />
    </div>
  );
};
