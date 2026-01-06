import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Music, Sparkles, MapPin, Heart, MoreVertical, Flag, Shield, Calendar, User, ChevronDown, ChevronUp, Target } from "lucide-react";
import ErrorState from "@/components/ErrorState";
import PublicProfileSkeleton from "@/components/PublicProfileSkeleton";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useProfile, useProfileTribes, useProfileMusicStyles } from "@/hooks/useProfile";
import { useIsBlocked } from "@/hooks/useUserModeration";
import { useOrganizedQuedadasCount } from "@/hooks/useQuedadas";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { Button } from "@/components/ui/button";
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
import ProfilePhotoGallery from "@/components/ProfilePhotoGallery";
import { triggerHaptic } from "@/utils/haptics";
import ParallaxBackground from "@/components/ParallaxBackground";

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
  const [bioExpanded, setBioExpanded] = useState(false);

  // Find shared tribes, music styles and looking_for
  const compatibility = useMemo(() => {
    const myTribeNames = myTribes?.map(t => t.tribe) || [];
    const myStyleNames = myMusicStyles?.map(m => m.style) || [];
    const myLookingFor = myProfile?.looking_for || [];
    
    const sharedTribes = publicProfile?.tribes.filter(t => myTribeNames.includes(t)) || [];
    const sharedMusic = publicProfile?.musicStyles.filter(m => myStyleNames.includes(m)) || [];
    const theirLookingFor = (publicProfile?.profile as any)?.looking_for || [];
    const sharedLookingFor = theirLookingFor.filter((l: string) => myLookingFor.includes(l));
    
    const totalShared = sharedTribes.length + sharedMusic.length + sharedLookingFor.length;
    
    return { sharedTribes, sharedMusic, sharedLookingFor, totalShared };
  }, [publicProfile, myTribes, myMusicStyles, myProfile?.looking_for]);

  if (isLoading) {
    return <PublicProfileSkeleton />;
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
    <main className="min-h-screen bg-background flex flex-col pb-24 relative overflow-hidden">
      {/* Parallax ambient glow */}
      <ParallaxBackground variant="profile" />
      
      {/* Header */}
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 font-body group"
          aria-label="Volver atrás"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver</span>
        </button>
        <span className="text-xl font-bold text-foreground" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>KIKI</span>
        
        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              aria-label="Más opciones"
              title="Más opciones"
            >
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
            isOwnProfile={myProfile?.id === profileId}
          />
        </div>

        {/* Name and vibe */}
        <div className="text-center mb-8 animate-fade-up animate-delay-100">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {profile.name || "Anónima"}
              {(profile as any).birthdate && (
                <span className="font-normal text-muted-foreground ml-2">
                  {calculateAge((profile as any).birthdate)}
                </span>
              )}
            </h1>
            {(profile as any).email_verified && <VerifiedBadge type="email" size="md" />}
            {(profile as any).identity_verified && <VerifiedBadge type="identity" size="md" />}
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

        {/* Bio / Description */}
        {(profile as any).bio && (
          <div className="mb-8 animate-fade-up animate-delay-120">
            <div className="p-4 rounded-2xl bg-card border border-border">
              <p className={`font-body text-card-foreground ${!bioExpanded && (profile as any).bio.length > 150 ? "line-clamp-3" : ""}`}>
                {(profile as any).bio}
              </p>
              {(profile as any).bio.length > 150 && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="mt-2 flex items-center gap-1 text-primary font-body text-sm hover:underline"
                >
                  {bioExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Ver más
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Looking for */}
        {(profile as any).looking_for && (profile as any).looking_for.length > 0 && (
          <div className="mb-8 animate-fade-up animate-delay-130">
            <h2 className="font-display text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Busca en KIKI
            </h2>
            <div className="flex flex-wrap gap-2">
              {((profile as any).looking_for as string[]).map((item: string) => {
                const isShared = compatibility.sharedLookingFor.includes(item);
                return (
                  <span 
                    key={item}
                    className={`px-3 py-1.5 rounded-full font-body text-sm ${
                      isShared 
                        ? "bg-secondary/80 text-secondary-foreground ring-1 ring-secondary" 
                        : "bg-secondary/40 text-secondary-foreground"
                    }`}
                  >
                    {isShared && "✓ "}{item}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {compatibility.totalShared > 0 && (
          <div className={`mb-8 p-4 rounded-2xl border animate-fade-up animate-delay-150 ${
            compatibility.totalShared >= 5 
              ? "bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border-primary/30" 
              : "bg-primary/10 border-primary/20"
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Heart className={`w-4 h-4 text-primary ${compatibility.totalShared >= 5 ? "animate-pulse" : ""}`} />
              <span className="font-display text-sm font-semibold text-primary">
                {compatibility.totalShared >= 5 && "✨ "}
                {compatibility.totalShared} {compatibility.totalShared === 1 ? "cosa en común" : "cosas en común"}
              </span>
            </div>
            
            {compatibility.sharedTribes.length > 0 && (
              <div className="mb-2">
                <span className="font-body text-xs text-muted-foreground">🏴 Tribus: </span>
                <span className="font-body text-sm text-foreground">
                  {compatibility.sharedTribes.join(", ")}
                </span>
              </div>
            )}
            
            {compatibility.sharedMusic.length > 0 && (
              <div className="mb-2">
                <span className="font-body text-xs text-muted-foreground">🎵 Música: </span>
                <span className="font-body text-sm text-foreground">
                  {compatibility.sharedMusic.join(", ")}
                </span>
              </div>
            )}

            {compatibility.sharedLookingFor.length > 0 && (
              <div>
                <span className="font-body text-xs text-muted-foreground">🔍 Buscan: </span>
                <span className="font-body text-sm text-foreground">
                  {compatibility.sharedLookingFor.join(", ")}
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
              onClick={() => { triggerHaptic('selection'); navigate(`/chat/${profileId}`); }}
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
