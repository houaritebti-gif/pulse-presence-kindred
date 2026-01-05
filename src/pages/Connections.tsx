import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, UserCheck, Clock, Users, Sparkles, Link2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import {
  useReceivedConnectionRequests,
  useSentConnectionRequests,
  useAcceptConnectionRequest,
  useRejectConnectionRequest,
  useCancelConnectionRequest,
  useConnectionRequestsRealtime,
  ConnectionRequestWithProfile,
} from "@/hooks/useConnectionRequests";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { triggerHaptic } from "@/utils/haptics";

const Connections = () => {
  const navigate = useNavigate();
  const { data: receivedRequests, isLoading: loadingReceived } = useReceivedConnectionRequests();
  const { data: sentRequests, isLoading: loadingSent } = useSentConnectionRequests();
  const acceptRequest = useAcceptConnectionRequest();
  const rejectRequest = useRejectConnectionRequest();
  const cancelRequest = useCancelConnectionRequest();

  // Subscribe to realtime updates
  useConnectionRequestsRealtime();

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
    <div className="bg-card rounded-xl p-4 animate-fade-up">
      <div className="flex items-start gap-3">
        <Avatar className="w-14 h-14 border-2 border-primary/20">
          <AvatarImage 
            src={request.from_profile?.avatar_url || undefined}
            style={{ filter: "blur(4px)" }}
          />
          <AvatarFallback className="text-lg bg-secondary">?</AvatarFallback>
        </Avatar>
        
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
    <div className="bg-card rounded-xl p-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 border-2 border-muted">
          <AvatarImage 
            src={request.to_profile?.avatar_url || undefined}
            style={{ filter: "blur(4px)" }}
          />
          <AvatarFallback className="bg-secondary">?</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-card-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
              {request.to_profile?.city || "Desconocida"}
            </span>
            <span className={`flex items-center gap-1 text-xs ${
              request.status === "accepted" ? "text-green-500" : "text-muted-foreground"
            }`} style={{ fontFamily: 'Arial, sans-serif' }}>
              {request.status === "accepted" ? (
                <>
                  <UserCheck className="w-3 h-3" />
                  Conectado
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  Pendiente
                </>
              )}
            </span>
          </div>
          <span className="text-xs text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
            {formatTime(request.created_at)}
          </span>
        </div>
        
        {request.status === "pending" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleCancel(request.id)}
            disabled={cancelRequest.isPending}
            className="text-muted-foreground"
          >
            Cancelar
          </Button>
        )}
        
        {request.status === "accepted" && request.to_profile?.id && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/user/${request.to_profile?.id}`)}
          >
            Ver perfil
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background flex flex-col px-4 sm:px-6 py-6 sm:py-8 pb-24 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/presence")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Presencia</span>
        </button>
        <span className="text-xl font-bold text-foreground" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>KIKI</span>
        <ThemeToggle />
      </div>

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

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="received" className="gap-2">
              <Users className="w-4 h-4" />
              Recibidas
              {(receivedRequests?.length || 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {receivedRequests?.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Clock className="w-4 h-4" />
              Enviadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            {loadingReceived ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
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
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !sentRequests?.length ? (
              <EmptyState
                icon={Clock}
                title="Sin solicitudes enviadas"
                description="Las solicitudes que envíes aparecerán aquí."
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
    </main>
  );
};

export default Connections;
