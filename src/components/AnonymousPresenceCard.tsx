import { useState } from "react";
import { Ghost, Check, MoreVertical, Flag, Ban, Send, X, Sparkles, Search, Music, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserModerationModal from "@/components/UserModerationModal";
import LazyImage from "@/components/LazyImage";
import GhostMessageLimitModal from "@/components/GhostMessageLimitModal";
import { useProfile } from "@/hooks/useProfile";
import { useGhostMessageLimit } from "@/hooks/useSparks";
import { useSparkDetection } from "@/hooks/useSparkDetection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AnonymousPresenceCardProps {
  presence: {
    id: string;
    profile: {
      id: string;
      name: string | null;
      avatar_url: string | null;
      city?: string | null;
      vibe?: string | null;
      looking_for?: string[] | null;
    } | null;
    tribes: string[];
    musicStyles: string[];
    last_pulse?: string;
    is_present?: boolean;
  };
  animationDelay: number;
  isBoosted?: boolean;
  canSeeRealtimePresence?: boolean;
}

// Ghost message options - same as Chat page
const GHOST_MESSAGES = [
  "Me gustó tu vibra.",
  "Algo me dice que conectamos.",
  "Curiosidad.",
  "Ojalá coincidamos.",
];

// Helper to get activity status
const getActivityStatus = (lastPulse?: string, isPresent?: boolean, canSeeRealtime: boolean = true) => {
  if (!lastPulse) return { isActive: false, label: "Inactivo", color: "bg-muted-foreground/50" };
  
  const pulseTime = new Date(lastPulse).getTime();
  const now = Date.now();
  const diffMinutes = (now - pulseTime) / (1000 * 60);
  
  // If can see realtime, show "Activo ahora" for recent activity
  if (canSeeRealtime && isPresent && diffMinutes <= 5) {
    return { isActive: true, label: "Activo ahora", color: "bg-green-500" };
  }
  
  // For free users OR inactive users, show relative time
  if (diffMinutes <= 60) {
    return { isActive: false, label: `Hace ${Math.round(diffMinutes)} min`, color: canSeeRealtime ? "bg-yellow-500" : "bg-muted-foreground/60" };
  } else if (diffMinutes <= 1440) { // 24 hours
    const hours = Math.round(diffMinutes / 60);
    return { isActive: false, label: `Hace ${hours}h`, color: "bg-orange-500" };
  } else {
    const days = Math.round(diffMinutes / 1440);
    return { isActive: false, label: `Hace ${days}d`, color: "bg-muted-foreground/50" };
  }
};

