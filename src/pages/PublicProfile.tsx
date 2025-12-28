import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Music, Sparkles, MapPin, Heart, MoreVertical, Flag, Shield, Calendar, User } from "lucide-react";
import ErrorState from "@/components/ErrorState";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useProfile, useProfileTribes, useProfileMusicStyles } from "@/hooks/useProfile";
import { useIsBlocked } from "@/hooks/useUserModeration";
import { useOrganizedQuedadasCount } from "@/hooks/useQuedadas";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { Button } from "@/components/ui/button";
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
import ProfilePhotoGallery from "@/components/ProfilePhotoGallery";

const PublicProfile = () => {
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId: string }>();
  const { data: publicProfile, isLoading, isError } = usePublicProfile(profileId);
  const { data: myProfile } = useProfile();
  const { data: myTribes } = useProfileTribes(myProfile?.id);
  const { data: myMusicStyles } = useProfileMusicStyles(myProfile?.id);
  const isBlocked = useIsBlocked(profileId);
  const { data: organizedCount } = useOrganizedQuedadasCount(profileId);
  const { data: profilePhotos } = useProfilePhotos(profileId);
  const { data: subscriptionTier } = useUserSubscription(profileId);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationMode, setModerationMode] = useState<"report" | "block">("report");

  // Find shared tribes and music styles
  const compatibility = useMemo(() => {
    const myTribeNames = myTribes?.map(t => t.tribe) || [];
    const myStyleNames = myMusicStyles?.map(m => m.style) || [];
    
    const sharedTribes = publicProfile?.tribes.filter(t => myTribeNames.includes(t)) || [];
    const sharedMusic = publicProfile?.musicStyles.filter(m => myStyleNames.includes(m)) || [];
    
    const totalShared = sharedTribes.length + sharedMusic.length;
    
    return { sharedTribes, sharedMusic, totalShared };
  }, [publicProfile, myTribes, myMusicStyles]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (isError) {
    return (
      <ErrorState
        icon={User}
        description="No pudimos cargar este perfil. Revisa tu conexión."
        fullScreen
        customAction={
          <Button variant="kiki-soft" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        }
      />
    );
  }

  if (!publicProfile?.profile) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-card/50 flex items-center justify-center mx-auto mb-4">
          <User className="w-6 h-6 text-muted-foreground/30" />
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">
          Perfil no encontrado
        </h2>
        <p className="font-body text-muted-foreground text-center mb-6 max-w-[240px]">
          Esta persona ya no existe o ha eliminado su cuenta.
        </p>
        <Button variant="kiki-soft" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </main>
    );
  }

  const profile = publicProfile.profile;

  return (
    <main className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
        <span className="font-display text-xl font-bold text-foreground">KIKI</span>
        
        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-2">
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => {
                setModerationMode("report");
                setShowModerationModal(true);
              }}
              className="gap-2"
            >
              <Flag className="w-4 h-4" />
              Reportar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setModerationMode("block");
                setShowModerationModal(true);
              }}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Shield className="w-4 h-4" />
              Bloquear
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Profile content */}
      <div className="flex-1 px-6 max-w-lg mx-auto w-full">
        {/* Photo Gallery */}
        <div className="mb-6 animate-fade-up">
          <ProfilePhotoGallery
            photos={profilePhotos?.map(p => p.photo_url) || []}
            avatarUrl={profile.avatar_url}
            name={profile.name}
          />
        </div>

        {/* Name and vibe */}
        <div className="text-center mb-8 animate-fade-up animate-delay-100">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {profile.name || "Anónima"}
            </h1>
            {subscriptionTier === 'premium' && <PremiumBadge size="lg" />}
          </div>
          
          {/* Organizer badge */}
          {organizedCount && organizedCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent mb-2 cursor-help animate-pulse-soft">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-body text-xs font-medium">
                      {organizedCount} {organizedCount === 1 ? "quedada organizada" : "quedadas organizadas"}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Esta persona organiza eventos para la comunidad</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {profile.vibe && (
            <p className="font-body text-primary text-lg">
              Vibra {profile.vibe.toLowerCase()}
            </p>
          )}
          {profile.city && (
            <div className="flex items-center justify-center gap-1.5 mt-2 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span className="font-body text-sm">{profile.city}</span>
            </div>
          )}
        </div>

        {/* Compatibility indicator */}
        {compatibility.totalShared > 0 && (
          <div className="mb-8 p-4 rounded-2xl bg-primary/10 border border-primary/20 animate-fade-up animate-delay-150">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-primary" />
              <span className="font-display text-sm font-semibold text-primary">
                {compatibility.totalShared} {compatibility.totalShared === 1 ? "cosa en común" : "cosas en común"}
              </span>
            </div>
            
            {compatibility.sharedTribes.length > 0 && (
              <div className="mb-2">
                <span className="font-body text-xs text-muted-foreground">Tribus compartidas: </span>
                <span className="font-body text-sm text-foreground">
                  {compatibility.sharedTribes.join(", ")}
                </span>
              </div>
            )}
            
            {compatibility.sharedMusic.length > 0 && (
              <div>
                <span className="font-body text-xs text-muted-foreground">Música en común: </span>
                <span className="font-body text-sm text-foreground">
                  {compatibility.sharedMusic.join(", ")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tribes */}
        {publicProfile.tribes.length > 0 && (
          <div className="mb-6 animate-fade-up animate-delay-200">
            <h2 className="font-display text-sm font-semibold text-muted-foreground mb-3">
              Tribus
            </h2>
            <div className="flex flex-wrap gap-2">
              {publicProfile.tribes.map(tribe => {
                const isShared = compatibility.sharedTribes.includes(tribe);
                return (
                  <span 
                    key={tribe}
                    className={`px-3 py-1.5 rounded-full font-body text-sm ${
                      isShared 
                        ? "bg-primary/20 text-primary ring-1 ring-primary/30" 
                        : "bg-card text-card-foreground"
                    }`}
                  >
                    {tribe}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Music styles */}
        {publicProfile.musicStyles.length > 0 && (
          <div className="mb-6 animate-fade-up animate-delay-300">
            <h2 className="font-display text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Music className="w-4 h-4" />
              Estilos de música
            </h2>
            <div className="flex flex-wrap gap-2">
              {publicProfile.musicStyles.map(style => {
                const isShared = compatibility.sharedMusic.includes(style);
                return (
                  <span 
                    key={style}
                    className={`px-3 py-1.5 rounded-full font-body text-sm ${
                      isShared 
                        ? "bg-primary/30 text-primary ring-1 ring-primary/40" 
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {style}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional details */}
        {(profile.has_tattoos || profile.has_piercings || profile.alternative_aesthetic) && (
          <div className="mb-8 animate-fade-up animate-delay-400">
            <h2 className="font-display text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Detalles
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.has_tattoos && (
                <span className="px-3 py-1.5 rounded-full bg-accent/10 font-body text-sm text-accent">
                  Tatuajes
                </span>
              )}
              {profile.has_piercings && (
                <span className="px-3 py-1.5 rounded-full bg-accent/10 font-body text-sm text-accent">
                  Piercings
                </span>
              )}
              {profile.alternative_aesthetic && (
                <span className="px-3 py-1.5 rounded-full bg-accent/10 font-body text-sm text-accent">
                  Estética alternativa
                </span>
              )}
            </div>
          </div>
        )}

        {/* Ghost message CTA */}
        {!isBlocked && (
          <div className="mt-auto pt-8 animate-fade-up animate-delay-500">
            <Button
              onClick={() => navigate(`/chat/${profileId}`)}
              className="w-full h-14 rounded-2xl font-display text-base font-semibold"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Enviar mensaje ghost
            </Button>
            <p className="text-center font-body text-xs text-muted-foreground mt-3">
              Un mensaje valiente. Sin obligación de respuesta.
            </p>
          </div>
        )}

        {/* Blocked indicator */}
        {isBlocked && (
          <div className="mt-auto pt-8 animate-fade-up animate-delay-500">
            <div className="bg-destructive/10 rounded-2xl p-4 text-center">
              <Shield className="w-6 h-6 text-destructive mx-auto mb-2" />
              <p className="font-body text-sm text-card-foreground">
                Has bloqueado a esta persona
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Moderation Modal */}
      {showModerationModal && profileId && (
        <UserModerationModal
          profileId={profileId}
          profileName={profile.name || "Usuario"}
          onClose={() => setShowModerationModal(false)}
          initialMode={moderationMode}
        />
      )}
    </main>
  );
};

export default PublicProfile;
