import { useNavigate } from "react-router-dom";
import { Ghost, Flame, Eye, EyeOff, Sparkles, Send, Clock, MoreVertical, Flag, Ban, User, Zap, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useRetrySuccessToast } from "@/hooks/useRetrySuccessToast";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import GhostMessagesListSkeleton from "@/components/GhostMessagesListSkeleton";
import { Button } from "@/components/ui/button";
import { useReceivedGhostMessages, useMarkGhostMessageRead } from "@/hooks/useReceivedGhostMessages";
import { useHasSparkWith } from "@/hooks/useSparks";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import UserModerationModal from "@/components/UserModerationModal";
import PremiumBadge from "@/components/PremiumBadge";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import LazyImage from "@/components/LazyImage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Component to show a single ghost message card
const GhostMessageCard = ({ 
  message, 
  index,
  onNavigateToChat,
  onNavigateToSpark,
  navigate,
}: { 
  message: ReturnType<typeof useReceivedGhostMessages>["data"] extends (infer T)[] ? T : never;
  index: number;
  onNavigateToChat: (profileId: string) => void;
  onNavigateToSpark: () => void;
  navigate: (path: string) => void;
}) => {
  const hasSpark = useHasSparkWith(message.from_profile?.id);
  const markAsRead = useMarkGhostMessageRead();
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationMode, setModerationMode] = useState<"block" | "report">("block");
  const { data: senderTier } = useUserSubscription(message.from_profile?.id);
  
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

  const isSuperSpark = message.is_super_spark;
  
  return (
    <div
      className={`bg-card rounded-2xl p-5 animate-fade-up border transition-all hover:border-primary/20 relative ${
        isSuperSpark 
          ? "border-purple-500/50 ring-2 ring-purple-500/30 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"
          : message.is_premium_message 
            ? "border-primary/40 ring-1 ring-primary/20 bg-gradient-to-br from-card via-card to-primary/5" 
            : "border-border/30"
      }`}
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
            {(message.from_profile?.main_photo_url || message.from_profile?.avatar_url) ? (
              <LazyImage 
                src={message.from_profile.main_photo_url || message.from_profile.avatar_url!} 
                alt="Avatar"
                className="w-full h-full object-cover"
                placeholderClassName="w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                <span className="text-lg text-card-foreground" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
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
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-card-foreground" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
              {isRevealed ? (message.from_profile?.name || "Anónima") : "Alguien misterioso"}
            </h3>
            {/* Super Spark indicator - most prominent */}
            {isSuperSpark && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 text-purple-400 text-[10px] font-bold border border-purple-500/30 shadow-sm shadow-purple-500/20">
                <Flame className="w-3 h-3 animate-pulse" />
                Super Chispa ⚡
              </span>
            )}
            {/* KIKI Now indicator */}
            {message.hasKikiNowBoost && !isSuperSpark && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-semibold">
                <Zap className="w-3 h-3" />
                KIKI Now
              </span>
            )}
            {/* Premium message indicator */}
            {message.is_premium_message && !isSuperSpark && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold animate-pulse-soft">
                <Sparkles className="w-3 h-3" />
                Mensaje especial
              </span>
            )}
            {/* Second chance indicator */}
            {message.is_second_chance && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground text-[10px] font-semibold">
                Segunda oportunidad
              </span>
            )}
            {isRevealed && senderTier === 'premium' && <PremiumBadge size="sm" />}
            {!message.read_at && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
            )}
          </div>
          
          {/* Vibe - always visible as hint */}
          <p className="text-xs text-card-foreground/70 mb-3" style={{ fontFamily: 'Arial, sans-serif' }}>
            Vibra {message.from_profile?.vibe?.toLowerCase() || "misteriosa"}
            {message.from_profile?.city && !isRevealed && ` · ${message.from_profile.city}`}
          </p>

          {/* Message content */}
          <div className="bg-background/50 rounded-xl p-3 mb-3">
            <p className="text-sm text-card-foreground italic" style={{ fontFamily: 'Arial, sans-serif' }}>
              "{message.content}"
            </p>
          </div>

          {/* Time and status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-card-foreground/60">
              <Clock className="w-3 h-3" />
              <span className="text-xs" style={{ fontFamily: 'Arial, sans-serif' }}>{timeAgo}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* View Profile Button - always visible */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user/${message.from_profile?.id}`);
                }}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <User className="w-3.5 h-3.5" />
                Ver perfil
              </Button>

              {hasSpark ? (
                <Button
                  variant="kiki"
                  size="sm"
                  onClick={() => navigate(`/user/${message.from_profile?.id}`)}
                  className="gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Ver chispa
                </Button>
              ) : message.hasSentBack ? (
                <span className="text-xs text-primary flex items-center gap-1" style={{ fontFamily: 'Arial, sans-serif' }}>
                  <Send className="w-3 h-3" />
                  Enviado
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
      </div>

      {/* Reveal hint */}
      {!isRevealed && (
        <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-center gap-2">
          <EyeOff className="w-3.5 h-3.5 text-muted-foreground/70" />
          <p className="text-xs text-muted-foreground/70" style={{ fontFamily: 'Arial, sans-serif' }}>
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
  const { data: messages, isLoading, isError, refetch, isFetching } = useReceivedGhostMessages();

  useRetrySuccessToast({ isError, isLoading, isFetching, data: messages });

  const handleNavigateToChat = (profileId: string) => {
    navigate(`/chat/${profileId}`);
  };

  const handleNavigateToSpark = () => {
    navigate("/sparks");
  };

  return (
    <main className="min-h-screen bg-background flex flex-col px-4 sm:px-6 py-6 sm:py-8 pb-24 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <PageHeader 
        backLabel="Presencia" 
        backTo="/presence" 
        showThemeToggle={false}
        className="max-w-lg mx-auto w-full mb-10"
      />

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
          
          <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Mensajes fantasma
          </h1>
          <p className="text-muted-foreground max-w-xs mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
            Personas que te han enviado un mensaje. Responde para revelar quiénes son.
          </p>
        </div>

        {/* Messages list */}
        {isLoading ? (
          <GhostMessagesListSkeleton count={3} />
        ) : isError ? (
          <ErrorState
            icon={Ghost}
            description="No pudimos cargar tus mensajes. Revisa tu conexión."
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        ) : messages?.length === 0 ? (
          <EmptyState
            icon={Ghost}
            title="Sin mensajes aún"
            description="Cuando alguien te envíe un mensaje fantasma, aparecerá aquí."
            action={
              <Button
                variant="kiki-soft"
                onClick={() => navigate("/presence")}
              >
                Explorar presencia
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {(() => {
              const superSparkMessages = messages?.filter(m => m.is_super_spark) || [];
              const kikiNowMessages = messages?.filter(m => m.hasKikiNowBoost && !m.is_super_spark) || [];
              const otherMessages = messages?.filter(m => !m.hasKikiNowBoost && !m.is_super_spark) || [];
              
              return (
                <>
                  {/* Super Spark section - highest priority */}
                  {superSparkMessages.length > 0 && (
                    <Collapsible defaultOpen className="space-y-4">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center gap-2 group cursor-pointer">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-pink-500/15 border border-purple-500/30 transition-colors group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-pink-500/20">
                            <Flame className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
                              Super Chispas ⚡
                            </span>
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold">
                              {superSparkMessages.length}
                            </span>
                            <ChevronDown className="w-4 h-4 text-purple-500 transition-transform group-data-[state=open]:rotate-180" />
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/30 to-transparent" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4">
                        {superSparkMessages.map((message, index) => (
                          <GhostMessageCard
                            key={message.id}
                            message={message}
                            index={index}
                            onNavigateToChat={handleNavigateToChat}
                            onNavigateToSpark={handleNavigateToSpark}
                            navigate={navigate}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* KIKI Now section - users who want to connect now */}
                  {kikiNowMessages.length > 0 && (
                    <Collapsible defaultOpen className="space-y-4">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center gap-2 group cursor-pointer">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 transition-colors group-hover:bg-amber-500/20">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-semibold text-amber-500" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
                              Quieren conectar ahora
                            </span>
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold">
                              {kikiNowMessages.length}
                            </span>
                            <ChevronDown className="w-4 h-4 text-amber-500 transition-transform group-data-[state=open]:rotate-180" />
                          </div>
                          <div className="flex-1 h-px bg-amber-500/20" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4">
                        {kikiNowMessages.map((message, index) => (
                          <GhostMessageCard
                            key={message.id}
                            message={message}
                            index={index}
                            onNavigateToChat={handleNavigateToChat}
                            onNavigateToSpark={handleNavigateToSpark}
                            navigate={navigate}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Regular messages section */}
                  {otherMessages.length > 0 && (
                    <Collapsible defaultOpen className="space-y-4">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center gap-2 group cursor-pointer">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/30 transition-colors group-hover:bg-muted/70">
                            <Ghost className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-muted-foreground" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
                              Chispas
                            </span>
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                              {otherMessages.length}
                            </span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                          </div>
                          <div className="flex-1 h-px bg-border/30" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4">
                        {otherMessages.map((message, index) => (
                          <GhostMessageCard
                            key={message.id}
                            message={message}
                            index={index}
                            onNavigateToChat={handleNavigateToChat}
                            onNavigateToSpark={handleNavigateToSpark}
                            navigate={navigate}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Info footer */}
        <div className="mt-10 text-center animate-fade-up animate-delay-500">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/30 border border-border/20">
            <Eye className="w-3.5 h-3.5 text-primary/60" />
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
              La identidad se revela al responder
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default GhostMessages;
