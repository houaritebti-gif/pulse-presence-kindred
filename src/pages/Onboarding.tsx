import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Check, Sparkles, Music, User, MapPin, Target, FileText, Calendar, Heart, Users, Camera } from "lucide-react";
import InterestsSelector from "@/components/InterestsSelector";
import { useProfile, useUpdateProfile, useUpdateTribes, useUpdateMusicStyles } from "@/hooks/useProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useUpdateGenderPreferences } from "@/hooks/useGenderPreferences";
import { useUpdateInterests } from "@/hooks/useInterests";
import { toast } from "sonner";
import { GenderType } from "@/constants/profileOptions";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { playCelebrationSound } from "@/utils/notificationSound";
import ImageCropModal from "@/components/ImageCropModal";
import BirthdateSelector from "@/components/BirthdateSelector";
import OnboardingProgressIndicator from "@/components/OnboardingProgressIndicator";
import OnboardingGenderSelector from "@/components/OnboardingGenderSelector";
import OnboardingCitySelector from "@/components/OnboardingCitySelector";
import OnboardingNameInput from "@/components/OnboardingNameInput";
import OnboardingVibeSelector from "@/components/OnboardingVibeSelector";
import OnboardingTribesSelector from "@/components/OnboardingTribesSelector";
import OnboardingMusicSelector from "@/components/OnboardingMusicSelector";
import OnboardingLookingForSelector from "@/components/OnboardingLookingForSelector";
import OnboardingDetailsSelector from "@/components/OnboardingDetailsSelector";
import OnboardingBioInput from "@/components/OnboardingBioInput";
import OnboardingGenderPreferencesSelector from "@/components/OnboardingGenderPreferencesSelector";
import OnboardingPhotoUpload from "@/components/OnboardingPhotoUpload";
import OnboardingStepHeader from "@/components/OnboardingStepHeader";
import { useOnboardingPersistence } from "@/hooks/useOnboardingPersistence";