const AnonymousPresenceCard = ({ presence, animationDelay, isBoosted = false, canSeeRealtimePresence = true }: AnonymousPresenceCardProps) => {
  const { data: myProfile } = useProfile();
  const { data: limitData, refetch: refetchLimit } = useGhostMessageLimit();
  const { checkForNewSpark } = useSparkDetection();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationMode, setModerationMode] = useState<"report" | "block">("report");
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [sparkCreated, setSparkCreated] = useState(false);

  const handleOpenDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!limitData?.canSend) {
      setShowLimitModal(true);
      return;
    }
    
    setShowMessageDialog(true);
  };

  const handleSendGhostMessage = async (isPremiumMessage: boolean = false) => {
    if (!selectedMessage || !myProfile?.id || !presence.profile?.id) return;

    if (!limitData?.canSend) {
      setShowLimitModal(true);
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("ghost_messages").insert({
        from_profile_id: myProfile.id,
        to_profile_id: presence.profile.id,
        content: selectedMessage,
        is_premium_message: isPremiumMessage,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya enviaste un mensaje a esta persona");
          setShowMessageDialog(false);
        } else {
          throw error;
        }
      } else {
        setMessageSent(true);
        refetchLimit();
        queryClient.invalidateQueries({ queryKey: ["ghost_message_count"] });
        
        // Check for spark after a brief delay
        setTimeout(async () => {
          const hasNewSpark = await checkForNewSpark(presence.profile!.id);
          
          if (hasNewSpark) {
            setSparkCreated(true);
            toast.success("🔥 ¡Chispa mutua! Se ha creado un chat", {
              action: {
                label: "Ver chats",
                onClick: () => navigate("/sparks"),
              },
            });
          } else {
            toast.success("Mensaje ghost enviado");
          }
          
          setTimeout(() => setShowMessageDialog(false), 1500);
        }, 500);
      }
    } catch (error: any) {
      toast.error("Error al enviar: " + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModerationMode("report");
    setShowModerationModal(true);
  };

  const handleBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModerationMode("block");
    setShowModerationModal(true);
  };

  // Create blurred avatar style
  const blurredAvatarStyle = {
    filter: "blur(8px)",
    transform: "scale(1.1)",
  };

  return (
    <>
      <div
        className={`w-full bg-card rounded-2xl overflow-hidden text-left transition-all animate-fade-up ${
          isBoosted ? "ring-2 ring-primary/50 shadow-lg shadow-primary/20" : ""
        }`}
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        {/* Blurred photo section */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center overflow-hidden">
          {presence.profile?.avatar_url ? (
            <div 
              className="absolute inset-0"
              style={blurredAvatarStyle}
            >
              <LazyImage 
                src={presence.profile.avatar_url} 
                alt=""
                className="w-full h-full object-cover"
                placeholderClassName="w-full h-full"
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />
          )}
          
          {/* Overlay for better contrast */}
          <div className="absolute inset-0 bg-background/30 backdrop-blur-sm" />
          
          {/* Anonymous avatar */}
          <div className="relative z-10">
            <Avatar className="w-20 h-20 border-4 border-background/50 shadow-lg">
              <AvatarImage 
                src={presence.profile?.avatar_url || undefined} 
                style={blurredAvatarStyle}
              />
              <AvatarFallback className="text-2xl bg-secondary text-secondary-foreground">
                ?
              </AvatarFallback>
            </Avatar>
          </div>

          {/* KIKI Now boost badge */}
          {isBoosted && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg animate-pulse z-20">
              <Zap className="w-3 h-3 text-white fill-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wide">Now</span>
            </div>
          )}

          {/* Options menu overlay */}
          <div className="absolute top-3 right-3 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-background transition-colors">
                  <MoreVertical className="w-4 h-4 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleReport} className="gap-2 cursor-pointer">
                  <Flag className="w-4 h-4" />
                  Reportar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBlock} className="gap-2 text-destructive cursor-pointer">
                  <Ban className="w-4 h-4" />
                  Bloquear
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* City badge */}
          {presence.profile?.city && (
            <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm">
              <span className="text-xs font-body text-foreground">{presence.profile.city}</span>
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-lg font-semibold text-card-foreground/80">
              Perfil privado
            </h3>
            {/* Activity indicator */}
            {(() => {
              const activityStatus = getActivityStatus(presence.last_pulse, presence.is_present, canSeeRealtimePresence);
              return (
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${activityStatus.color} ${activityStatus.isActive ? "animate-pulse" : ""}`} />
                  {!activityStatus.isActive && (
                    <span className="text-[10px] text-muted-foreground font-body">
                      {activityStatus.label}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
          
          <p className="font-body text-sm text-card-foreground/70 mb-3">
            Envía un mensaje ghost para conectar
          </p>
          
          {/* Tribes - visible */}
          {presence.tribes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {presence.tribes.map(tribe => (
                <span 
                  key={tribe}
                  className="px-2.5 py-1 rounded-full bg-card-foreground/15 font-body text-xs text-card-foreground"
                >
                  {tribe}
                </span>
              ))}
            </div>
          )}

          {/* Music styles */}
          {presence.musicStyles.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              <Music className="w-3 h-3 text-primary flex-shrink-0" />
              <p className="font-body text-xs text-card-foreground/80 truncate">
                {presence.musicStyles.slice(0, 3).join(" · ")}
                {presence.musicStyles.length > 3 && ` +${presence.musicStyles.length - 3}`}
              </p>
            </div>
          )}

          {/* Looking for */}
          {presence.profile?.looking_for && presence.profile.looking_for.length > 0 && (
            <div className="flex items-center gap-1.5 mb-4">
              <Search className="w-3 h-3 text-primary/80 flex-shrink-0" />
              <p className="font-body text-xs text-card-foreground/80">
                Busca: {presence.profile.looking_for.slice(0, 2).join(", ")}
                {presence.profile.looking_for.length > 2 && ` +${presence.profile.looking_for.length - 2}`}
              </p>
            </div>
          )}

          {/* Ghost message button */}
          <div className="mt-2">
            {messageSent ? (
              <Button
                variant="secondary"
                disabled
                className="w-full gap-2"
              >
                <Check className="w-4 h-4" />
                Mensaje enviado
              </Button>
            ) : (
              <Button
                onClick={handleOpenDialog}
                disabled={sending || !limitData?.canSend}
                className="w-full gap-2"
                variant="default"
              >
                <Ghost className="w-4 h-4" />
                Enviar mensaje ghost
                {limitData && (
                  <span className="text-xs opacity-70">
                    ({limitData.remaining}/5)
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Ghost Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Ghost className="w-5 h-5 text-primary" />
              Mensaje ghost
            </DialogTitle>
            <DialogDescription className="font-body">
              Tu mensaje será anónimo hasta que ambos os enviéis un ghost message.
              Si hay chispa mutua, se abrirá un chat.
            </DialogDescription>
          </DialogHeader>
          
          {messageSent ? (
            <div className="py-8 text-center">
              {sparkCreated ? (
                <div className="space-y-3">
                  <Sparkles className="w-12 h-12 mx-auto text-primary animate-pulse" />
                  <p className="font-display text-lg text-primary">¡Chispa mutua!</p>
                  <p className="text-sm text-muted-foreground">Se ha creado un chat</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Check className="w-12 h-12 mx-auto text-green-500" />
                  <p className="font-display text-lg">Mensaje enviado</p>
                  <p className="text-sm text-muted-foreground">
                    Si la otra persona te envía un ghost, ¡chispa!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {GHOST_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  onClick={() => setSelectedMessage(msg)}
                  className={cn(
                    "w-full p-3 rounded-xl text-left font-body transition-all",
                    "border-2",
                    selectedMessage === msg
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {msg}
                </button>
              ))}
            </div>
          )}

          {!messageSent && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => setShowMessageDialog(false)}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <Button
                onClick={() => handleSendGhostMessage(false)}
                disabled={!selectedMessage || sending}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? "Enviando..." : "Enviar"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Moderation Modal */}
      {showModerationModal && presence.profile?.id && (
        <UserModerationModal
          profileId={presence.profile.id}
          profileName="Usuario"
          onClose={() => setShowModerationModal(false)}
          initialMode={moderationMode}
        />
      )}

      {/* Ghost Message Limit Modal */}
      <GhostMessageLimitModal 
        open={showLimitModal} 
        onOpenChange={setShowLimitModal} 
      />
    </>
  );
};

export default AnonymousPresenceCard;
