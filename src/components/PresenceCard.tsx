import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Music, Sparkles, MoreVertical, Flag, Ban, Calendar, Search, Star, Zap } from "lucide-react";
import { useOrganizedQuedadasCount } from "@/hooks/useQuedadas";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import PremiumBadge from "@/components/PremiumBadge";
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

interface PresenceProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  vibe: string | null;
  has_tattoos: boolean | null;
  has_piercings: boolean | null;
  alternative_aesthetic: boolean | null;
  looking_for: string[] | null;
}

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
  };
  compatibility: number;
  compatibilityBreakdown?: CompatibilityBreakdown;
  animationDelay: number;
  photos?: string[];
  isBoosted?: boolean;
}

const PresenceCard = ({ presence, compatibility, compatibilityBreakdown, animationDelay, photos = [], isBoosted = false }: PresenceCardProps) => {
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

  return (
    <>
      <div
        className={`w-full bg-card rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] animate-fade-up cursor-pointer ${
          isBoosted ? "ring-2 ring-primary/50 shadow-lg shadow-primary/20" : ""
        }`}
        style={{ animationDelay: `${animationDelay}ms` }}
        onClick={handleCardClick}
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
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg animate-pulse z-10">
              <Zap className="w-3 h-3 text-white fill-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wide">Now</span>
            </div>
          )}
          
          {/* Compatibility badge overlay with tooltip */}
          {compatibility > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm shadow-lg cursor-help transition-all ${
                    compatibility >= 5 
                      ? "bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite] shadow-primary/40 shadow-lg" 
                      : "bg-primary/90"
                  }`}>
                    {compatibility >= 5 ? (
                      <Star className="w-3 h-3 text-primary-foreground fill-primary-foreground animate-pulse" />
                    ) : (
                      <Heart className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
                    )}
                    <span className="text-xs font-bold text-primary-foreground">
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
          <div className="absolute top-3 right-3">
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
        </div>

        {/* Info section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-display text-lg font-semibold text-card-foreground">
              {presence.profile?.name || "Anónima"}
            </h3>
            {subscriptionTier === 'premium' && <PremiumBadge size="sm" />}
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
            {organizedCount && organizedCount > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-[10px] font-body text-accent bg-accent/10 px-2 py-0.5 rounded-full cursor-help animate-pulse-soft">
                      <Calendar className="w-2.5 h-2.5" />
                      {organizedCount}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ha organizado {organizedCount} {organizedCount === 1 ? "quedada" : "quedadas"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <p className="font-body text-sm text-card-foreground/70 mb-3">
            Vibra {presence.profile?.vibe?.toLowerCase() || "misteriosa"}
          </p>
          
          {/* Tribes */}
          {presence.tribes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {presence.tribes.map(tribe => (
                <span 
                  key={tribe}
                  className="px-2.5 py-1 rounded-full bg-card-foreground/10 font-body text-xs text-card-foreground/80"
                >
                  {tribe}
                </span>
              ))}
            </div>
          )}

          {/* Music styles */}
          {presence.musicStyles.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <Music className="w-3 h-3 text-primary/70 flex-shrink-0" />
              <p className="font-body text-xs text-card-foreground/60 truncate">
                {presence.musicStyles.slice(0, 3).join(" · ")}
                {presence.musicStyles.length > 3 && ` +${presence.musicStyles.length - 3}`}
              </p>
            </div>
          )}

          {/* Looking for */}
          {presence.profile?.looking_for && presence.profile.looking_for.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <Search className="w-3 h-3 text-secondary/70 flex-shrink-0" />
              <p className="font-body text-xs text-card-foreground/60">
                Busca: {presence.profile.looking_for.slice(0, 2).join(", ")}
                {presence.profile.looking_for.length > 2 && ` +${presence.profile.looking_for.length - 2}`}
              </p>
            </div>
          )}

          {/* Optional details */}
          {(presence.profile?.has_tattoos || presence.profile?.has_piercings || presence.profile?.alternative_aesthetic) && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-accent/70 flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                {presence.profile?.has_tattoos && (
                  <span className="px-2 py-0.5 rounded-full bg-accent/10 font-body text-[10px] text-accent">
                    Tatuajes
                  </span>
                )}
                {presence.profile?.has_piercings && (
                  <span className="px-2 py-0.5 rounded-full bg-accent/10 font-body text-[10px] text-accent">
                    Piercings
                  </span>
                )}
                {presence.profile?.alternative_aesthetic && (
                  <span className="px-2 py-0.5 rounded-full bg-accent/10 font-body text-[10px] text-accent">
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
