import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ghost, Flame, Eye, EyeOff, Sparkles, Send, Clock, MoreVertical, Flag, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReceivedGhostMessages, useMarkGhostMessageRead } from "@/hooks/useReceivedGhostMessages";
import { useHasSparkWith } from "@/hooks/useSparks";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import UserModerationModal from "@/components/UserModerationModal";

// Component to show a single ghost message card
const GhostMessageCard = ({ 
  message, 
  index,
  onNavigateToChat,
  onNavigateToSpark,
}: { 
  message: ReturnType<typeof useReceivedGhostMessages>["data"] extends (infer T)[] ? T : never;
  index: number;
  onNavigateToChat: (profileId: string) => void;
  onNavigateToSpark: () => void;
}) => {
  const hasSpark = useHasSparkWith(message.from_profile?.id);
  const markAsRead = useMarkGhostMessageRead();
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationMode, setModerationMode] = useState<"block" | "report">("block");
  
  // Mark as read when viewed
  useEffect(() => {
    if (!message.read_at) {
      markAsRead(message.id);
    }
  }, [message.id, message.read_at, markAsRead]);

  const isRevealed = message.hasSentBack || hasSpark;
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { 
    addSuffix: true, 
    locale: es 
  });

  return (
    <div
      className="bg-card rounded-2xl p-5 animate-fade-up border border-border/30 transition-all hover:border-primary/20 relative"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* More options menu */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground/50 hover:text-foreground transition-colors p-1">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                setModerationMode("report");
                setShowModerationModal(true);
              }}
              className="gap-2 text-muted-foreground"
            >
              <Flag className="w-4 h-4" />
              Reportar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setModerationMode("block");
                setShowModerationModal(true);
              }}
              className="gap-2 text-destructive"
            >
              <Ban className="w-4 h-4" />
              Bloquear
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-start gap-4">
        {/* Avatar - blurred if not revealed */}
        <div className="relative flex-shrink-0">
          <div className={`w-14 h-14 rounded-full overflow-hidden ${!isRevealed ? "blur-md" : ""}`}>
            {message.from_profile?.avatar_url ? (
              <img 
                src={message.from_profile.avatar_url} 
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                <span className="font-display text-lg text-card-foreground">
                  {isRevealed ? (message.from_profile?.name?.[0] || "?").toUpperCase() : "?"}
                </span>
              </div>
            )}
          </div>
          {/* Ghost overlay when not revealed */}
          {!isRevealed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Ghost className="w-6 h-6 text-primary/60" />
            </div>
          )}
          {/* Spark indicator if mutual */}
          {hasSpark && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card flex items-center justify-center shadow-md">
              <Flame className="w-3.5 h-3.5 text-primary animate-spark-flame" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-card-foreground">
              {isRevealed ? (message.from_profile?.name || "Anónima") : "Alguien misterioso"}
            </h3>
            {!message.read_at && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
            )}
          </div>
          
          {/* Vibe - always visible as hint */}
          <p className="font-body text-xs text-card-foreground/50 mb-3">
            Vibra {message.from_profile?.vibe?.toLowerCase() || "misteriosa"}
            {message.from_profile?.city && !isRevealed && ` · ${message.from_profile.city}`}
          </p>

          {/* Message content */}
          <div className="bg-background/50 rounded-xl p-3 mb-3">
            <p className="font-body text-sm text-card-foreground/80 italic">
              "{message.content}"
            </p>
          </div>

          {/* Time and status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-card-foreground/40">
              <Clock className="w-3 h-3" />
              <span className="font-body text-xs">{timeAgo}</span>
            </div>

            {hasSpark ? (
              <Button
                variant="kiki"
                size="sm"
                onClick={onNavigateToSpark}
                className="gap-1.5"
              >
                <Flame className="w-3.5 h-3.5" />
                Ir al chat
              </Button>
            ) : message.hasSentBack ? (
              <span className="font-body text-xs text-primary flex items-center gap-1">
                <Send className="w-3 h-3" />
                Mensaje enviado
              </span>
            ) : (
              <Button
                variant="kiki-soft"
                size="sm"
                onClick={() => onNavigateToChat(message.from_profile?.id || "")}
                className="gap-1.5"
              >
                <Ghost className="w-3.5 h-3.5" />
                Responder
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reveal hint */}
      {!isRevealed && (
        <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-center gap-2">
          <EyeOff className="w-3.5 h-3.5 text-muted-foreground/50" />
          <p className="font-body text-xs text-muted-foreground/50">
            Responde para revelar su identidad
          </p>
        </div>
      )}

      {/* Moderation Modal */}
      {showModerationModal && message.from_profile?.id && (
        <UserModerationModal
          onClose={() => setShowModerationModal(false)}
          profileId={message.from_profile.id}
          profileName={message.from_profile.name || "Usuario"}
          initialMode={moderationMode}
        />
      )}
    </div>
  );
};

const GhostMessages = () => {
  const navigate = useNavigate();
  const { data: messages, isLoading, isError } = useReceivedGhostMessages();

  const handleNavigateToChat = (profileId: string) => {
    navigate(`/chat/${profileId}`);
  };

  const handleNavigateToSpark = () => {
    navigate("/sparks");
  };

  return (
    <main className="min-h-screen bg-background flex flex-col px-6 py-8 pb-24 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/presence")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 font-body group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Presencia</span>
        </button>
        <span className="font-display text-xl font-bold text-foreground">KIKI</span>
        <div className="w-20" />
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full relative z-10">
        {/* Hero section */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse-soft" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center ring-2 ring-primary/20 ring-offset-4 ring-offset-background">
              <Ghost className="w-10 h-10 text-primary" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-primary/60 animate-pulse-soft" />
          </div>
          
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">
            Mensajes fantasma
          </h1>
          <p className="font-body text-muted-foreground max-w-xs mx-auto">
            Personas que te han enviado un mensaje. Responde para revelar quiénes son.
          </p>
        </div>

        {/* Messages list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="relative">
              <Ghost className="w-10 h-10 text-primary/50 animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            </div>
          </div>
        ) : isError ? (
          <div className="text-center py-16 animate-fade-up">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-full h-full rounded-full bg-destructive/10 flex items-center justify-center">
                <Ghost className="w-8 h-8 text-destructive/50" />
              </div>
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Error de conexión
            </h3>
            <p className="font-body text-sm text-muted-foreground/60 max-w-[240px] mx-auto leading-relaxed">
              No pudimos cargar tus mensajes. Revisa tu conexión.
            </p>
          </div>
        ) : messages?.length === 0 ? (
          <div className="text-center py-16 animate-fade-up">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-full h-full rounded-full bg-card/50 flex items-center justify-center">
                <Ghost className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Sin mensajes aún
            </h3>
            <p className="font-body text-sm text-muted-foreground/60 max-w-[240px] mx-auto leading-relaxed mb-6">
              Cuando alguien te envíe un mensaje fantasma, aparecerá aquí.
            </p>
            <Button
              variant="kiki-soft"
              onClick={() => navigate("/presence")}
            >
              Explorar presencia
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {messages?.map((message, index) => (
              <GhostMessageCard
                key={message.id}
                message={message}
                index={index}
                onNavigateToChat={handleNavigateToChat}
                onNavigateToSpark={handleNavigateToSpark}
              />
            ))}
          </div>
        )}

        {/* Info footer */}
        <div className="mt-10 text-center animate-fade-up animate-delay-500">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/30 border border-border/20">
            <Eye className="w-3.5 h-3.5 text-primary/60" />
            <p className="font-body text-xs text-muted-foreground">
              La identidad se revela al responder
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default GhostMessages;