const STEPS = [
  { id: 1, title: "¿Cómo te llamas?", subtitle: "Tu nombre o alias" },
  { id: 2, title: "¿Cuál es tu ciudad?", subtitle: "Donde conectas" },
  { id: 3, title: "¿Cuándo naciste?", subtitle: "Solo mostraremos tu edad" },
  { id: 4, title: "¿Cómo te identificas?", subtitle: "Tu género" },
  { id: 5, title: "¿Con quién conectas?", subtitle: "Selección múltiple" },
  { id: 6, title: "Tus intereses", subtitle: "Elige de 3 a 10" },
  { id: 7, title: "Elige tu vibra", subtitle: "¿Cómo te sientes hoy?" },
  { id: 8, title: "Tus tribus", subtitle: "¿Con quién vibras?" },
  { id: 9, title: "Tu música", subtitle: "Hasta 5 estilos" },
  { id: 10, title: "¿Qué buscas?", subtitle: "En KIKI" },
  { id: 11, title: "Sobre ti", subtitle: "Breve descripción (opcional)" },
  { id: 12, title: "Detalles opcionales", subtitle: "Lo que quieras compartir" },
  { id: 13, title: "Tu foto", subtitle: "Es obligatoria para continuar" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const updateTribes = useUpdateTribes();
  const updateMusicStyles = useUpdateMusicStyles();
  const updateGenderPreferences = useUpdateGenderPreferences();
  const updateInterests = useUpdateInterests();
  const { uploadAvatar, isUploading, uploadPhase, uploadProgress, errorMessage, resetState } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Persistence hook
  const { saveState, clearState, getInitialState } = useOnboardingPersistence();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from localStorage
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("Madrid");
  const [zone, setZone] = useState("");
  const [birthdate, setBirthdate] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<GenderType | null>(null);
  const [showExtendedGenders, setShowExtendedGenders] = useState(false);
  const [selectedGenderPreferences, setSelectedGenderPreferences] = useState<GenderType[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedTribes, setSelectedTribes] = useState<string[]>([]);
  const [selectedMusicStyles, setSelectedMusicStyles] = useState<string[]>([]);
  const [hasTattoos, setHasTattoos] = useState(false);
  const [hasPiercings, setHasPiercings] = useState(false);
  const [alternativeAesthetic, setAlternativeAesthetic] = useState(false);
  const [coloredHair, setColoredHair] = useState(false);
  const [shavedHead, setShavedHead] = useState(false);
  const [vintageStyle, setVintageStyle] = useState(false);
  const [gothicStyle, setGothicStyle] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);

  // Load saved state on mount
  useEffect(() => {
    const saved = getInitialState();
    if (saved.step > 1 || saved.name || saved.avatarUrl) {
      setStep(saved.step);
      setName(saved.name);
      setCity(saved.city);
      setZone(saved.zone || "");
      setBirthdate(saved.birthdate);
      setSelectedGender(saved.selectedGender);
      setSelectedGenderPreferences(saved.selectedGenderPreferences);
      setSelectedInterests(saved.selectedInterests);
      setSelectedVibe(saved.selectedVibe);
      setSelectedTribes(saved.selectedTribes);
      setSelectedMusicStyles(saved.selectedMusicStyles);
      setHasTattoos(saved.hasTattoos);
      setHasPiercings(saved.hasPiercings);
      setAlternativeAesthetic(saved.alternativeAesthetic);
      setColoredHair(saved.coloredHair);
      setShavedHead(saved.shavedHead);
      setVintageStyle(saved.vintageStyle);
      setGothicStyle(saved.gothicStyle);
      setAvatarUrl(saved.avatarUrl);
      setBio(saved.bio);
      setSelectedLookingFor(saved.selectedLookingFor);
      
      if (saved.step > 1) {
        toast.success("Progreso restaurado", { duration: 2000 });
      }
    }
    setIsInitialized(true);
  }, [getInitialState]);

  // Save state whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    saveState({
      step,
      name,
      city,
      zone,
      birthdate,
      selectedGender,
      selectedGenderPreferences,
      selectedInterests,
      selectedVibe,
      selectedTribes,
      selectedMusicStyles,
      hasTattoos,
      hasPiercings,
      alternativeAesthetic,
      coloredHair,
      shavedHead,
      vintageStyle,
      gothicStyle,
      avatarUrl,
      bio,
      selectedLookingFor,
    });
  }, [
    isInitialized, step, name, city, zone, birthdate, selectedGender, selectedGenderPreferences,
    selectedInterests, selectedVibe, selectedTribes, selectedMusicStyles,
    hasTattoos, hasPiercings, alternativeAesthetic, coloredHair, shavedHead,
    vintageStyle, gothicStyle, avatarUrl, bio, selectedLookingFor, saveState
  ]);

  const currentStep = STEPS.find(s => s.id === step)!;
  const progress = (step / STEPS.length) * 100;

  // Calculate completed fields for progress indicator
  const getCompletedFields = useMemo(() => {
    const fields: string[] = [];
    if (name.trim()) fields.push("Nombre");
    if (city.trim()) fields.push("Ciudad");
    if (birthdate && !birthdate.includes("0000")) fields.push("Edad");
    if (selectedGender) fields.push("Género");
    if (selectedGenderPreferences.length > 0) fields.push("Preferencias");
    if (selectedInterests.length >= 3) fields.push("Intereses");
    if (selectedVibe) fields.push("Vibra");
    if (selectedTribes.length > 0) fields.push("Tribus");
    if (selectedMusicStyles.length > 0) fields.push("Música");
    if (selectedLookingFor.length > 0) fields.push("Busco");
    if (bio.trim()) fields.push("Bio");
    if (avatarUrl) fields.push("Foto");
    return fields;
  }, [name, city, birthdate, selectedGender, selectedGenderPreferences, selectedInterests, selectedVibe, selectedTribes, selectedMusicStyles, selectedLookingFor, bio, avatarUrl]);

  // Calculate age from birthdate
  const calculateAge = useCallback((birthdateStr: string): number => {
    const today = new Date();
    const birth = new Date(birthdateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, []);

  const userAge = useMemo(() => {
    if (!birthdate || birthdate.includes("0000") || birthdate.includes("00-00")) return null;
    return calculateAge(birthdate);
  }, [birthdate, calculateAge]);

  const isValidAge = userAge !== null && userAge >= 18;

  // Animation variants for framer-motion - optimized for mobile performance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Faster stagger for mobile
        delayChildren: 0.05,
      },
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.1 }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 }, // Reduced motion distance
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "tween" as const,
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1] as const, // CSS ease-out as cubic bezier
      }
    },
  };

  const slideVariants = {
    enter: (dir: "forward" | "back") => ({
      x: dir === "forward" ? 50 : -50, // Reduced slide distance for faster feel
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        type: "tween" as const,
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
    exit: (dir: "forward" | "back") => ({
      x: dir === "forward" ? -50 : 50,
      opacity: 0,
      transition: { duration: 0.15 },
    }),
  };

  // Avatar crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Reset input for future selections
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
      const url = await uploadAvatar(croppedFile);
      if (url) {
        setAvatarUrl(url);
      }
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

  const toggleTribe = (tribe: string) => {
    setSelectedTribes(prev => 
      prev.includes(tribe) 
        ? prev.filter(t => t !== tribe)
        : [...prev, tribe]
    );
  };

  const toggleMusicStyle = (style: string) => {
    setSelectedMusicStyles(prev => {
      if (prev.includes(style)) {
        return prev.filter(s => s !== style);
      }
      if (prev.length >= 5) {
        toast.error("Máximo 5 estilos de música");
        return prev;
      }
      return [...prev, style];
    });
  };

  const toggleGenderPreference = (gender: GenderType) => {
    setSelectedGenderPreferences(prev => 
      prev.includes(gender) 
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      }
      if (prev.length >= 10) {
        toast.error("Máximo 10 intereses");
        return prev;
      }
      return [...prev, interest];
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length > 0;
      case 2: return city.trim().length > 0;
      case 3: return isValidAge; // Must be 18+
      case 4: return selectedGender !== null;
      case 5: return selectedGenderPreferences.length > 0;
      case 6: return selectedInterests.length >= 3 && selectedInterests.length <= 10;
      case 7: return selectedVibe !== null;
      case 8: return true; // Tribes are optional
      case 9: return true; // Music is optional
      case 10: return true; // Looking for is optional
      case 11: return true; // Bio is optional
      case 12: return true; // Details are optional
      case 13: return !!avatarUrl; // Photo is required
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length && !isAnimating) {
      setIsAnimating(true);
      setDirection("forward");
      setTimeout(() => {
        setStep(step + 1);
        setIsAnimating(false);
      }, 50);
    }
  };

  const handleBack = () => {
    if (step > 1 && !isAnimating) {
      setIsAnimating(true);
      setDirection("back");
      setTimeout(() => {
        setStep(step - 1);
        setIsAnimating(false);
      }, 50);
    }
  };

  const fireConfetti = () => {
    // First burst from the left
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.6 },
      colors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FF1493', '#DB7093'],
    });
    
    // Second burst from the right
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.6 },
      colors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FF1493', '#DB7093'],
    });
    
    // Center burst with more particles
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FF1493', '#DB7093', '#000000'],
      });
    }, 200);
  };

  const handleComplete = async () => {
    if (!profile?.id) return;

    try {
      // Combine city and zone for display
      const fullCity = zone ? `${city} - ${zone}` : city;
      
      // Update profile with gender
      await updateProfile.mutateAsync({
        name,
        city: fullCity,
        vibe: selectedVibe,
        avatar_url: avatarUrl,
        has_tattoos: hasTattoos,
        has_piercings: hasPiercings,
        alternative_aesthetic: alternativeAesthetic,
        colored_hair: coloredHair,
        shaved_head: shavedHead,
        vintage_style: vintageStyle,
        gothic_style: gothicStyle,
        bio: bio || null,
        looking_for: selectedLookingFor.length > 0 ? selectedLookingFor : null,
        birthdate: birthdate && !birthdate.includes("0000") ? birthdate : null,
        gender: selectedGender,
      } as any);

      // Update gender preferences
      if (selectedGenderPreferences.length > 0) {
        await updateGenderPreferences.mutateAsync({
          profileId: profile.id,
          preferences: selectedGenderPreferences,
        });
      }

      // Update tribes
      if (selectedTribes.length > 0) {
        await updateTribes.mutateAsync({
          profileId: profile.id,
          tribes: selectedTribes,
        });
      }

      // Update music styles
      if (selectedMusicStyles.length > 0) {
        await updateMusicStyles.mutateAsync({
          profileId: profile.id,
          styles: selectedMusicStyles,
        });
      }

      // Update interests
      if (selectedInterests.length > 0) {
        await updateInterests.mutateAsync({
          profileId: profile.id,
          interests: selectedInterests,
        });
      }

      // Clear saved onboarding state on successful completion
      clearState();

      // Fire confetti and sound celebration!
      fireConfetti();
      playCelebrationSound();

      toast.success("¡Perfil completado!");
      
      // Small delay to enjoy the confetti before navigating
      setTimeout(() => {
        navigate("/presence");
      }, 1000);
    } catch (error) {
      toast.error("Error al guardar el perfil");
    }
  };

  // Step icon map
  const getStepIcon = () => {
    switch (step) {
      case 1: return <User className="w-6 h-6" />;
      case 2: return <MapPin className="w-6 h-6" />;
      case 3: return <Calendar className="w-6 h-6" />;
      case 4: return <User className="w-6 h-6" />;
      case 5: return <Heart className="w-6 h-6" />;
      case 6: return <Sparkles className="w-6 h-6" />;
      case 7: return <Sparkles className="w-6 h-6" />;
      case 8: return <Users className="w-6 h-6" />;
      case 9: return <Music className="w-6 h-6" />;
      case 10: return <Target className="w-6 h-6" />;
      case 11: return <FileText className="w-6 h-6" />;
      case 12: return <Sparkles className="w-6 h-6" />;
      case 13: return <Camera className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <OnboardingNameInput
            name={name}
            onNameChange={setName}
          />
        );

      case 2:
        return (
          <OnboardingCitySelector
            city={city}
            zone={zone}
            onCityChange={setCity}
            onZoneChange={setZone}
          />
        );

      case 3:
        return (
          <motion.div 
            key="step-3" 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="flex items-center gap-2 text-muted-foreground mb-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Solo mostraremos tu edad, no la fecha</span>
            </motion.div>
            <BirthdateSelector
              value={birthdate}
              onChange={setBirthdate}
            />
            <AnimatePresence>
              {userAge !== null && userAge >= 18 && (
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                    <Check className="w-4 h-4" />
                    {userAge} años
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );

      case 4:
        return (
          <OnboardingGenderSelector
            value={selectedGender}
            onChange={setSelectedGender}
          />
        );

      case 5:
        return (
          <OnboardingGenderPreferencesSelector
            selectedPreferences={selectedGenderPreferences}
            onTogglePreference={toggleGenderPreference}
          />
        );

      case 6:
        return (
          <motion.div 
            key="step-6-interests" 
            className="space-y-2 h-full flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="flex items-center gap-2 text-muted-foreground mb-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Elige entre 3 y 10 intereses</span>
            </motion.div>
            <div className="flex-1 min-h-0">
              <InterestsSelector
                selectedInterests={selectedInterests}
                onToggleInterest={toggleInterest}
                maxInterests={10}
                minInterests={3}
                showCounter={true}
                variant="onboarding"
              />
            </div>
          </motion.div>
        );

      case 7:
        return (
          <OnboardingVibeSelector
            selectedVibe={selectedVibe}
            onVibeChange={setSelectedVibe}
          />
        );

      case 8:
        return (
          <OnboardingTribesSelector
            selectedTribes={selectedTribes}
            onToggleTribe={toggleTribe}
          />
        );

      case 9:
        return (
          <OnboardingMusicSelector
            selectedStyles={selectedMusicStyles}
            onToggleStyle={toggleMusicStyle}
            maxStyles={5}
          />
        );

      case 10:
        return (
          <OnboardingLookingForSelector
            selectedOptions={selectedLookingFor}
            onToggleOption={(option) => {
              setSelectedLookingFor(prev => 
                prev.includes(option)
                  ? prev.filter(v => v !== option)
                  : [...prev, option]
              );
            }}
          />
        );

      case 11:
        return (
          <OnboardingBioInput
            bio={bio}
            onBioChange={setBio}
            maxLength={300}
          />
        );

      case 12:
        return (
          <OnboardingDetailsSelector
            details={{
              has_tattoos: hasTattoos,
              has_piercings: hasPiercings,
              alternative_aesthetic: alternativeAesthetic,
              colored_hair: coloredHair,
              shaved_head: shavedHead,
              vintage_style: vintageStyle,
              gothic_style: gothicStyle,
            }}
            onToggleDetail={(key) => {
              switch (key) {
                case "has_tattoos": setHasTattoos(!hasTattoos); break;
                case "has_piercings": setHasPiercings(!hasPiercings); break;
                case "alternative_aesthetic": setAlternativeAesthetic(!alternativeAesthetic); break;
                case "colored_hair": setColoredHair(!coloredHair); break;
                case "shaved_head": setShavedHead(!shavedHead); break;
                case "vintage_style": setVintageStyle(!vintageStyle); break;
                case "gothic_style": setGothicStyle(!gothicStyle); break;
              }
            }}
          />
        );

      case 13:
        return (
          <OnboardingPhotoUpload
            avatarUrl={avatarUrl}
            isUploading={isUploading}
            uploadPhase={uploadPhase}
            uploadProgress={uploadProgress}
            errorMessage={errorMessage}
            onFileSelect={handleAvatarChange}
            onRetry={() => {
              resetState();
              fileInputRef.current?.click();
            }}
            onCancel={() => {
              resetState();
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <main 
      className="min-h-[100dvh] max-h-[100dvh] bg-background flex flex-col px-4 sm:px-6 pt-safe sm:pt-6 overflow-hidden relative"
      style={{ 
        // Ensure safe area padding on iOS devices
        paddingTop: 'max(env(safe-area-inset-top, 16px), 16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}
    >
      {/* Ambient glow - reduced for performance */}
      <div 
        className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[250px] bg-primary/3 blur-[100px] rounded-full pointer-events-none" 
        aria-hidden="true"
      />
      
      {/* Progress bar - simplified animation for mobile performance */}
      <div 
        className="w-full h-1.5 bg-muted/50 rounded-full mb-6 overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Paso ${step} de ${STEPS.length}`}
      >
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Enhanced progress indicator */}
      <OnboardingProgressIndicator
        currentStep={step}
        totalSteps={STEPS.length}
        completedFields={getCompletedFields}
        currentStepName={currentStep.title}
      />

      {/* Header with step indicator - using new component */}
      <OnboardingStepHeader
        icon={getStepIcon()}
        title={currentStep.title}
        subtitle={currentStep.subtitle}
        step={step}
        totalSteps={STEPS.length}
        direction={direction}
      />

      {/* Step content - improved scrolling for mobile */}
      <div className="flex-1 max-w-md mx-auto w-full overflow-y-auto min-h-0 scrollbar-hide overscroll-contain">
        <AnimatePresence mode="wait" custom={direction}>
          {renderStepContent()}
        </AnimatePresence>
      </div>

      {/* Navigation - sticky at bottom with better mobile UX */}
      <div 
        className="flex gap-3 pt-4 pb-4 max-w-md mx-auto w-full flex-shrink-0 bg-background/95 backdrop-blur-sm"
        style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
        }}
      >
        {step > 1 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 h-14 rounded-2xl text-base font-bold active:scale-[0.98] transition-transform touch-manipulation"
            aria-label="Volver al paso anterior"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Atrás
          </Button>
        )}
        {step < STEPS.length ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 h-14 rounded-2xl text-base font-bold active:scale-[0.98] transition-transform touch-manipulation disabled:opacity-50"
            aria-label={canProceed() ? "Continuar al siguiente paso" : "Completa este paso para continuar"}
          >
            Siguiente
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={updateProfile.isPending || !canProceed()}
            className="flex-1 h-14 rounded-2xl text-base font-bold active:scale-[0.98] transition-transform touch-manipulation disabled:opacity-50"
            aria-label="Completar perfil y empezar"
          >
            {updateProfile.isPending ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" aria-label="Guardando..." />
            ) : (
              <>
                Empezar
                <Check className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Skip option for optional steps - improved mobile UX */}
      {step >= 7 && step < STEPS.length && step !== 13 && (
        <button
          onClick={handleNext}
          className="mt-2 mb-4 text-center text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-2 px-4 touch-manipulation"
          aria-label="Saltar este paso opcional"
        >
          Saltar este paso
        </button>
      )}

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

export default Onboarding;
