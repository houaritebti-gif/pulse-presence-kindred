import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Music, Sparkles, MapPin, Heart, MoreVertical, Flag, Shield, Calendar, User, ChevronDown, ChevronUp, Target, Flame, Star, CloudOff, Camera } from "lucide-react";
import { OPTIONAL_DETAILS, OPTIONAL_DETAIL_CATEGORIES, getOptionalDetailsByCategory } from "@/constants/profileOptions";
import { useScreenshotProtection } from "@/hooks/useScreenshotProtection";
import { KikiLogo } from "@/components/KikiLogo";
import ErrorState from "@/components/ErrorState";
import PublicProfileSkeleton from "@/components/PublicProfileSkeleton";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useProfile, useProfileTribes, useProfileMusicStyles } from "@/hooks/useProfile";
import { useProfileInterests } from "@/hooks/useInterests";
import { useIsBlocked } from "@/hooks/useUserModeration";
import { useOrganizedQuedadasCount } from "@/hooks/useQuedadas";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useSparkChatWith } from "@/hooks/useSparks";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";
import { useProfilePrompts } from "@/hooks/useProfilePrompts";
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
import PublicAchievementsBadges from "@/components/PublicAchievementsBadges";
import { ProfilePromptsDisplay } from "@/components/ProfilePromptsDisplay";
import { triggerHaptic } from "@/utils/haptics";
import ParallaxBackground from "@/components/ParallaxBackground";
import { getZodiacSign, getBirthYear } from "@/utils/zodiacUtils";
import { useRecordProfileVisit } from "@/hooks/useProfileVisits";

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
  const sparkChatId = useSparkChatWith(profileId);
  const { prompts: profilePrompts } = useProfilePrompts(profileId);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationMode, setModerationMode] = useState<"report" | "block">("report");
  const [bioExpanded, setBioExpanded] = useState(false);
  
  // Screenshot protection - prevent captures of profile pages
  useScreenshotProtection(true);
  
  // Spark energy for profile exploration
  const { earnEnergy, canDoAction } = useSparkEnergy();
  const hasEarnedRef = useRef<string | null>(null);
  
  // Record profile visit for notifications
  useRecordProfileVisit(profileId);
  
  // Earn energy when viewing a different user's profile
  useEffect(() => {
    const isOwnProfile = myProfile?.id === profileId;
    const profileLoaded = publicProfile?.profile && !isLoading;
    const notEarnedYet = hasEarnedRef.current !== profileId;
    
    if (profileLoaded && !isOwnProfile && profileId && notEarnedYet && canDoAction('explore_profiles')) {
      hasEarnedRef.current = profileId;
      earnEnergy({ 
        action: 'explore_profiles', 
        description: `Exploraste el perfil de ${publicProfile.profile?.name || 'alguien'}` 
      });
    }
  }, [publicProfile, myProfile?.id, profileId, isLoading, earnEnergy, canDoAction]);

  // Fetch my interests for compatibility
  const { data: myInterests } = useProfileInterests(myProfile?.id);

  // Find shared tribes, music styles, looking_for and interests
  const compatibility = useMemo(() => {
    const myTribeNames = myTribes?.map(t => t.tribe) || [];
    const myStyleNames = myMusicStyles?.map(m => m.style) || [];
    const myLookingFor = myProfile?.looking_for || [];
    const myInterestNames = myInterests?.map(i => i.interest) || [];
    
    const sharedTribes = publicProfile?.tribes.filter(t => myTribeNames.includes(t)) || [];
    const sharedMusic = publicProfile?.musicStyles.filter(m => myStyleNames.includes(m)) || [];
    const theirLookingFor = (publicProfile?.profile as any)?.looking_for || [];
    const sharedLookingFor = theirLookingFor.filter((l: string) => myLookingFor.includes(l));
    const sharedInterests = publicProfile?.interests.filter(i => myInterestNames.includes(i)) || [];
    
    const totalShared = sharedTribes.length + sharedMusic.length + sharedLookingFor.length + sharedInterests.length;
    
    return { sharedTribes, sharedMusic, sharedLookingFor, sharedInterests, totalShared };
  }, [publicProfile, myTribes, myMusicStyles, myProfile?.looking_for, myInterests]);

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
  
  // Check if profile has mandatory photo
  const hasPhoto = (profilePhotos && profilePhotos.length > 0) || profile.avatar_url;
  
  if (!hasPhoto) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-card/50 flex items-center justify-center mx-auto mb-4">
          <Camera className="w-6 h-6 text-muted-foreground/30" />
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">
          Perfil incompleto
        </h2>
        <p className="font-body text-muted-foreground text-center mb-6 max-w-[240px]">
          Esta persona aún no ha subido fotos. Los perfiles sin foto no pueden visualizarse.
        </p>
        <Button variant="kiki-soft" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col pb-24 relative overflow-hidden">
      {/* Parallax ambient glow */}
      <ParallaxBackground variant="profile" />
      
      {/* Header */}
      <header className="px-6 py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center justify-start">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 font-body group"
            aria-label="Volver atrás"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver</span>
          </button>
        </div>
        <div className="flex items-center justify-center">
          <KikiLogo size="md" />
        </div>
        <div className="flex items-center justify-end">
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
      </header>

      {/* Profile content - Compact for mobile */}
      <div className="flex-1 px-4 md:px-6 max-w-lg mx-auto w-full">
        {/* Photo Gallery - slightly smaller on mobile */}
        <div className="mb-4 animate-fade-up">
          <ProfilePhotoGallery
            photos={profilePhotos?.map(p => p.photo_url) || []}
            avatarUrl={profile.avatar_url}
            name={profile.name}
            profileId={profileId}
            isOwnProfile={myProfile?.id === profileId}
          />
        </div>

        {/* Compact name row with badges */}
        <div className="text-center mb-4 animate-fade-up animate-delay-100">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">
              {profile.name || "Anónima"}
              {(profile as any).birthdate && (
                <span className="font-normal text-foreground/70 ml-1.5">
                  {calculateAge((profile as any).birthdate)}
                </span>
              )}
            </h1>
            {(profile as any).email_verified && <VerifiedBadge type="email" size="sm" />}
            {(profile as any).identity_verified && <VerifiedBadge type="identity" size="sm" />}
            {subscriptionTier === 'premium' && <PremiumBadge size="md" />}
            {/* Offline cache indicator */}
            {publicProfile?.fromCache && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground animate-fade-in">
                      <CloudOff className="w-3 h-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Datos en caché offline</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {/* Zodiac + Birth year row (respects visibility settings) */}
          {(profile as any).birthdate && (
            <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
              {/* Zodiac sign - only if show_zodiac is true */}
              {((profile as any).show_zodiac !== false) && (() => {
                const zodiac = getZodiacSign((profile as any).birthdate);
                return zodiac ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 text-muted-foreground text-sm cursor-help">
                          <span>{zodiac.emoji}</span>
                          <span>{zodiac.name}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{zodiac.dateRange}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null;
              })()}
              
              {/* Birth year - only if show_birth_year is true */}
              {((profile as any).show_birth_year !== false) && (() => {
                const birthYear = getBirthYear((profile as any).birthdate);
                return birthYear ? (
                  <>
                    {((profile as any).show_zodiac !== false) && getZodiacSign((profile as any).birthdate) && (
                      <span className="text-foreground/30">·</span>
                    )}
                    <span className="text-muted-foreground text-sm">
                      Nacido en {birthYear}
                    </span>
                  </>
                ) : null;
              })()}
            </div>
          )}
          
          {/* Compact info row: vibe + city + organizer */}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-1.5">
            {profile.vibe && (
              <span className="font-body text-primary text-sm">
                Vibra {profile.vibe.toLowerCase()}
              </span>
            )}
            {profile.vibe && profile.city && (
              <span className="text-foreground/30">·</span>
            )}
            {profile.city && (
              <span className="flex items-center gap-1 text-foreground/70 text-sm">
                <MapPin className="w-3 h-3" />
                {profile.city}
              </span>
            )}
            {organizedCount && organizedCount > 0 && (
              <>
                <span className="text-foreground/30">·</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 text-accent text-sm cursor-help">
                        <Calendar className="w-3 h-3" />
                        {organizedCount} {organizedCount === 1 ? "quedada" : "quedadas"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Esta persona organiza eventos para la comunidad</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </div>

        {/* Bio / Description - More compact */}
        {(profile as any).bio && (
          <div className="mb-5 animate-fade-up animate-delay-120">
            <div className="p-3 rounded-xl bg-card border border-border">
              <p className={`font-body text-sm text-card-foreground ${!bioExpanded && (profile as any).bio.length > 120 ? "line-clamp-2" : ""}`}>
                {(profile as any).bio}
              </p>
              {(profile as any).bio.length > 120 && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="mt-1.5 flex items-center gap-1 text-primary font-body text-xs hover:underline"
                >
                  {bioExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Más
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Looking for - Compact tags */}
        {(profile as any).looking_for && (profile as any).looking_for.length > 0 && (
          <div className="mb-5 animate-fade-up animate-delay-130">
            <h2 className="font-display text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              Busca en KIKI
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {((profile as any).looking_for as string[]).map((item: string) => {
                const isShared = compatibility.sharedLookingFor.includes(item);
                return (
                  <span 
                    key={item}
                    className={`px-2.5 py-1 rounded-full font-body text-xs ${
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
        {/* Compatibility - Compact card */}
        {compatibility.totalShared > 0 && (
          <div className={`mb-5 p-3 rounded-xl border animate-fade-up animate-delay-150 ${
            compatibility.totalShared >= 5 
              ? "bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border-primary/30" 
              : "bg-primary/10 border-primary/20"
          }`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Heart className={`w-3.5 h-3.5 text-primary ${compatibility.totalShared >= 5 ? "animate-pulse" : ""}`} />
              <span className="font-display text-xs font-semibold text-primary">
                {compatibility.totalShared >= 5 && "✨ "}
                {compatibility.totalShared} {compatibility.totalShared === 1 ? "cosa en común" : "cosas en común"}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {compatibility.sharedTribes.length > 0 && (
                <span className="text-foreground">🏴 {compatibility.sharedTribes.join(", ")}</span>
              )}
              {compatibility.sharedMusic.length > 0 && (
                <span className="text-foreground">🎵 {compatibility.sharedMusic.join(", ")}</span>
              )}
              {compatibility.sharedLookingFor.length > 0 && (
                <span className="text-foreground">🔍 {compatibility.sharedLookingFor.join(", ")}</span>
              )}
              {compatibility.sharedInterests.length > 0 && (
                <span className="text-foreground">⭐ {compatibility.sharedInterests.join(", ")}</span>
              )}
            </div>
          </div>
        )}

        {/* Tribes + Music + Interests + Details - Collapsed into single row sections */}
        <div className="space-y-4 animate-fade-up animate-delay-200">
          {/* Cultural Interests */}
          {publicProfile.interests.length > 0 && (
            <div>
              <h2 className="font-display text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <Star className="w-3 h-3" />
                Intereses
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {publicProfile.interests.map(interest => (
                  <span 
                    key={interest}
                    className="px-2.5 py-1 rounded-full font-body text-xs bg-secondary/60 text-secondary-foreground"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tribes */}
          {publicProfile.tribes.length > 0 && (
            <div>
              <h2 className="font-display text-xs font-semibold text-muted-foreground mb-1.5">Tribus</h2>
              <div className="flex flex-wrap gap-1.5">
                {publicProfile.tribes.map(tribe => {
                  const isShared = compatibility.sharedTribes.includes(tribe);
                  return (
                    <span 
                      key={tribe}
                      className={`px-2.5 py-1 rounded-full font-body text-xs ${
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
            <div>
              <h2 className="font-display text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <Music className="w-3 h-3" />
                Música
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {publicProfile.musicStyles.map(style => {
                  const isShared = compatibility.sharedMusic.includes(style);
                  return (
                    <span 
                      key={style}
                      className={`px-2.5 py-1 rounded-full font-body text-xs ${
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

          {/* Optional details - from JSONB or legacy fields (respects visibility) */}
          {((profile as any).show_optional_details !== false) && (() => {
            // Gather all active optional details
            const activeDetails: string[] = [];
            
            // Check JSONB optional_details first
            const optionalDetailsData = (profile as any).optional_details;
            if (optionalDetailsData && typeof optionalDetailsData === 'object') {
              Object.entries(optionalDetailsData as Record<string, boolean>).forEach(([key, value]) => {
                if (value === true) {
                  const detail = OPTIONAL_DETAILS.find(d => d.key === key);
                  if (detail) {
                    activeDetails.push(key);
                  }
                }
              });
            }
            
            // Fallback to legacy fields if JSONB is empty
            if (activeDetails.length === 0) {
              if (profile.has_tattoos) activeDetails.push('has_tattoos');
              if (profile.has_piercings) activeDetails.push('has_piercings');
              if (profile.alternative_aesthetic) activeDetails.push('alternative_aesthetic');
              if ((profile as any).colored_hair) activeDetails.push('colored_hair');
              if ((profile as any).shaved_head) activeDetails.push('shaved_head');
              if ((profile as any).vintage_style) activeDetails.push('vintage_style');
              if ((profile as any).gothic_style) activeDetails.push('gothic_style');
            }
            
            if (activeDetails.length === 0) return null;
            
            // Group by category for better display
            const groupedDetails = OPTIONAL_DETAIL_CATEGORIES.map(category => ({
              ...category,
              details: activeDetails
                .map(key => OPTIONAL_DETAILS.find(d => d.key === key))
                .filter(d => d && d.category === category.key)
            })).filter(cat => cat.details.length > 0);
            
            return (
              <div>
                <h2 className="font-display text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Detalles
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {groupedDetails.flatMap(category => 
                    category.details.map(detail => detail && (
                      <span 
                        key={detail.key}
                        className="px-2.5 py-1 rounded-full bg-accent/10 font-body text-xs text-accent"
                        title={category.label}
                      >
                        {detail.emoji} {detail.label}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })()}
          
          {/* Profile Prompts */}
          {profilePrompts && profilePrompts.length > 0 && (
            <ProfilePromptsDisplay prompts={profilePrompts} variant="full" />
          )}
          
          {/* Public Achievements Badges */}
          <PublicAchievementsBadges profileId={profileId} maxDisplay={6} />
        </div>

        {/* CTA buttons - Spark chat or Ghost message */}
        {!isBlocked && (
          <div className="mt-6 pt-4 animate-fade-up animate-delay-500 space-y-3">
            {sparkChatId ? (
              <>
                <Button
                  onClick={() => { triggerHaptic('success'); navigate(`/spark/${sparkChatId}`); }}
                  variant="kiki"
                  className="w-full h-12 rounded-xl font-display text-sm font-semibold"
                >
                  <Flame className="w-4 h-4 mr-2" />
                  Ir al chat
                </Button>
                <p className="text-center font-body text-[11px] text-primary/80">
                  ¡Tenéis una chispa mutua! 🔥
                </p>
              </>
            ) : (
              <>
                <Button
                  onClick={() => { triggerHaptic('selection'); navigate(`/chat/${profileId}`); }}
                  className="w-full h-12 rounded-xl font-display text-sm font-semibold"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar mensaje ghost
                </Button>
                <p className="text-center font-body text-[11px] text-muted-foreground">
                  Un mensaje valiente. Sin obligación de respuesta.
                </p>
              </>
            )}
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
