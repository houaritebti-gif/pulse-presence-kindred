import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Music, User, MapPin, Target, FileText, Calendar, Heart, Users, Camera, CheckCircle } from "lucide-react";
import { useProfile, useUpdateProfile, useUpdateTribes, useUpdateMusicStyles } from "@/hooks/useProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useUpdateGenderPreferences } from "@/hooks/useGenderPreferences";
import { useUpdateInterests } from "@/hooks/useInterests";
import { toast } from "sonner";
import { GenderType } from "@/constants/profileOptions";
import confetti from "canvas-confetti";
import { AnimatePresence } from "framer-motion";
import { playCelebrationSound } from "@/utils/notificationSound";
import ImageCropModal from "@/components/ImageCropModal";
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
import OnboardingBirthdateSelector from "@/components/OnboardingBirthdateSelector";
import OnboardingInterestsSelector from "@/components/OnboardingInterestsSelector";
import OnboardingNavigation from "@/components/OnboardingNavigation";
import OnboardingContainer from "@/components/OnboardingContainer";
import OnboardingSummary from "@/components/OnboardingSummary";
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
  { id: 14, title: "¡Revisa tu perfil!", subtitle: "Confirma antes de empezar" },
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
  const [selectedGenderPreferences, setSelectedGenderPreferences] = useState<GenderType[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedTribes, setSelectedTribes] = useState<string[]>([]);
  const [selectedMusicStyles, setSelectedMusicStyles] = useState<string[]>([]);
  const [optionalDetails, setOptionalDetails] = useState<Record<string, boolean>>({});
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
      setOptionalDetails(saved.optionalDetails || {});
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
      optionalDetails,
      avatarUrl,
      bio,
      selectedLookingFor,
    });
  }, [
    isInitialized, step, name, city, zone, birthdate, selectedGender, selectedGenderPreferences,
    selectedInterests, selectedVibe, selectedTribes, selectedMusicStyles,
    optionalDetails, avatarUrl, bio, selectedLookingFor, saveState
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
      case 14: return true; // Summary - always can proceed
      default: return true;
    }
  };

  // Navigate to specific step (for summary edit)
  const goToStep = useCallback((targetStep: number) => {
    if (targetStep >= 1 && targetStep <= STEPS.length && !isAnimating) {
      setIsAnimating(true);
      setDirection(targetStep < step ? "back" : "forward");
      setTimeout(() => {
        setStep(targetStep);
        setIsAnimating(false);
      }, 50);
    }
  }, [step, isAnimating]);

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
      // Build optional_details object with only true values
      const filteredOptionalDetails = Object.fromEntries(
        Object.entries(optionalDetails).filter(([_, value]) => value === true)
      );

      await updateProfile.mutateAsync({
        name,
        city: fullCity,
        vibe: selectedVibe,
        avatar_url: avatarUrl,
        // Legacy fields for backwards compatibility
        has_tattoos: optionalDetails.has_tattoos || false,
        has_piercings: optionalDetails.has_piercings || false,
        alternative_aesthetic: optionalDetails.alternative_aesthetic || false,
        colored_hair: optionalDetails.colored_hair || false,
        shaved_head: optionalDetails.shaved_head || false,
        vintage_style: optionalDetails.vintage_style || false,
        gothic_style: optionalDetails.gothic_style || false,
        // New JSONB column with all details
        optional_details: Object.keys(filteredOptionalDetails).length > 0 ? filteredOptionalDetails : null,
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
      case 14: return <CheckCircle className="w-6 h-6" />;
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
          <OnboardingBirthdateSelector
            value={birthdate}
            onChange={setBirthdate}
          />
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
          <OnboardingInterestsSelector
            selectedInterests={selectedInterests}
            onToggleInterest={toggleInterest}
            maxInterests={10}
            minInterests={3}
          />
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
            details={optionalDetails}
            onToggleDetail={(key) => {
              setOptionalDetails(prev => ({
                ...prev,
                [key]: !prev[key]
              }));
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
            onRetry={resetState}
            onCancel={resetState}
          />
        );

      case 14:
        return (
          <OnboardingSummary
            name={name}
            city={city}
            zone={zone}
            birthdate={birthdate}
            selectedGender={selectedGender}
            selectedGenderPreferences={selectedGenderPreferences}
            selectedInterests={selectedInterests}
            selectedVibe={selectedVibe}
            selectedTribes={selectedTribes}
            selectedMusicStyles={selectedMusicStyles}
            selectedLookingFor={selectedLookingFor}
            bio={bio}
            avatarUrl={avatarUrl}
            onEditStep={goToStep}
          />
        );

      default:
        return null;
    }
  };

  // Determine if current step is optional
  const isOptionalStep = step >= 8 && step <= 12;

  return (
    <OnboardingContainer
      progress={progress}
      step={step}
      totalSteps={STEPS.length}
    >
      {/* Header with step indicator */}
      <OnboardingStepHeader
        icon={getStepIcon()}
        title={currentStep.title}
        subtitle={currentStep.subtitle}
        step={step}
        totalSteps={STEPS.length}
        direction={direction}
      />

      {/* Step content - scrollable area */}
      <div className="flex-1 max-w-md mx-auto w-full overflow-y-auto min-h-0 scrollbar-hide overscroll-contain pb-4">
        <AnimatePresence mode="wait" custom={direction}>
          {renderStepContent()}
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <OnboardingNavigation
        step={step}
        totalSteps={STEPS.length}
        canProceed={canProceed()}
        isLoading={updateProfile.isPending}
        isOptionalStep={isOptionalStep}
        onBack={handleBack}
        onNext={handleNext}
        onComplete={handleComplete}
        onSkip={handleNext}
      />

      {/* Avatar Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen && !!imageToCrop}
        onClose={handleCropClose}
        imageSrc={imageToCrop || ""}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
      />
    </OnboardingContainer>
  );
};

export default Onboarding;
