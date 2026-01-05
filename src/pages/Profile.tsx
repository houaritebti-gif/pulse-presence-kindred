import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Camera, LogOut, Loader2, Volume2, VolumeX, Bell, BellOff, Smartphone, Send, Vibrate, Moon, Music, Sparkles, ChevronDown, ChevronUp, Ban, X, MessageCircle, Calendar, User, Crown, Flag } from "lucide-react";
import ErrorState from "@/components/ErrorState";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useProfileTribes, useProfileMusicStyles, useUpdateProfile, useUpdateTribes, useUpdateMusicStyles } from "@/hooks/useProfile";
import { useOrganizedQuedadasCount } from "@/hooks/useQuedadas";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { toast } from "sonner";
import { requestNotificationPermission, getNotificationPermission } from "@/utils/browserNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { sendPushNotification } from "@/utils/pushNotifications";
import { isVibrationEnabled, setVibrationEnabled, isDndEnabled, setDndEnabled, getDndHours, setDndHours } from "@/utils/notificationSound";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TRIBES, MUSIC_CATEGORIES, VIBES, OPTIONAL_DETAILS, LOOKING_FOR_OPTIONS, GenderType } from "@/constants/profileOptions";
import { Textarea } from "@/components/ui/textarea";
import { useBlockedUsersList, useUnblockUser, useMyReportHistory, REPORT_REASONS, REPORT_STATUS_LABELS } from "@/hooks/useUserModeration";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AdvancedSettingsSection from "@/components/AdvancedSettingsSection";
import OfflineQueueManager from "@/components/OfflineQueueManager";
import { ThemeToggle } from "@/components/ThemeToggle";
import ProfilePhotoManager from "@/components/ProfilePhotoManager";
import UploadProgress from "@/components/UploadProgress";
import IdentityVerificationCard from "@/components/IdentityVerificationCard";
import ImageCropModal from "@/components/ImageCropModal";
import GenderSelector from "@/components/GenderSelector";
import GenderPreferencesSelector from "@/components/GenderPreferencesSelector";
import { useProfileGenderPreferences, useUpdateGenderPreferences } from "@/hooks/useGenderPreferences";
import { useCheckBlacklistedWords } from "@/hooks/useBioBlacklist";
import { triggerHaptic } from "@/utils/haptics";

