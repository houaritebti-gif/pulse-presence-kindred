import { useState } from "react";
import { Ghost, Check, MoreVertical, Flag, Ban, Send, X, Sparkles, Zap, Heart, User } from "lucide-react";
import { ALL_GENDERS } from "@/constants/profileOptions";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import UserModerationModal from "@/components/UserModerationModal";
import LazyImage from "@/components/LazyImage";
import GhostMessageLimitModal from "@/components/GhostMessageLimitModal";
import { useProfile } from "@/hooks/useProfile";
import { useGhostMessageLimit } from "@/hooks/useSparks";
import { useSparkDetection } from "@/hooks/useSparkDetection";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

interface CompatibilityBreakdown {
  tribes: number;
  music: number;
  lookingFor: number;
  interests: number;
}

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
      gender?: string | null;
      birthdate?: string | null;
    } | null;
    tribes: string[];
    musicStyles: string[];
    last_pulse?: string;
    is_present?: boolean;
  };
  animationDelay: number;
  isBoosted?: boolean;
  canSeeRealtimePresence?: boolean;
  compatibility?: number;
  compatibilityBreakdown?: CompatibilityBreakdown;
  hasVisibilityBoost?: boolean;
}

// Helper to get gender label from value
const getGenderLabel = (genderValue: string | null | undefined): string | null => {
  if (!genderValue) return null;
  const gender = ALL_GENDERS.find(g => g.value === genderValue);
  return gender?.label || null;
};

