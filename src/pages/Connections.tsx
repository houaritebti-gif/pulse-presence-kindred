import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, UserCheck, Clock, Users, Sparkles, Link2, MessageCircle, Heart, Unlink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LazyAvatar from "@/components/LazyAvatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
import EmptyState from "@/components/EmptyState";
import {
  useReceivedConnectionRequests,
  useSentConnectionRequests,
  useActiveConnections,
  useAcceptConnectionRequest,
  useRejectConnectionRequest,
  useCancelConnectionRequest,
  useDisconnectConnection,
  useConnectionRequestsRealtime,
  useActiveConnectionsRealtime,
  ConnectionRequestWithProfile,
  ActiveConnection,
} from "@/hooks/useConnectionRequests";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { triggerHaptic } from "@/utils/haptics";
import { motion } from "framer-motion";

// Skeleton for connection cards
const ConnectionCardSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/30 opacity-0 animate-fade-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
    <div className="flex-1 min-w-0 space-y-2">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-3.5 w-24" />
    </div>
    <Skeleton className="h-9 w-20 rounded-lg flex-shrink-0" />
  </div>
);

const ConnectionsListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <ConnectionCardSkeleton key={i} delay={i * 80} />
    ))}
  </div>
);

const Connections = () => {
  const navigate = useNavigate();
  const [disconnectTarget, setDisconnectTarget] = useState<ActiveConnection | null>(null);
  
  const { data: receivedRequests, isLoading: loadingReceived } = useReceivedConnectionRequests();
  const { data: sentRequests, isLoading: loadingSent } = useSentConnectionRequests();
  const { data: activeConnections, isLoading: loadingActive } = useActiveConnections();
  const acceptRequest = useAcceptConnectionRequest();
  const rejectRequest = useRejectConnectionRequest();
  const cancelRequest = useCancelConnectionRequest();
  const disconnectConnection = useDisconnectConnection();

  // Subscribe to realtime updates
  useConnectionRequestsRealtime();
  useActiveConnectionsRealtime();

  const handleAccept = (requestId: string) => {
    triggerHaptic('success');
    acceptRequest.mutate(requestId);
  };

  const handleReject = (requestId: string) => {
    triggerHaptic('light');
    rejectRequest.mutate(requestId);
  };

  const handleCancel = (requestId: string) => {
    triggerHaptic('light');
    cancelRequest.mutate(requestId);
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
  };

  const ReceivedRequestCard = ({ request }: { request: ConnectionRequestWithProfile }) => (
    <div className="bg-card rounded-xl p-4 animate-fade-up border border-foreground/5 dark:border-transparent shadow-md shadow-foreground/10 dark:shadow-foreground/5">
      <div className="flex items-start gap-3">
        <LazyAvatar
          src={request.from_profile?.avatar_url}
          fallback="?"
          className="w-14 h-14 border-2 border-primary/20"
          fallbackClassName="text-lg bg-secondary"
          blur
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-card-foreground" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
              {request.from_profile?.city || "Desconocida"}
            </span>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
              {formatTime(request.created_at)}
            </span>
          </div>
          
          {/* Message if present */}
          {request.message && (
            <div className="mb-3 p-2.5 rounded-lg bg-secondary/50 border border-border/30">
              <p className="text-sm text-card-foreground italic" style={{ fontFamily: 'Arial, sans-serif' }}>
                "{request.message}"
              </p>
            </div>
          )}

          {/* Tribes */}
          {request.from_tribes && request.from_tribes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {request.from_tribes.slice(0, 3).map(tribe => (
                <span 
                  key={tribe}
                  className="px-2 py-0.5 rounded-full bg-primary/10 text-xs text-primary"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  {tribe}
                </span>
              ))}
              {request.from_tribes.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
                  +{request.from_tribes.length - 3}
                </span>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAccept(request.id)}
              disabled={acceptRequest.isPending}
              className="gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Aceptar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleReject(request.id)}
              disabled={rejectRequest.isPending}
              className="text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const SentRequestCard = ({ request }: { request: ConnectionRequestWithProfile }) => (
    <div className="bg-card rounded-xl p-4 animate-fade-up border border-foreground/5 dark:border-transparent shadow-md shadow-foreground/10 dark:shadow-foreground/5">
      <div className="flex items-center gap-3">
        <LazyAvatar
          src={request.to_profile?.avatar_url}
          fallback="?"
          className="w-12 h-12 border-2 border-muted"
          fallbackClassName="bg-secondary"
          blur
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-card-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
              {request.to_profile?.city || "Desconocida"}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
              <Clock className="w-3 h-3" />
              Pendiente
            </span>
          </div>
          <span className="text-xs text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
            {formatTime(request.created_at)}
          </span>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleCancel(request.id)}
          disabled={cancelRequest.isPending}
          className="text-muted-foreground"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );

  const handleDisconnect = (connection: ActiveConnection) => {
    triggerHaptic('warning');
    setDisconnectTarget(connection);
  };

  const confirmDisconnect = () => {
    if (disconnectTarget) {
      disconnectConnection.mutate(disconnectTarget.id);
      setDisconnectTarget(null);
    }
  };

  const ActiveConnectionCard = ({ connection }: { connection: ActiveConnection }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-4 border border-foreground/5 dark:border-transparent shadow-md shadow-foreground/10 dark:shadow-foreground/5"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <LazyAvatar
            src={connection.connected_profile?.avatar_url}
            fallback={connection.connected_profile?.name}
            className="w-14 h-14 border-2 border-green-500/30 cursor-pointer transition-transform hover:scale-105"
            fallbackClassName="bg-gradient-to-br from-primary/20 to-accent/20 text-lg"
            onClick={() => navigate(`/user/${connection.connected_profile?.id}`)}
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
            <Heart className="w-2 h-2 text-white fill-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate(`/user/${connection.connected_profile?.id}`)}
            className="text-left hover:underline"
          >
            <span className="font-semibold text-card-foreground block" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
              {connection.connected_profile?.name || "Sin nombre"}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
              {connection.connected_profile?.city || ""}
            </span>
            <span className="text-[10px] text-green-500 flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              Conectado {formatTime(connection.responded_at || connection.created_at)}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Button
              size="sm"
              onClick={() => {
                triggerHaptic('selection');
                navigate(`/chat/${connection.connected_profile?.id}`);
              }}
              className="gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </Button>
            {connection.unread_count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/50 animate-pulse-soft ring-2 ring-card">
                <span className="text-[10px] font-bold text-primary-foreground">
                  {connection.unread_count > 9 ? "9+" : connection.unread_count}
                </span>
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/user/${connection.connected_profile?.id}`)}
          >
            Perfil
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDisconnect(connection)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Unlink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <main className="min-h-screen bg-background flex flex-col px-4 sm:px-6 py-6 sm:py-8 pb-24 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <PageHeader backLabel="Presencia" backTo="/presence" />

      <div className="flex-1 max-w-lg mx-auto w-full relative z-10">
        {/* Hero section */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full animate-pulse-soft" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center ring-2 ring-accent/20 ring-offset-4 ring-offset-background">
              <Link2 className="w-10 h-10 text-accent" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-accent/60 animate-pulse-soft" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Conexiones
          </h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
            Solicitudes para conocerte mejor.
          </p>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="active" className="gap-1.5 text-xs sm:text-sm">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Activas</span>
              {(activeConnections?.length || 0) > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold">
                  {activeConnections?.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="received" className="gap-1.5 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Recibidas</span>
              {(receivedRequests?.length || 0) > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {receivedRequests?.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-1.5 text-xs sm:text-sm">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Enviadas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {loadingActive ? (
              <ConnectionsListSkeleton count={3} />
            ) : !activeConnections?.length ? (
              <EmptyState
                icon={Heart}
                title="Sin conexiones activas"
                description="Cuando conectes con alguien, aparecerá aquí para que puedan seguir conociéndose."
              />
            ) : (
              <div className="space-y-3">
                {activeConnections.map((connection) => (
                  <ActiveConnectionCard key={connection.id} connection={connection} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            {loadingReceived ? (
              <ConnectionsListSkeleton count={2} />
            ) : !receivedRequests?.length ? (
              <EmptyState
                icon={Users}
                title="Sin solicitudes"
                description="Cuando alguien quiera conectar contigo, aparecerá aquí."
              />
            ) : (
              receivedRequests.map((request) => (
                <ReceivedRequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {loadingSent ? (
              <ConnectionsListSkeleton count={2} />
            ) : !sentRequests?.length ? (
              <EmptyState
                icon={Clock}
                title="Sin solicitudes enviadas"
                description="Las solicitudes pendientes que envíes aparecerán aquí."
              />
            ) : (
              sentRequests.map((request) => (
                <SentRequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-10 text-center animate-fade-up animate-delay-500">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/30 border border-border/20">
            <Link2 className="w-3.5 h-3.5 text-accent/60" />
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
              Perfiles visibles solo al conectar
            </p>
          </div>
        </div>
      </div>

      {/* Disconnect confirmation dialog */}
      <AlertDialog open={!!disconnectTarget} onOpenChange={() => setDisconnectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conexión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la conexión con{" "}
              <span className="font-semibold">{disconnectTarget?.connected_profile?.name || "este usuario"}</span>.
              Ya no podrás ver su perfil completo ni chatear directamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default Connections;