const Profile = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile();
  const { data: tribes } = useProfileTribes(profile?.id);
  const { data: musicStyles } = useProfileMusicStyles(profile?.id);
  const { data: organizedCount } = useOrganizedQuedadasCount(profile?.id);
  const { data: genderPreferences } = useProfileGenderPreferences(profile?.id);
  const updateProfile = useUpdateProfile();
  const updateTribes = useUpdateTribes();
  const updateMusicStyles = useUpdateMusicStyles();
  const updateGenderPreferences = useUpdateGenderPreferences();
  const { uploadAvatar, isUploading, uploadPhase, uploadProgress } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedTribes, setSelectedTribes] = useState<string[]>([]);
  const [selectedMusicStyles, setSelectedMusicStyles] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Optional details
  const [hasTattoos, setHasTattoos] = useState<boolean | null>(null);
  const [hasPiercings, setHasPiercings] = useState<boolean | null>(null);
  const [alternativeAesthetic, setAlternativeAesthetic] = useState<boolean | null>(null);
  
  // Bio and looking for
  const [bio, setBio] = useState("");
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);
  const [bioExpanded, setBioExpanded] = useState(false);
  
  // Gender
  const [selectedGender, setSelectedGender] = useState<GenderType | null>(null);
  const [selectedGenderPreferences, setSelectedGenderPreferences] = useState<GenderType[]>([]);
  
  // Privacy settings
  const [shareTypingStatus, setShareTypingStatus] = useState<boolean>(true);
  
  // Music section collapsed state
  const [musicExpanded, setMusicExpanded] = useState(false);
  
  const [soundMuted, setSoundMutedState] = useState(() => {
    return localStorage.getItem("kiki_sound_muted") === "true";
  });
  const [vibrationEnabled, setVibrationEnabledState] = useState(() => {
    return isVibrationEnabled();
  });
  const [dndEnabled, setDndEnabledState] = useState(() => isDndEnabled());
  const [dndStart, setDndStart] = useState(() => getDndHours().start);
  const [dndEnd, setDndEnd] = useState(() => getDndHours().end);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(() => {
    return getNotificationPermission();
  });

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  useEffect(() => {
    // Refresh permission when user returns from browser settings.
    const refresh = () => setNotificationPermission(getNotificationPermission());
    refresh();

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const { 
    isSupported: pushSupported, 
    isSubscribed: pushSubscribed, 
    isLoading: pushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush 
  } = usePushNotifications();
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleTestPush = async () => {
    if (!profile?.id) {
      toast.error("No se encontró tu perfil");
      return;
    }
    setIsSendingTest(true);
    try {
      await sendPushNotification({
        profileId: profile.id,
        title: "🎉 Push de prueba",
        body: "¡Las notificaciones push funcionan correctamente!",
        url: "/profile",
      });
      toast.success("Push enviado - revisa tus notificaciones");
    } catch (error) {
      toast.error("Error al enviar push de prueba");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSoundToggle = (muted: boolean) => {
    setSoundMutedState(muted);
    localStorage.setItem("kiki_sound_muted", muted ? "true" : "false");
  };

  const handleVibrationToggle = (enabled: boolean) => {
    setVibrationEnabledState(enabled);
    setVibrationEnabled(enabled);
    if (enabled && "vibrate" in navigator) {
      navigator.vibrate([50, 30, 50]); // Quick feedback
    }
  };

  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(getNotificationPermission());
    if (granted) {
      toast.success("Notificaciones activadas");
    } else {
      toast.error("Permisos de notificación denegados");
    }
  };

  const handlePushToggle = async () => {
    if (pushSubscribed) {
      const success = await unsubscribePush();
      if (success) {
        toast.success("Push notifications desactivadas");
      } else {
        toast.error("Error al desactivar push notifications");
      }
    } else {
      const success = await subscribePush();
      if (success) {
        toast.success("Push notifications activadas - recibirás notificaciones aunque cierres la app");
      } else {
        toast.error("Error al activar push notifications");
      }
    }
  };

  // Load existing data
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setCity(profile.city || "Madrid");
      setSelectedVibe(profile.vibe);
      setAvatarUrl(profile.avatar_url);
      setHasTattoos(profile.has_tattoos);
      setHasPiercings(profile.has_piercings);
      setAlternativeAesthetic(profile.alternative_aesthetic);
      setShareTypingStatus(profile.share_typing_status !== false);
      setBio((profile as any).bio || "");
      setSelectedLookingFor((profile as any).looking_for || []);
      setSelectedGender((profile as any).gender || null);
    }
  }, [profile]);

  // Load gender preferences
  useEffect(() => {
    if (genderPreferences) {
      setSelectedGenderPreferences(genderPreferences.map(p => p.gender_preference));
    }
  }, [genderPreferences]);

  // Avatar crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    // Validate file size (max 10MB before crop)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no puede superar 10MB");
      return;
    }

    // Open crop modal
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCropModalOpen(true);

    // Reset input so same file can be selected again
    e.target.value = "";
  }, []);

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Clean up object URL
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
    }
    setImageToCrop(null);
    setCropModalOpen(false);

    // Create file from blob
    const croppedFile = new File([croppedBlob], "avatar.jpg", {
      type: "image/jpeg",
    });

    try {
      const newUrl = await uploadAvatar(croppedFile);
      setAvatarUrl(newUrl);
      toast.success("Foto actualizada");
    } catch (error: any) {
      toast.error(error.message || "Error al subir la foto");
    }
  };

  const handleCropClose = () => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
    }
    setImageToCrop(null);
    setCropModalOpen(false);
  };

  useEffect(() => {
    if (tribes) {
      setSelectedTribes(tribes.map(t => t.tribe));
    }
  }, [tribes]);

  useEffect(() => {
    if (musicStyles) {
      setSelectedMusicStyles(musicStyles.map(m => m.style));
    }
  }, [musicStyles]);

  const toggleTribe = (tribe: string) => {
    setHasChanges(true);
    setSelectedTribes(prev => 
      prev.includes(tribe) 
        ? prev.filter(t => t !== tribe)
        : [...prev, tribe]
    );
  };

  const toggleMusicStyle = (style: string) => {
    setHasChanges(true);
    setSelectedMusicStyles(prev => {
      if (prev.includes(style)) {
        return prev.filter(s => s !== style);
      }
      // Max 5 styles
      if (prev.length >= 5) {
        toast.error("Máximo 5 estilos de música");
        return prev;
      }
      return [...prev, style];
    });
  };

  const toggleOptionalDetail = (key: string) => {
    setHasChanges(true);
    switch (key) {
      case "has_tattoos":
        setHasTattoos(prev => prev === true ? null : true);
        break;
      case "has_piercings":
        setHasPiercings(prev => prev === true ? null : true);
        break;
      case "alternative_aesthetic":
        setAlternativeAesthetic(prev => prev === true ? null : true);
        break;
    }
  };

  const getOptionalDetailValue = (key: string): boolean | null => {
    switch (key) {
      case "has_tattoos": return hasTattoos;
      case "has_piercings": return hasPiercings;
      case "alternative_aesthetic": return alternativeAesthetic;
      default: return null;
    }
  };

  // Bio blacklist validation
  const { checkText: checkBlacklistedWords } = useCheckBlacklistedWords();
  const [bioError, setBioError] = useState<string | null>(null);

  const handleBioChange = (newBio: string) => {
    setBio(newBio);
    setHasChanges(true);
    
    // Check for blacklisted words
    const blockedWords = checkBlacklistedWords(newBio);
    if (blockedWords.length > 0) {
      setBioError(`Palabras no permitidas: ${blockedWords.join(", ")}`);
    } else {
      setBioError(null);
    }
  };

  const handleContinue = async () => {
    if (!profile) return;

    // Check blacklist before saving
    const blockedWords = checkBlacklistedWords(bio);
    if (blockedWords.length > 0) {
      toast.error(`Tu bio contiene palabras no permitidas: ${blockedWords.join(", ")}`);
      return;
    }

    try {
      await updateProfile.mutateAsync({
        name: name || null,
        city: city || "Madrid",
        vibe: selectedVibe,
        has_tattoos: hasTattoos,
        has_piercings: hasPiercings,
        alternative_aesthetic: alternativeAesthetic,
        share_typing_status: shareTypingStatus,
        bio: bio || null,
        looking_for: selectedLookingFor.length > 0 ? selectedLookingFor : null,
        gender: selectedGender,
      } as any);

      await updateTribes.mutateAsync({
        profileId: profile.id,
        tribes: selectedTribes,
      });

      await updateMusicStyles.mutateAsync({
        profileId: profile.id,
        styles: selectedMusicStyles,
      });

      await updateGenderPreferences.mutateAsync({
        profileId: profile.id,
        preferences: selectedGenderPreferences,
      });

      toast.success("Perfil guardado");
      navigate("/presence");
    } catch (error: any) {
      // Check if error is from bio blacklist trigger
      if (error.message?.includes("prohibited words")) {
        toast.error("Tu bio contiene palabras no permitidas");
      } else {
        toast.error("Error al guardar: " + error.message);
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (profileLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (profileError) {
    return (
      <ErrorState
        icon={User}
        title="Error al cargar perfil"
        description="No pudimos cargar tu perfil. Revisa tu conexión e inténtalo de nuevo."
        onRetry={() => window.location.reload()}
        fullScreen
      />
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col px-4 sm:px-6 py-6 sm:py-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/presence")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          <span style={{ fontFamily: 'Arial, sans-serif' }}>Presencia</span>
        </button>
        <span className="text-xl font-bold text-foreground" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>KIKI</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Tu perfil
          </h1>
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
                  <p>Has organizado eventos para la comunidad</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <p className="text-muted-foreground text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
            Solo lo esencial. Nada más.
          </p>
        </div>

        {/* Photo - Avatar circular (se mantiene para foto principal) */}
        <div className="flex justify-center mb-6 animate-fade-up animate-delay-100">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button 
            onClick={handleAvatarClick}
            disabled={isUploading}
            className="relative w-24 h-24 rounded-full bg-card flex items-center justify-center group transition-transform hover:scale-105 overflow-hidden"
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-6 h-6 text-card-foreground/70 group-hover:text-card-foreground transition-colors" />
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
                <UploadProgress 
                  isVisible={true}
                  phase={uploadPhase}
                  progress={uploadProgress}
                  className="scale-50"
                />
              </div>
            )}
            <div className={`absolute inset-0 rounded-full border-2 transition-colors ${
              avatarUrl 
                ? "border-transparent group-hover:border-primary/50" 
                : "border-dashed border-card-foreground/30 group-hover:border-card-foreground/50"
            }`} />
            {avatarUrl && (
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 flex items-center justify-center transition-all">
                <Camera className="w-5 h-5 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mb-6 font-body">
          Esta foto se mostrará como tu avatar en chats
        </p>

        {/* Photo Gallery Manager */}
        {profile && (
          <div className="mb-10 animate-fade-up animate-delay-150">
            <ProfilePhotoManager profileId={profile.id} />
          </div>
        )}

        {/* Identity Verification */}
        <div className="mb-10 animate-fade-up animate-delay-160">
          <IdentityVerificationCard />
        </div>

        {/* Name & City */}
        <div className="space-y-4 mb-10 animate-fade-up animate-delay-200">
          <Input
            type="text"
            placeholder="Tu nombre (o como quieras que te llamen)"
            value={name}
            onChange={(e) => { setName(e.target.value); setHasChanges(true); }}
            className="h-14 text-base font-body bg-secondary/50 border-border/50 focus:border-primary"
          />
          <Input
            type="text"
            placeholder="Ciudad"
            value={city}
            onChange={(e) => { setCity(e.target.value); setHasChanges(true); }}
            className="h-14 text-base font-body bg-secondary/50 border-border/50 focus:border-primary"
          />
        </div>

        {/* Gender Selection */}
        <div className="mb-10 animate-fade-up animate-delay-220">
          <GenderSelector
            value={selectedGender}
            onChange={(val) => { setSelectedGender(val); setHasChanges(true); }}
          />
        </div>

        {/* Gender Preferences - Who to meet */}
        <div className="mb-10 animate-fade-up animate-delay-230">
          <GenderPreferencesSelector
            values={selectedGenderPreferences}
            onChange={(vals) => { setSelectedGenderPreferences(vals); setHasChanges(true); }}
          />
        </div>

        <div className="mb-10 animate-fade-up animate-delay-250">
          <h2 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Sobre ti
          </h2>
          <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: 'Arial, sans-serif' }}>
            Una breve descripción (opcional)
          </p>
          <div className="relative">
            <Textarea
              placeholder="Cuéntanos algo sobre ti..."
              value={bio}
              onChange={(e) => { 
                const newBio = e.target.value.slice(0, 300);
                handleBioChange(newBio);
              }}
              className={`min-h-[100px] resize-none font-body bg-secondary/50 border-border/50 focus:border-primary ${
                bioError ? "border-destructive focus:border-destructive" : ""
              }`}
              maxLength={300}
            />
            {bioError && (
              <p className="text-xs text-destructive mt-1 font-body">{bioError}</p>
            )}
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground font-body">
                {bio.length > 150 && !bioExpanded ? "Tu bio se mostrará con 'ver más'" : ""}
              </span>
              <span className={`text-xs font-body ${bio.length >= 280 ? "text-destructive" : "text-muted-foreground"}`}>
                {bio.length}/300
              </span>
            </div>
          </div>
        </div>

        {/* Looking for */}
        <div className="mb-10 animate-fade-up animate-delay-280">
          <h2 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            ¿Qué buscas en KIKI?
          </h2>
          <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: 'Arial, sans-serif' }}>
            Selecciona todas las que apliquen
          </p>
          <div className="flex flex-wrap gap-2">
            {LOOKING_FOR_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setHasChanges(true);
                  setSelectedLookingFor(prev => 
                    prev.includes(option.value)
                      ? prev.filter(v => v !== option.value)
                      : [...prev, option.value]
                  );
                }}
                className={`px-4 py-2 rounded-full font-body text-sm transition-all flex items-center gap-2 ${
                  selectedLookingFor.includes(option.value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                <span>{option.emoji}</span>
                <span>{option.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Vibe */}
        <div className="mb-10 animate-fade-up animate-delay-300">
          <h2 className="text-lg font-semibold text-foreground mb-4" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Tu vibra
          </h2>
          <div className="flex flex-wrap gap-2">
            {VIBES.map(vibe => (
              <button
                key={vibe.value}
                onClick={() => { triggerHaptic('selection'); setSelectedVibe(vibe.value); setHasChanges(true); }}
                className={`px-4 py-2 rounded-full font-body text-sm transition-all flex items-center gap-2 ${
                  selectedVibe === vibe.value
                    ? "bg-card text-card-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                <span>{vibe.emoji}</span>
                <span>{vibe.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tribes */}
        <div className="mb-10 animate-fade-up animate-delay-400">
          <h2 className="text-lg font-semibold text-foreground mb-4" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Tus tribus
          </h2>
          <div className="flex flex-wrap gap-2">
            {TRIBES.map(tribe => (
              <button
                key={tribe.value}
                onClick={() => { triggerHaptic('selection'); toggleTribe(tribe.value); }}
                className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                  selectedTribes.includes(tribe.value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                {tribe.emoji} {tribe.value}
              </button>
            ))}
          </div>
        </div>

        {/* Music Styles */}
        <div className="mb-10 animate-fade-up animate-delay-500">
          <button
            onClick={() => setMusicExpanded(!musicExpanded)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
                Tu música
              </h2>
              <span className="text-xs text-muted-foreground">
                ({selectedMusicStyles.length}/5)
              </span>
            </div>
            {musicExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          
          {selectedMusicStyles.length > 0 && !musicExpanded && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedMusicStyles.map(style => (
                <span
                  key={style}
                  className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-body"
                >
                  {style}
                </span>
              ))}
            </div>
          )}
          
          {musicExpanded && (
            <div className="space-y-4">
              {MUSIC_CATEGORIES.map(category => (
                <div key={category.name}>
                  <h3 className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    {category.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {category.styles.map(style => (
                      <button
                        key={style}
                        onClick={() => { triggerHaptic('selection'); toggleMusicStyle(style); }}
                        className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${
                          selectedMusicStyles.includes(style)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Optional Details */}
        <div className="mb-10 animate-fade-up animate-delay-500">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
              Detalles (opcional)
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {OPTIONAL_DETAILS.map(detail => (
              <button
                key={detail.key}
                onClick={() => { triggerHaptic('selection'); toggleOptionalDetail(detail.key); }}
                className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                  getOptionalDetailValue(detail.key) === true
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                {detail.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subscription Section */}
        <div className="mb-6 animate-fade-up animate-delay-500">
          <h2 className="text-lg font-semibold text-foreground mb-4" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Suscripción
          </h2>
          <button
            onClick={() => navigate("/subscription")}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-amber-500/10 rounded-xl border border-primary/20 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <span className="font-body text-sm font-medium text-foreground block">
                  Gestionar mi plan
                </span>
                <span className="font-body text-xs text-muted-foreground">
                  Ver beneficios y opciones de mejora
                </span>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90" />
          </button>
        </div>

        {/* Blocked Users Section */}
        <BlockedUsersSection />

        {/* My Reports History Section */}
        <MyReportsHistorySection />

        {/* Advanced Settings Section */}
        <AdvancedSettingsSection />

        {/* Offline Queue Manager */}
        <OfflineQueueManager />

        {/* Privacy Settings */}
        <div className="mb-6 animate-fade-up animate-delay-600">
          <h2 className="text-lg font-semibold text-foreground mb-4" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Privacidad del chat
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-3">
                <MessageCircle className={`w-5 h-5 ${shareTypingStatus ? "text-foreground" : "text-muted-foreground"}`} />
                <div>
                  <span className="font-body text-sm text-foreground block">
                    Mostrar "escribiendo..."
                  </span>
                  <span className="font-body text-xs text-muted-foreground">
                    Otros verán cuando escribes
                  </span>
                </div>
              </div>
              <Switch
                checked={shareTypingStatus}
                onCheckedChange={(checked) => {
                  setShareTypingStatus(checked);
                  setHasChanges(true);
                }}
              />
            </div>
          </div>
        </div>

        {/* Sound Settings */}
        <div className="mb-6 animate-fade-up animate-delay-600">
          <h2 className="text-lg font-semibold text-foreground mb-4" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Sonidos y notificaciones
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-3">
                {soundMuted ? (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-5 h-5 text-foreground" />
                )}
                <span className="font-body text-sm text-foreground">
                  {soundMuted ? "Sonidos silenciados" : "Sonidos activados"}
                </span>
              </div>
              <Switch
                checked={!soundMuted}
                onCheckedChange={(checked) => handleSoundToggle(!checked)}
              />
            </div>
            
            {"vibrate" in navigator && (
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Vibrate className={`w-5 h-5 ${vibrationEnabled ? "text-foreground" : "text-muted-foreground"}`} />
                  <span className="font-body text-sm text-foreground">
                    {vibrationEnabled ? "Vibración activada" : "Vibración desactivada"}
                  </span>
                </div>
                <Switch
                  checked={vibrationEnabled}
                  onCheckedChange={handleVibrationToggle}
                />
              </div>
            )}
            
            {/* Browser Notifications */}
            {"Notification" in window && (
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-3">
                  {notificationPermission === "granted" ? (
                    <Bell className="w-5 h-5 text-foreground" />
                  ) : (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <span className="font-body text-sm text-foreground block">
                      {notificationPermission === "granted" 
                        ? "Notificaciones activas" 
                        : notificationPermission === "denied"
                          ? "Notificaciones bloqueadas"
                          : "Notificaciones del navegador"}
                    </span>
                    {notificationPermission === "denied" && (
                      <span className="font-body text-xs text-destructive">
                        {isInIframe
                          ? "En el preview puede salir bloqueado. Ábrelo en nueva pestaña."
                          : "Si ya las permitiste, recarga o pulsa Revisar."}
                      </span>
                    )}
                  </div>
                </div>

                {notificationPermission === "default" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRequestNotificationPermission}
                  >
                    Activar
                  </Button>
                )}

                {notificationPermission === "granted" && (
                  <span className="text-xs text-primary font-body">Activas</span>
                )}

                {notificationPermission === "denied" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNotificationPermission(getNotificationPermission())}
                    >
                      Revisar
                    </Button>
                    {isInIframe && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(window.location.href, "_blank", "noopener,noreferrer")}
                      >
                        Abrir
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Push Notifications - PWA */}
            {pushSupported && (
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Smartphone className={`w-5 h-5 ${pushSubscribed ? "text-foreground" : "text-muted-foreground"}`} />
                  <div>
                    <span className="font-body text-sm text-foreground block">
                      {pushSubscribed ? "Push activado" : "Push notifications"}
                    </span>
                    <span className="font-body text-xs text-muted-foreground">
                      Recibe alertas con la app cerrada
                    </span>
                  </div>
                </div>
                <Switch
                  checked={pushSubscribed}
                  onCheckedChange={handlePushToggle}
                  disabled={pushLoading}
                />
              </div>
            )}
            
            {/* Test Push Button */}
            {pushSubscribed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestPush}
                disabled={isSendingTest}
                className="w-full flex items-center gap-2"
              >
                {isSendingTest ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Probar push notification
              </Button>
            )}
            
            {/* Do Not Disturb */}
            <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className={`w-5 h-5 ${dndEnabled ? "text-foreground" : "text-muted-foreground"}`} />
                  <div>
                    <span className="font-body text-sm text-foreground block">
                      No molestar
                    </span>
                    <span className="font-body text-xs text-muted-foreground">
                      Silencia notificaciones en horario
                    </span>
                  </div>
                </div>
                <Switch
                  checked={dndEnabled}
                  onCheckedChange={(enabled) => {
                    setDndEnabledState(enabled);
                    setDndEnabled(enabled);
                  }}
                />
              </div>
              
              {dndEnabled && (
                <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                  <Select
                    value={dndStart.toString()}
                    onValueChange={(val) => {
                      const start = parseInt(val, 10);
                      setDndStart(start);
                      setDndHours(start, dndEnd);
                    }}
                  >
                    <SelectTrigger className="w-24 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-xs">a</span>
                  <Select
                    value={dndEnd.toString()}
                    onValueChange={(val) => {
                      const end = parseInt(val, 10);
                      setDndEnd(end);
                      setDndHours(dndStart, end);
                    }}
                  >
                    <SelectTrigger className="w-24 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Continue */}
        <div className="mt-6 animate-fade-up animate-delay-700">
          <Button 
            variant="kiki" 
            size="lg" 
            className="w-full"
            onClick={handleContinue}
            disabled={updateProfile.isPending || updateTribes.isPending || updateMusicStyles.isPending}
          >
            {updateProfile.isPending || updateMusicStyles.isPending ? "Guardando..." : "Guardar y continuar"}
          </Button>
        </div>
      </div>

      {/* Avatar Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen && !!imageToCrop}
        onClose={handleCropClose}
        imageSrc={imageToCrop || ""}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
      />
    </main>
  );
};

// Blocked Users Section Component
const BlockedUsersSection = () => {
  const { data: blockedUsers, isLoading } = useBlockedUsersList();
  const unblockUser = useUnblockUser();
  const [expanded, setExpanded] = useState(false);

  if (isLoading) return null;
  
  const hasBlocked = blockedUsers && blockedUsers.length > 0;

  return (
    <div className="mb-10 animate-fade-up animate-delay-550">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <Ban className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Usuarios bloqueados
          </h2>
          {hasBlocked && (
            <span className="text-xs text-muted-foreground">
              ({blockedUsers.length})
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-2">
          {!hasBlocked ? (
            <p className="text-sm text-muted-foreground font-body p-4 bg-secondary/50 rounded-xl">
              No has bloqueado a nadie.
            </p>
          ) : (
            blockedUsers.map((block) => {
              const profile = block.blocked_profile as { id: string; name: string | null; avatar_url: string | null; vibe: string | null } | null;
              if (!profile) return null;
              
              return (
                <div 
                  key={block.id} 
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {profile.name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-body text-sm text-foreground">
                        {profile.name || "Sin nombre"}
                      </p>
                      {profile.vibe && (
                        <p className="font-body text-xs text-muted-foreground">
                          {profile.vibe}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unblockUser.mutate(profile.id)}
                    disabled={unblockUser.isPending}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
};

// My Reports History Section Component
const MyReportsHistorySection = () => {
  const location = useLocation();
  const { data: reports, isLoading } = useMyReportHistory();
  const [expanded, setExpanded] = useState(false);
  
  // Auto-expand if navigated from report modal
  useEffect(() => {
    if (location.state?.openReportsHistory) {
      setExpanded(true);
      // Clear the state so refresh doesn't reopen
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  if (isLoading) return null;
  
  const hasReports = reports && reports.length > 0;

  const getReasonLabel = (reason: string) => {
    const found = REPORT_REASONS.find(r => r.value === reason);
    return found?.label || reason;
  };

  const getStatusInfo = (status: string) => {
    return REPORT_STATUS_LABELS[status] || REPORT_STATUS_LABELS.pending;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="mb-10 animate-fade-up animate-delay-550">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Mis reportes
          </h2>
          {hasReports && (
            <span className="text-xs text-muted-foreground">
              ({reports.length})
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-2">
          {!hasReports ? (
            <p className="text-sm text-muted-foreground font-body p-4 bg-secondary/50 rounded-xl">
              No has enviado ningún reporte.
            </p>
          ) : (
            reports.map((report) => {
              const profile = report.reported_profile as { id: string; name: string | null; avatar_url: string | null } | null;
              const statusInfo = getStatusInfo(report.status);
              
              return (
                <div 
                  key={report.id} 
                  className="p-4 bg-secondary/50 rounded-xl space-y-3"
                >
                  {/* Header with profile and status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                          {profile?.name?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-body text-sm text-foreground">
                          {profile?.name || "Usuario eliminado"}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">
                          {formatDate(report.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Status badge */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/50 ${statusInfo.color}`}>
                      <span className="text-xs">{statusInfo.icon}</span>
                      <span className="font-body text-xs font-medium">
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Reason */}
                  <div className="flex items-start gap-2">
                    <span className="font-body text-xs text-muted-foreground">Motivo:</span>
                    <span className="font-body text-xs text-foreground">
                      {getReasonLabel(report.reason)}
                    </span>
                  </div>
                  
                  {/* Details if any */}
                  {report.details && (
                    <div className="bg-background/30 rounded-lg p-2.5">
                      <p className="font-body text-xs text-foreground/80 line-clamp-2">
                        "{report.details}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;