// Helper to calculate age from birthdate
const calculateAge = (birthdate: string | null | undefined): number | null => {
  if (!birthdate) return null;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

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

const AnonymousPresenceCard = ({ presence, animationDelay, isBoosted = false, canSeeRealtimePresence = true, compatibility = 0, compatibilityBreakdown, hasVisibilityBoost = false }: AnonymousPresenceCardProps) => {
  const { data: myProfile } = useProfile();
  const { data: limitData, refetch: refetchLimit } = useGhostMessageLimit();
  const { checkForNewSpark } = useSparkDetection();
  const { earnEnergy, canDoAction } = useSparkEnergy();
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
    triggerHaptic('selection');
    
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
        
        // Award spark energy for sending ghost message
        if (canDoAction("send_ghost")) {
          try {
            await earnEnergy({ 
              action: "send_ghost", 
              description: "Ghost message enviado" 
            });
          } catch (e) {
            // Silent fail - don't block the main flow
            console.log("[SparkEnergy] Could not award energy:", e);
          }
        }
        
        // Check for spark after a brief delay
        setTimeout(async () => {
          const hasNewSpark = await checkForNewSpark(presence.profile!.id);
          
          if (hasNewSpark) {
            setSparkCreated(true);
            
            // Award bonus energy for mutual spark
            try {
              await earnEnergy({ 
                action: "mutual_spark", 
                description: "¡Chispa mutua!" 
              });
            } catch (e) {
              console.log("[SparkEnergy] Could not award mutual spark energy:", e);
            }
            
            toast.success("🔥 ¡Chispa mutua!", {
              action: {
                label: "Ver perfil",
                onClick: () => navigate(`/user/${presence.profile!.id}`),
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


  return (
    <>
      <div
        className={`w-full bg-card rounded-2xl sm:rounded-3xl overflow-hidden text-left transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 active:scale-[0.98] active:shadow-md animate-fade-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background border border-foreground/5 dark:border-transparent ${
          isBoosted ? "ring-2 ring-primary/50 shadow-lg shadow-primary/20" : "shadow-md shadow-foreground/10 dark:shadow-foreground/5"
        }`}
        style={{ animationDelay: `${animationDelay}ms` }}
        tabIndex={0}
        role="article"
        aria-label={`Perfil anónimo${presence.profile?.city ? ` de ${presence.profile.city}` : ""}`}
      >
        {/* Photo section - visible from the start */}
        <div className="relative h-36 sm:h-48 bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center overflow-hidden">
          {presence.profile?.avatar_url ? (
            <div className="absolute inset-0">
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
          
          {/* Subtle overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-transparent" />
          
          {/* Profile avatar - clear, not blurred */}
          <div className="relative z-10">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-background/50 shadow-lg">
              <AvatarImage src={presence.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xl sm:text-2xl bg-secondary text-secondary-foreground">
                ?
              </AvatarFallback>
            </Avatar>
          </div>

          {/* KIKI Now boost badge */}
          {isBoosted && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg animate-pulse z-20">
              <Zap className="w-3 h-3 text-white fill-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wide">Now</span>
            </div>
          )}

          {/* Visibility boost badge */}
          {hasVisibilityBoost && !isBoosted && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg z-20">
              <Sparkles className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wide">Boost</span>
            </div>
          )}

          {/* Options menu overlay */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); }}
                  className="group w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-background hover:shadow-lg active:scale-90 transition-all duration-200"
                >
                  <MoreVertical className="w-4 h-4 text-foreground group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 animate-scale-in">
                <DropdownMenuItem onClick={(e) => { triggerHaptic('medium'); handleReport(e); }} className="gap-2 cursor-pointer py-3 sm:py-2 transition-colors hover:bg-muted/80">
                  <Flag className="w-4 h-4 transition-transform group-hover:scale-110" />
                  Reportar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { triggerHaptic('warning'); handleBlock(e); }} className="gap-2 text-destructive cursor-pointer py-3 sm:py-2 transition-colors hover:bg-destructive/10">
                  <Ban className="w-4 h-4 transition-transform group-hover:scale-110" />
                  Bloquear
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Compatibility badge - top left with tooltip (consistent with PresenceCard) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm z-20 cursor-help transition-all ${
                  compatibility >= 5
                    ? "bg-[length:400%_100%] bg-gradient-to-r from-primary via-accent to-primary animate-shimmer-badge animate-perfect-glow"
                    : compatibility >= 4 
                      ? "bg-[length:400%_100%] bg-gradient-to-r from-primary via-accent to-primary shadow-lg shadow-primary/30 animate-shimmer-badge" 
                      : "bg-background/80 shadow-lg"
                }`}>
                  <Heart className={`w-3 h-3 transition-transform ${
                    compatibility >= 4 
                      ? "text-primary-foreground fill-primary-foreground" 
                      : "text-primary fill-primary"
                  } ${compatibility >= 5 ? "animate-pulse" : ""}`} />
                  <span className={`text-[11px] sm:text-xs font-bold ${compatibility >= 4 ? "text-primary-foreground" : "text-foreground"}`}>
                    {Math.min(compatibility, 5)}/5
                  </span>
                  {compatibility >= 5 && (
                    <span className="text-[10px]">💫</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {compatibilityBreakdown ? (
                  <div className="space-y-1">
                    {compatibility >= 5 ? (
                      <p className="text-primary font-semibold">💫 ¡Compatibilidad perfecta!</p>
                    ) : compatibility >= 4 ? (
                      <p className="text-primary font-semibold">✨ ¡Alta compatibilidad!</p>
                    ) : null}
                    {compatibilityBreakdown.tribes > 0 && (
                      <p>🏴 {compatibilityBreakdown.tribes} {compatibilityBreakdown.tribes === 1 ? "tribu" : "tribus"}</p>
                    )}
                    {compatibilityBreakdown.music > 0 && (
                      <p>🎵 {compatibilityBreakdown.music} {compatibilityBreakdown.music === 1 ? "estilo" : "estilos"}</p>
                    )}
                    {compatibilityBreakdown.lookingFor > 0 && (
                      <p>🔍 {compatibilityBreakdown.lookingFor} {compatibilityBreakdown.lookingFor === 1 ? "interés común" : "intereses comunes"}</p>
                    )}
                    {compatibilityBreakdown.interests > 0 && (
                      <p>⭐ {compatibilityBreakdown.interests} {compatibilityBreakdown.interests === 1 ? "interés cultural" : "intereses culturales"}</p>
                    )}
                  </div>
                ) : (
                  <p>{compatibility} coincidencias</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Profile info badge - bottom left (name, age, gender) */}
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-20 flex flex-col gap-1">
            {/* Name, age, gender */}
            <div className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 rounded-full bg-background/80 backdrop-blur-sm">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                {presence.profile?.name || "Anónima"}
                {(presence.profile?.birthdate || presence.profile?.gender) && (
                  <span className="font-normal text-muted-foreground ml-1">
                    {presence.profile?.birthdate && calculateAge(presence.profile.birthdate)}
                    {presence.profile?.birthdate && presence.profile?.gender && ", "}
                    {presence.profile?.gender && getGenderLabel(presence.profile.gender)}
                  </span>
                )}
              </span>
            </div>
            {/* City badge */}
            {presence.profile?.city && (
              <div className="px-2 py-1 sm:px-2.5 rounded-full bg-background/80 backdrop-blur-sm">
                <span className="text-xs font-body text-foreground">📍 {presence.profile.city}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info section - fixed height for consistent cards */}
        <div className="p-3 sm:p-4 h-[140px] sm:h-[130px] flex flex-col">
          {/* 1. Activity status - TOP */}
          {(() => {
            const activityStatus = getActivityStatus(presence.last_pulse, presence.is_present, canSeeRealtimePresence);
            return (
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={cn(
                  "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full",
                  activityStatus.color,
                  activityStatus.isActive && "animate-pulse shadow-sm shadow-green-500/50"
                )} />
                <span className={cn(
                  "text-[11px] sm:text-xs font-body",
                  activityStatus.isActive ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground/90"
                )}>
                  {activityStatus.label}
                </span>
              </div>
            );
          })()}

          {/* 2. Looking for - MIDDLE */}
          {presence.profile?.looking_for && presence.profile.looking_for.length > 0 && (
            <div className="mb-2">
              <span className="text-xs text-muted-foreground">Busca: </span>
              <span className="text-xs text-card-foreground/80">
                {presence.profile.looking_for.slice(0, 2).join(", ")}
                {presence.profile.looking_for.length > 2 && ` +${presence.profile.looking_for.length - 2}`}
              </span>
            </div>
          )}
          
          {/* 3. Interests/Tags - BOTTOM with tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1 overflow-hidden relative cursor-default">
                  <div className="flex flex-wrap gap-1.5 max-h-[44px] overflow-hidden">
                    {/* Show max 3 tribes */}
                    {presence.tribes.slice(0, 3).map(tribe => (
                      <span 
                        key={tribe}
                        className="px-2 py-0.5 rounded-full bg-foreground/10 dark:bg-card-foreground/15 font-body text-xs text-foreground/80 dark:text-card-foreground/90 font-medium"
                      >
                        {tribe}
                      </span>
                    ))}
                    {presence.tribes.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full bg-foreground/10 dark:bg-card-foreground/10 font-body text-xs text-foreground/70 dark:text-muted-foreground font-medium">
                        +{presence.tribes.length - 3}
                      </span>
                    )}
                    {/* Show max 2 music styles if space */}
                    {presence.tribes.length < 3 && presence.musicStyles.slice(0, 2).map(style => (
                      <span 
                        key={style}
                        className="px-2 py-0.5 rounded-full bg-primary/15 dark:bg-primary/10 font-body text-xs text-primary font-medium"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                  {/* Fade gradient overlay */}
                  {(presence.tribes.length > 3 || (presence.tribes.length < 3 && presence.musicStyles.length > 2)) && (
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                  )}
                </div>
              </TooltipTrigger>
              {(presence.tribes.length > 0 || presence.musicStyles.length > 0) && (
                <TooltipContent side="top" className="max-w-[280px]">
                  <div className="space-y-2">
                    {presence.tribes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground/70 mb-1">Tribus</p>
                        <div className="flex flex-wrap gap-1">
                          {presence.tribes.map(tribe => (
                            <span key={tribe} className="px-1.5 py-0.5 rounded bg-foreground/10 dark:bg-card-foreground/15 text-xs font-medium">
                              {tribe}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {presence.musicStyles.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground/70 mb-1">Música</p>
                        <div className="flex flex-wrap gap-1">
                          {presence.musicStyles.map(style => (
                            <span key={style} className="px-1.5 py-0.5 rounded bg-primary/15 dark:bg-primary/10 text-xs text-primary font-medium">
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {/* Action buttons */}
          <div className="mt-auto pt-2 flex gap-2">
            {/* View Profile button */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                navigate(`/user/${presence.profile?.id}`);
              }}
              variant="outline"
              className="flex-1 gap-2 h-10 text-sm hover:bg-secondary/80 transition-all duration-200"
            >
              <User className="w-4 h-4" />
              <span>Ver perfil</span>
            </Button>
            
            {/* Ghost message button */}
            {messageSent ? (
              <Button
                variant="secondary"
                disabled
                className="flex-1 gap-2 h-10 text-sm transition-all duration-300"
              >
                <Check className="w-4 h-4 animate-scale-in" />
                Enviado
              </Button>
            ) : (
              <Button
                onClick={handleOpenDialog}
                disabled={sending || !limitData?.canSend}
                className="group flex-1 gap-2 h-10 text-sm active:scale-[0.96] hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
                variant="default"
              >
                <Ghost className="w-4 h-4 group-hover:animate-bounce transition-transform" />
                <span>Ghost</span>
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
                <div className="space-y-4">
                  <Sparkles className="w-12 h-12 mx-auto text-primary animate-pulse" />
                  <p className="font-display text-lg text-primary">¡Chispa mutua!</p>
                  <p className="text-sm text-muted-foreground">Mira su perfil antes de chatear</p>
                  <Button
                    onClick={() => navigate(`/user/${presence.profile?.id}`)}
                    className="gap-2"
                  >
                    <Ghost className="w-4 h-4" />
                    Ver perfil
                  </Button>
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
                      : "border-border bg-card hover:border-primary/50 text-card-foreground"
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
                onClick={() => { triggerHaptic('success'); handleSendGhostMessage(false); }}
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
