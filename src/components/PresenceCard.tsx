import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Music, Sparkles, MoreVertical, Flag, Ban, Calendar, Search, Star, Zap } from "lucide-react";
import { useOrganizedQuedadasCount } from "@/hooks/useQuedadas";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import PremiumBadge from "@/components/PremiumBadge";
import VerifiedBadge from "@/components/VerifiedBadge";
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
import PhotoCarousel from "@/components/PhotoCarousel";
import { triggerHaptic } from "@/utils/haptics";

interface PresenceProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  vibe: string | null;
  has_tattoos: boolean | null;
  has_piercings: boolean | null;
  alternative_aesthetic: boolean | null;
  looking_for: string[] | null;
  email_verified: boolean | null;
  identity_verified: boolean | null;
  birthdate?: string | null;
}

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

interface CompatibilityBreakdown {
  tribes: number;
  music: number;
  lookingFor: number;
}

interface PresenceCardProps {
  presence: {
    id: string;
    profile: PresenceProfile | null;
    tribes: string[];
    musicStyles: string[];
    last_pulse?: string;
    is_present?: boolean;
  };
  compatibility: number;
  compatibilityBreakdown?: CompatibilityBreakdown;
  animationDelay: number;
  photos?: string[];
  isBoosted?: boolean;
}

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

interface PresenceCardProps {
  presence: {
    id: string;
    profile: PresenceProfile | null;
    tribes: string[];
    musicStyles: string[];
    last_pulse?: string;
    is_present?: boolean;
  };
  compatibility: number;
  compatibilityBreakdown?: CompatibilityBreakdown;
  animationDelay: number;
  photos?: string[];
  isBoosted?: boolean;
  canSeeRealtimePresence?: boolean;
}

