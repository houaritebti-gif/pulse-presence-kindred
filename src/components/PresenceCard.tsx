import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Music, Sparkles, MoreVertical, Flag, Ban, Calendar } from "lucide-react";
import { useOrganizedQuedadasCount } from "@/hooks/useQuedadas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserModerationModal from "@/components/UserModerationModal";

interface PresenceProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  vibe: string | null;
  has_tattoos: boolean | null;
  has_piercings: boolean | null;
  alternative_aesthetic: boolean | null;
}

interface PresenceCardProps {
  presence: {
    id: string;
    profile: PresenceProfile | null;
    tribes: string[];
    musicStyles: string[];
  };
  compatibility: number;
  animationDelay: number;
}

const PresenceCard = ({ presence, compatibility, animationDelay }: PresenceCardProps) => {
  const navigate = useNavigate();
  const { data: organizedCount } = useOrganizedQuedadasCount(presence.profile?.id);
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
        className="w-full bg-card rounded-2xl p-6 text-left transition-all hover:scale-[1.02] animate-fade-up cursor-pointer"
        style={{ animationDelay: `${animationDelay}ms` }}
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-4">
          {/* Avatar with compatibility badge */}
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-card-foreground/10 flex-shrink-0 overflow-hidden">
              {presence.profile?.avatar_url ? (
                <img 
                  src={presence.profile.avatar_url} 
                  alt={presence.profile.name || "Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-card-foreground/40 font-display text-lg">
                  {(presence.profile?.name?.[0] || "?").toUpperCase()}
                </div>
              )}
            </div>
            {compatibility > 0 && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Heart className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-display text-lg font-semibold text-card-foreground">
                {presence.profile?.name || "Anónima"}
              </h3>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
              {organizedCount && organizedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-body text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  <Calendar className="w-2.5 h-2.5" />
                  {organizedCount}
                </span>
              )}
              {compatibility > 0 && (
                <span className="text-xs font-body text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {compatibility} en común
                </span>
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

          {/* Options menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-2 hover:bg-card-foreground/5 rounded-full transition-colors">
                <MoreVertical className="w-4 h-4 text-card-foreground/50" />
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
