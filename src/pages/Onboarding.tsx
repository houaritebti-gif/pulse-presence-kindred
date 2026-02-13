import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Music, MapPin, Target, Calendar, Heart, Users, Camera, CheckCircle } from "lucide-react";
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
import OnboardingCitySelector from "@/components/OnboardingCitySelector";
import OnboardingVibeSelector from "@/components/OnboardingVibeSelector";
import OnboardingLookingForSelector from "@/components/OnboardingLookingForSelector";
import OnboardingGenderPreferencesSelector from "@/components/OnboardingGenderPreferencesSelector";
import OnboardingPhotoUpload from "@/components/OnboardingPhotoUpload";
import OnboardingStepHeader from "@/components/OnboardingStepHeader";
import OnboardingBirthdateSelector from "@/components/OnboardingBirthdateSelector";
import OnboardingNavigation from "@/components/OnboardingNavigation";
import OnboardingContainer from "@/components/OnboardingContainer";
import OnboardingSummary from "@/components/OnboardingSummary";
import { useOnboardingPersistence } from "@/hooks/useOnboardingPersistence";

// MVP Onboarding: 8 steps (6 mandatory + photo + summary)
const STEPS = [
  { id: 1, title: "¿Qué buscas ahora?", subtitle: "En KIKI" },
  { id: 2, title: "¿Cuándo naciste?", subtitle: "Solo mostraremos tu edad" },
  { id: 3, title: "Elige tus vibras", subtitle: "Hasta 3" },
  { id: 4, title: "¿A quién quieres ver?", subtitle: "Selección múltiple" },
  { id: 5, title: "¿Cuál es tu ciudad?", subtitle: "Donde conectas" },
  { id: 6, title: "Tu foto", subtitle: "Es obligatoria para continuar" },
  { id: 7, title: "¡Revisa tu perfil!", subtitle: "Confirma antes de empezar" },
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
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
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
      // Clamp step to new max
      setStep(Math.min(saved.step, STEPS.length));
      setName(saved.name);
      setCity(saved.city);
      setZone(saved.zone || "");
      setBirthdate(saved.birthdate);
      setSelectedGender(saved.selectedGender);
      setSelectedGenderPreferences(saved.selectedGenderPreferences);
      setSelectedInterests(saved.selectedInterests);
      // Handle migration from single vibe to multi-vibes
      if (saved.selectedVibe && typeof saved.selectedVibe === 'string') {
        setSelectedVibes([saved.selectedVibe]);
      } else if (Array.isArray((saved as any).selectedVibes)) {
        setSelectedVibes((saved as any).selectedVibes);
      }
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
      selectedVibe: selectedVibes[0] || null, // backward compat
      selectedTribes,
      selectedMusicStyles,
      optionalDetails,
      avatarUrl,
      bio,
      selectedLookingFor,
    });
  }, [
    isInitialized, step, name, city, zone, birthdate, selectedGender, selectedGenderPreferences,
    selectedInterests, selectedVibes, selectedTribes, selectedMusicStyles,
    optionalDetails, avatarUrl, bio, selectedLookingFor, saveState
  ]);

  const currentStep = STEPS.find(s => s.id === step)!;
  const progress = (step / STEPS.length) * 100;

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

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no puede superar 10MB");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCropModalOpen(true);
    e.target.value = "";
  }, []);

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
    }
    setImageToCrop(null);
    setCropModalOpen(false);

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

  const toggleGenderPreference = (gender: GenderType) => {
    setSelectedGenderPreferences(prev => 
      prev.includes(gender) 
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    );
  };

  const toggleVibe = (vibe: string) => {
    setSelectedVibes(prev => {
      if (prev.includes(vibe)) {
        return prev.filter(v => v !== vibe);
      }
      if (prev.length >= 3) {
        toast.error("Máximo 3 vibras");
        return prev;
      }
      return [...prev, vibe];
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedLookingFor.length > 0; // Qué buscas
      case 2: return isValidAge; // Birthdate 18+
      case 3: return selectedVibes.length > 0 && selectedVibes.length <= 3; // Vibes
      case 4: return selectedGenderPreferences.length > 0; // A quién ver
      case 5: return city.trim().length > 0; // Ciudad
      case 6: return !!avatarUrl; // Photo
      case 7: return true; // Summary
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
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.6 },
      colors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FF1493', '#DB7093'],
    });
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.6 },
      colors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FF1493', '#DB7093'],
    });
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
      const fullCity = zone ? `${city} - ${zone}` : city;
      const filteredOptionalDetails = Object.fromEntries(
        Object.entries(optionalDetails).filter(([_, value]) => value === true)
      );

      await updateProfile.mutateAsync({
        name: name || profile.name || "Kiki User",
        city: fullCity,
        vibe: selectedVibes[0] || null, // Store primary vibe for backward compat
        avatar_url: avatarUrl,
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

      // Update tribes if any selected
      if (selectedTribes.length > 0) {
        await updateTribes.mutateAsync({
          profileId: profile.id,
          tribes: selectedTribes,
        });
      }

      // Update music styles if any selected
      if (selectedMusicStyles.length > 0) {
        await updateMusicStyles.mutateAsync({
          profileId: profile.id,
          styles: selectedMusicStyles,
        });
      }

      // Update interests if any selected
      if (selectedInterests.length > 0) {
        await updateInterests.mutateAsync({
          profileId: profile.id,
          interests: selectedInterests,
        });
      }

      clearState();
      fireConfetti();
      playCelebrationSound();
      toast.success("¡Perfil completado!");
      
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
      case 1: return <Target className="w-6 h-6" />;
      case 2: return <Calendar className="w-6 h-6" />;
      case 3: return <Sparkles className="w-6 h-6" />;
      case 4: return <Heart className="w-6 h-6" />;
      case 5: return <MapPin className="w-6 h-6" />;
      case 6: return <Camera className="w-6 h-6" />;
      case 7: return <CheckCircle className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
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

      case 2:
        return (
          <OnboardingBirthdateSelector
            value={birthdate}
            onChange={setBirthdate}
          />
        );

      case 3:
        return (
          <OnboardingVibeSelector
            selectedVibes={selectedVibes}
            onToggleVibe={toggleVibe}
            maxVibes={3}
          />
        );

      case 4:
        return (
          <OnboardingGenderPreferencesSelector
            selectedPreferences={selectedGenderPreferences}
            onTogglePreference={toggleGenderPreference}
          />
        );

      case 5:
        return (
          <OnboardingCitySelector
            city={city}
            zone={zone}
            onCityChange={setCity}
            onZoneChange={setZone}
          />
        );

      case 6:
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

      case 7:
        return (
          <OnboardingSummary
            name={name || profile?.name || ""}
            city={city}
            zone={zone}
            birthdate={birthdate}
            selectedGender={selectedGender}
            selectedGenderPreferences={selectedGenderPreferences}
            selectedInterests={selectedInterests}
            selectedVibes={selectedVibes}
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
        isOptionalStep={false}
        onBack={handleBack}
        onNext={handleNext}
        onComplete={handleComplete}
        onSkip={handleNext}
        onExit={() => navigate("/")}
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
