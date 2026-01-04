import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Bell, CheckCheck, Sparkles, MessageCircle, Calendar, Users, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification, useDeleteReadNotifications } from "@/hooks/useNotificationCenter";
import { useRetrySuccessToast } from "@/hooks/useRetrySuccessToast";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import { SwipeableNotification } from "@/components/SwipeableNotification";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type FilterType = "all" | "spark" | "message" | "quedada";

const FILTERS: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "Todas", icon: <Bell className="w-4 h-4" /> },
  { key: "spark", label: "Sparks", icon: <Sparkles className="w-4 h-4" /> },
  { key: "message", label: "Mensajes", icon: <MessageCircle className="w-4 h-4" /> },
  { key: "quedada", label: "Quedadas", icon: <Calendar className="w-4 h-4" /> },
];

const Notifications = () => {
  const navigate = useNavigate();
  const { data: notifications, isLoading, isError, refetch, isFetching } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const deleteReadNotifications = useDeleteReadNotifications();
  const [filter, setFilter] = useState<FilterType>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteReadDialog, setShowDeleteReadDialog] = useState(false);

  useRetrySuccessToast({ isError, isLoading, isFetching, data: notifications });

  const readCount = notifications?.filter(n => n.read_at).length || 0;

  const unreadCount = notifications?.filter(n => !n.read_at).length || 0;

  const filteredNotifications = notifications?.filter(n => {
    if (filter === "all") return true;
    if (filter === "spark") return n.type === "spark";
    if (filter === "message") return n.type === "message" || n.type === "quedada_message";
    if (filter === "quedada") return n.type === "quedada" || n.type === "attendee";
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "spark":
        return <Sparkles className="w-5 h-5 text-accent" />;
      case "message":
        return <MessageCircle className="w-5 h-5 text-primary" />;
      case "quedada":
        return <Calendar className="w-5 h-5 text-accent" />;
      case "quedada_message":
        return <MessageCircle className="w-5 h-5 text-accent" />;
      case "attendee":
        return <Users className="w-5 h-5 text-primary" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.read_at) {
      markRead.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    setDeleteId(notificationId);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteNotification.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-background flex flex-col px-6 py-8 pb-24 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 font-body group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver</span>
          </button>
          <span className="font-display text-xl font-bold text-foreground">KIKI</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {readCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteReadDialog(true)}
                className="text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead.mutate()}
                className="text-xs"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Leer todo
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 max-w-lg mx-auto w-full relative z-10">
          {/* Hero */}
          <div className="text-center mb-10 animate-fade-up">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse-soft" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center ring-2 ring-primary/20 ring-offset-4 ring-offset-background">
                <Bell className="w-9 h-9 text-primary" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">
              Notificaciones
            </h1>
            <p className="font-body text-muted-foreground">
              Tu historial de actividad.
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 animate-fade-up animate-delay-100">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-body text-sm whitespace-nowrap transition-all ${
                  filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground/70 hover:bg-card/80"
                }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Bell className="w-10 h-10 text-primary animate-pulse-soft" />
            </div>
          ) : isError ? (
            <ErrorState
              icon={Bell}
              description="No pudimos cargar tus notificaciones. Revisa tu conexión."
              onRetry={() => refetch()}
              isRetrying={isFetching}
            />
          ) : filteredNotifications?.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Sin notificaciones"
              description="Cuando haya actividad, aparecerá aquí."
            />
          ) : (
            <div className="space-y-2">
              {filteredNotifications?.map((notification, index) => (
                <SwipeableNotification
                  key={notification.id}
                  onDelete={() => deleteNotification.mutate(notification.id)}
                  onMarkRead={() => markRead.mutate(notification.id)}
                  isRead={!!notification.read_at}
                >
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 animate-fade-up transition-all duration-300 border rounded-2xl ${
                      notification.read_at 
                        ? "border-transparent opacity-70" 
                        : "border-primary/20 hover:border-primary/40"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.read_at ? "bg-muted" : "bg-primary/10"
                      }`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold text-card-foreground text-sm truncate">
                            {notification.title}
                          </h3>
                          {!notification.read_at && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        {notification.description && (
                          <p className="font-body text-xs text-card-foreground/80 truncate mt-0.5">
                            {notification.description}
                          </p>
                        )}
                        <p className="font-body text-xs text-card-foreground/60 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </p>
                      </div>
                      <div className="p-2 text-card-foreground/40 flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                </SwipeableNotification>
              ))}
              <p className="text-center text-xs text-muted-foreground pt-4 font-body">
                ← Eliminar · Marcar leído →
              </p>
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar notificación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La notificación se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteReadDialog} onOpenChange={setShowDeleteReadDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar notificaciones leídas?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán {readCount} notificaciones leídas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                deleteReadNotifications.mutate();
                setShowDeleteReadDialog(false);
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Notifications;
