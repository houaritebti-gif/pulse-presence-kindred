import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MoreVertical, Flag, Ban, Zap, MapPin } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { ALL_GENDERS } from "@/constants/profileOptions";
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
import SharedPhotoTransition from "@/components/SharedPhotoTransition";
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
  gender?: string | null;
  city?: string | null;
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
        {/* Photo carousel - larger display with shared transition */}
        <SharedPhotoTransition profileId={presence.profile?.id || presence.id}>
          <PhotoCarousel
            photos={photos}
            avatarUrl={presence.profile?.avatar_url}
            name={presence.profile?.name}
            profileId={presence.profile?.id}
            size="lg"
            showArrows={true}
            showDots={true}
            enableSharedTransition={false}
          />
          
          {/* KIKI Now boost badge */}
          {isBoosted && (
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg animate-pulse z-10">
              <Zap className="w-3 h-3 text-white fill-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wide">Now</span>
            </div>
          )}
          
          {/* Compatibility badge overlay - simplified X/5 format */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm shadow-lg cursor-help transition-all ${
                  compatibility >= 5
                    ? "bg-[length:400%_100%] bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_12px_4px_hsl(var(--primary)/0.5)] animate-shimmer-badge"
                    : compatibility >= 4 
                      ? "bg-[length:400%_100%] bg-gradient-to-r from-primary via-accent to-primary shadow-primary/30 animate-shimmer-badge" 
                      : "bg-background/80"
                }`}>
                  <Heart className={`w-3 h-3 transition-transform ${
                    compatibility >= 4 
                      ? "text-primary-foreground fill-primary-foreground" 
                      : "text-primary fill-primary"
                  } ${compatibility >= 5 ? "animate-bounce" : ""}`} />
                  <span className={`text-[11px] sm:text-xs font-bold ${compatibility >= 4 ? "text-primary-foreground" : "text-foreground"}`}>
                    {Math.min(compatibility, 5)}/5
                  </span>
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
                      <p>🔍 {compatibilityBreakdown.lookingFor} {compatibilityBreakdown.lookingFor === 1 ? "interés" : "intereses"}</p>
                    )}
                  </div>
                ) : (
                  <p>{compatibility} coincidencias</p>
                )}
              </TooltipContent>
          </Tooltip>
          </TooltipProvider>

          {/* City badge - bottom left */}
          {presence.profile?.city && (
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm shadow-md z-10">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] sm:text-xs font-medium text-foreground">
                {presence.profile.city}
              </span>
            </div>
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
        </SharedPhotoTransition>

        {/* Info section - fixed height for consistent cards */}
        <div className="p-3 sm:p-4 h-[140px] sm:h-[130px] flex flex-col">
          {/* Activity status - top */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className={`w-2 h-2 rounded-full ${activityStatus.color} ${activityStatus.isActive ? "animate-pulse shadow-sm shadow-green-500/50" : ""}`} />
            <span className={`text-xs font-body ${activityStatus.isActive ? "text-green-500 font-medium" : "text-muted-foreground"}`}>
              {activityStatus.isActive ? "Activo ahora" : activityStatus.label}
            </span>
          </div>

          {/* Name + Age + Verified badge */}
          <h3 className="font-display text-base sm:text-lg font-semibold text-card-foreground leading-tight mb-2 flex items-center gap-1.5">
            <span>
              {presence.profile?.name || "Anónima"}
              {(presence.profile?.birthdate || presence.profile?.gender) && (
                <span className="font-normal text-muted-foreground ml-1.5">
                  {presence.profile?.birthdate && calculateAge(presence.profile.birthdate)}
                  {presence.profile?.birthdate && presence.profile?.gender && ", "}
                  {presence.profile?.gender && getGenderLabel(presence.profile.gender)}
                </span>
              )}
            </span>
            {presence.profile?.identity_verified && <VerifiedBadge type="identity" size="sm" />}
          </h3>
          
          {/* Interests tags */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1 overflow-hidden relative cursor-default">
                  <div className="flex flex-wrap gap-1.5 max-h-[44px] overflow-hidden">
                    {/* Show tribes first */}
                    {presence.tribes.slice(0, 3).map(tribe => (
                      <span 
                        key={tribe}
                        className="px-2 py-0.5 rounded-full bg-card-foreground/15 font-body text-xs text-card-foreground"
                      >
                        {tribe}
                      </span>
                    ))}
                    {/* Then music styles */}
                    {presence.musicStyles.slice(0, 2).map(style => (
                      <span 
                        key={style}
                        className="px-2 py-0.5 rounded-full bg-primary/10 font-body text-xs text-primary"
                      >
                        {style}
                      </span>
                    ))}
                    {/* Show +N if more */}
                    {(presence.tribes.length + presence.musicStyles.length > 5) && (
                      <span className="px-2 py-0.5 rounded-full bg-card-foreground/10 font-body text-xs text-muted-foreground">
                        +{presence.tribes.length + presence.musicStyles.length - 5}
                      </span>
                    )}
                  </div>
                  {/* Fade gradient overlay */}
                  {(presence.tribes.length + presence.musicStyles.length > 4) && (
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                  )}
                </div>
              </TooltipTrigger>
              {(presence.tribes.length > 0 || presence.musicStyles.length > 0) && (
                <TooltipContent side="top" className="max-w-[280px]">
                  <div className="space-y-2">
                    {presence.tribes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Tribus</p>
                        <div className="flex flex-wrap gap-1">
                          {presence.tribes.map(tribe => (
                            <span key={tribe} className="px-1.5 py-0.5 rounded bg-card-foreground/15 text-xs">
                              {tribe}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {presence.musicStyles.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Música</p>
                        <div className="flex flex-wrap gap-1">
                          {presence.musicStyles.map(style => (
                            <span key={style} className="px-1.5 py-0.5 rounded bg-primary/10 text-xs text-primary">
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