const PresenceCard = ({ presence, compatibility, compatibilityBreakdown, animationDelay, photos = [], isBoosted = false, canSeeRealtimePresence = true }: PresenceCardProps) => {
  const navigate = useNavigate();
  const { data: organizedCount } = useOrganizedQuedadasCount(presence.profile?.id);
  const { data: subscriptionTier } = useUserSubscription(presence.profile?.id);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationMode, setModerationMode] = useState<"report" | "block">("report");

  const handleCardClick = () => {
    navigate(`/user/${presence.profile?.id}`);
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

  const activityStatus = getActivityStatus(presence.last_pulse, presence.is_present, canSeeRealtimePresence);

  return (
    <>
      <div
        className={`w-full bg-card rounded-2xl sm:rounded-3xl overflow-hidden text-left transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 active:scale-[0.98] animate-fade-up cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          isBoosted ? "ring-2 ring-primary/50 shadow-lg shadow-primary/20" : "shadow-md"
        }`}
        style={{ animationDelay: `${animationDelay}ms` }}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Ver perfil de ${presence.profile?.name || "usuario anónimo"}`}
      >
        {/* Photo carousel - larger display */}
        <div className="relative">
          <PhotoCarousel
            photos={photos}
            avatarUrl={presence.profile?.avatar_url}
            name={presence.profile?.name}
            size="lg"
            showArrows={true}
            showDots={true}
          />
          
          {/* KIKI Now boost badge */}
          {isBoosted && (
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg animate-pulse z-10">
              <Zap className="w-3 h-3 text-white fill-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wide">Now</span>
            </div>
          )}
          
          {/* Compatibility badge overlay with tooltip */}
          {compatibility > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full backdrop-blur-sm shadow-lg cursor-help transition-all ${
                    compatibility >= 5 
                      ? "bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite] shadow-primary/40 shadow-lg" 
                      : "bg-primary/90"
                  }`}>
                    {compatibility >= 5 ? (
                      <Star className="w-3 h-3 text-primary-foreground fill-primary-foreground animate-pulse" />
                    ) : (
                      <Heart className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
                    )}
                    <span className="text-[11px] sm:text-xs font-bold text-primary-foreground">
                      {compatibility} en común
                    </span>
                    {compatibility >= 5 && (
                      <Sparkles className="w-3 h-3 text-primary-foreground animate-pulse" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {compatibilityBreakdown ? (
                    <div className="space-y-1">
                      {compatibility >= 5 && (
                        <p className="text-primary font-semibold">✨ ¡Alta compatibilidad!</p>
                      )}
                      {compatibilityBreakdown.tribes > 0 && (
                        <p>🏴 {compatibilityBreakdown.tribes} {compatibilityBreakdown.tribes === 1 ? "tribu" : "tribus"}</p>
                      )}
                      {compatibilityBreakdown.music > 0 && (
                        <p>🎵 {compatibilityBreakdown.music} {compatibilityBreakdown.music === 1 ? "estilo" : "estilos"}</p>
                      )}
                      {compatibilityBreakdown.lookingFor > 0 && (
                        <p>🔍 {compatibilityBreakdown.lookingFor} {compatibilityBreakdown.lookingFor === 1 ? "interés" : "intereses"}</p>
                      )}
                    </div>
                  ) : (
                    <p>{compatibility} coincidencias</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Options menu overlay */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); }}
                  className="group w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-background hover:shadow-lg active:scale-90 transition-all duration-200"
                >
                  <MoreVertical className="w-5 h-5 sm:w-4 sm:h-4 text-foreground group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 sm:w-40 animate-scale-in">
                <DropdownMenuItem onClick={(e) => { triggerHaptic('medium'); handleReport(e); }} className="gap-2 cursor-pointer py-3 sm:py-2 transition-colors hover:bg-muted/80">
                  <Flag className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span className="text-sm">Reportar</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { triggerHaptic('warning'); handleBlock(e); }} className="gap-2 text-destructive cursor-pointer py-3 sm:py-2 transition-colors hover:bg-destructive/10">
                  <Ban className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span className="text-sm">Bloquear</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info section - improved mobile legibility */}
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {/* Name row with badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h3 className="font-display text-base sm:text-lg font-semibold text-card-foreground leading-tight">
              {presence.profile?.name || "Anónima"}
              {presence.profile?.birthdate && (
                <span className="font-normal text-muted-foreground ml-1.5">
                  {calculateAge(presence.profile.birthdate)}
                </span>
              )}
            </h3>
            {presence.profile?.email_verified && <VerifiedBadge type="email" size="sm" />}
            {presence.profile?.identity_verified && <VerifiedBadge type="identity" size="sm" />}
            {subscriptionTier === 'premium' && <PremiumBadge size="sm" />}
            
            {/* Activity indicator - more visible on mobile */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help ml-auto sm:ml-0">
                    <div className={`w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full ${activityStatus.color} ${activityStatus.isActive ? "animate-pulse shadow-sm shadow-green-500/50" : ""}`} />
                    {!activityStatus.isActive && (
                      <span className="text-[11px] sm:text-[10px] text-muted-foreground font-body font-medium">
                        {activityStatus.label}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{activityStatus.isActive ? "Conectado ahora mismo" : `Última conexión: ${activityStatus.label}`}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Organized quedadas badge - separate row for visibility */}
          {organizedCount && organizedCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-[10px] font-body font-medium text-accent bg-accent/15 px-2.5 py-1 rounded-full cursor-help">
                    <Calendar className="w-3 h-3 sm:w-2.5 sm:h-2.5" />
                    {organizedCount} {organizedCount === 1 ? "quedada organizada" : "quedadas organizadas"}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ha organizado {organizedCount} {organizedCount === 1 ? "quedada" : "quedadas"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Vibe */}
          <p className="font-body text-sm text-card-foreground/90">
            Vibra <span className="font-medium">{presence.profile?.vibe?.toLowerCase() || "misteriosa"}</span>
          </p>
          
          {/* Tribes - improved touch targets */}
          {presence.tribes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-1.5">
              {presence.tribes.map(tribe => (
                <span 
                  key={tribe}
                  className="px-2.5 sm:px-2.5 py-1.5 sm:py-1 rounded-full bg-card-foreground/15 font-body text-xs text-card-foreground font-medium"
                >
                  {tribe}
                </span>
              ))}
            </div>
          )}

          {/* Music styles - better contrast */}
          {presence.musicStyles.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-1.5">
              <Music className="w-4 h-4 sm:w-3 sm:h-3 text-primary flex-shrink-0" />
              <p className="font-body text-sm sm:text-xs text-card-foreground/90 truncate">
                {presence.musicStyles.slice(0, 3).join(" · ")}
                {presence.musicStyles.length > 3 && ` +${presence.musicStyles.length - 3}`}
              </p>
            </div>
          )}

          {/* Looking for - better contrast */}
          {presence.profile?.looking_for && presence.profile.looking_for.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-1.5">
              <Search className="w-4 h-4 sm:w-3 sm:h-3 text-primary/80 flex-shrink-0" />
              <p className="font-body text-sm sm:text-xs text-card-foreground/90">
                Busca: {presence.profile.looking_for.slice(0, 2).join(", ")}
                {presence.profile.looking_for.length > 2 && ` +${presence.profile.looking_for.length - 2}`}
              </p>
            </div>
          )}

          {/* Optional details - larger touch targets */}
          {(presence.profile?.has_tattoos || presence.profile?.has_piercings || presence.profile?.alternative_aesthetic) && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-3 sm:h-3 text-accent/80 flex-shrink-0" />
              <div className="flex flex-wrap gap-1.5 sm:gap-1">
                {presence.profile?.has_tattoos && (
                  <span className="px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-full bg-accent/15 font-body text-[11px] sm:text-[10px] text-accent font-medium">
                    Tatuajes
                  </span>
                )}
                {presence.profile?.has_piercings && (
                  <span className="px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-full bg-accent/15 font-body text-[11px] sm:text-[10px] text-accent font-medium">
                    Piercings
                  </span>
                )}
                {presence.profile?.alternative_aesthetic && (
                  <span className="px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-full bg-accent/15 font-body text-[11px] sm:text-[10px] text-accent font-medium">
                    Estética alt
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Moderation Modal */}
      {showModerationModal && presence.profile?.id && (
        <UserModerationModal
          profileId={presence.profile.id}
          profileName={presence.profile.name || "Usuario"}
          onClose={() => setShowModerationModal(false)}
          initialMode={moderationMode}
        />
      )}
    </>
  );
};

export default PresenceCard;
