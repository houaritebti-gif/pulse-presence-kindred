import { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, ArrowRight, ArrowLeft, Check, Sparkles, Music, User, MapPin, Target, FileText, Calendar, Heart, Users } from "lucide-react";
import InterestsSelector from "@/components/InterestsSelector";
import { useProfile, useUpdateProfile, useUpdateTribes, useUpdateMusicStyles } from "@/hooks/useProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { useUpdateGenderPreferences } from "@/hooks/useGenderPreferences";
import { useUpdateInterests } from "@/hooks/useInterests";
import { toast } from "sonner";
import { TRIBES, MUSIC_CATEGORIES, VIBES, OPTIONAL_DETAILS, LOOKING_FOR_OPTIONS, GENDERS_MAIN, GENDERS_EXTENDED, GenderType, CULTURAL_INTERESTS } from "@/constants/profileOptions";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { playCelebrationSound } from "@/utils/notificationSound";
import UploadProgress from "@/components/UploadProgress";
import ImageCropModal from "@/components/ImageCropModal";
import { triggerHaptic } from "@/utils/haptics";
import BirthdateSelector from "@/components/BirthdateSelector";
import OnboardingProgressIndicator from "@/components/OnboardingProgressIndicator";

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

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("Madrid");
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
      // Update profile with gender
      await updateProfile.mutateAsync({
        name,
        city,
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

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            key="step-1" 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className="relative" variants={itemVariants}>
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-foreground/60 pointer-events-none transition-all duration-200 peer-focus:text-primary peer-focus:scale-110" />
              <Input
                type="text"
                placeholder="Tu nombre o alias"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="peer h-14 text-lg pl-12 text-center rounded-2xl bg-card border-card-foreground/20 text-card-foreground placeholder:text-card-foreground/60"
                autoFocus
              />
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div 
            key="step-2" 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className="relative" variants={itemVariants}>
              <Input
                type="text"
                placeholder="Tu ciudad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="peer h-14 text-lg pl-12 text-center rounded-2xl bg-card border-card-foreground/20 text-card-foreground placeholder:text-card-foreground/60"
                autoFocus
              />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-foreground/60 pointer-events-none transition-all duration-200 peer-focus:text-primary peer-focus:scale-110" />
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div 
            key="step-3" 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="flex items-center gap-2 text-muted-foreground mb-2"
              variants={itemVariants}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>Solo mostraremos tu edad, no la fecha</span>
            </motion.div>
            <motion.div variants={itemVariants}>
              <BirthdateSelector
                value={birthdate}
                onChange={setBirthdate}
              />
            </motion.div>
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
          <motion.div 
            key="step-4-gender" 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="flex items-center gap-2 text-muted-foreground mb-2"
              variants={itemVariants}
            >
              <User className="w-4 h-4" />
              <span className="text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>Elige cómo te identificas</span>
            </motion.div>
            
            {/* Main genders */}
            <div className="space-y-2">
              {GENDERS_MAIN.map((gender) => (
                <motion.button
                  key={gender.value}
                  onClick={() => { 
                    triggerHaptic('selection'); 
                    setSelectedGender(gender.value);
                    setShowExtendedGenders(false);
                  }}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 rounded-2xl text-base transition-colors flex items-center justify-between ${
                    selectedGender === gender.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground hover:bg-card/80"
                  }`}
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  <span>{gender.label}</span>
                  {selectedGender === gender.value && <Check className="w-5 h-5" />}
                </motion.button>
              ))}
              
              {/* "Otra identidad" button */}
              <motion.button
                onClick={() => { 
                  triggerHaptic('selection'); 
                  setShowExtendedGenders(!showExtendedGenders);
                }}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-4 rounded-2xl text-base transition-colors flex items-center justify-between ${
                  showExtendedGenders || GENDERS_EXTENDED.some(g => g.value === selectedGender)
                    ? "bg-accent text-accent-foreground"
                    : "bg-card text-card-foreground hover:bg-card/80"
                }`}
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                <span>Otra identidad...</span>
                <motion.span
                  animate={{ rotate: showExtendedGenders ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ▼
                </motion.span>
              </motion.button>
            </div>

            {/* Extended genders (collapsible) */}
            <AnimatePresence>
              {showExtendedGenders && (
                <motion.div 
                  className="space-y-2 pl-4 border-l-2 border-primary/30"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {GENDERS_EXTENDED.map((gender) => (
                    <motion.button
                      key={gender.value}
                      onClick={() => { 
                        triggerHaptic('selection'); 
                        setSelectedGender(gender.value);
                      }}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-3 rounded-xl text-sm transition-colors flex items-center justify-between ${
                        selectedGender === gender.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-card/50 text-card-foreground hover:bg-card/80"
                      }`}
                      style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                      <span>{gender.label}</span>
                      {selectedGender === gender.value && <Check className="w-4 h-4" />}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );

      case 5:
        return (
          <motion.div 
            key="step-5-preferences" 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="flex items-center gap-2 text-muted-foreground mb-2"
              variants={itemVariants}
            >
              <Heart className="w-4 h-4" />
              <span className="text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>Puedes elegir varias opciones</span>
            </motion.div>
            
            {/* Main preferences */}
            <div className="space-y-2">
              {[
                { value: "woman" as GenderType, label: "Mujeres", emoji: "👩" },
                { value: "man" as GenderType, label: "Hombres", emoji: "👨" },
                { value: "non_binary" as GenderType, label: "Personas no binarias", emoji: "🌈" },
              ].map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => { 
                    triggerHaptic('selection'); 
                    toggleGenderPreference(option.value);
                  }}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 rounded-2xl text-base transition-colors flex items-center justify-between ${
                    selectedGenderPreferences.includes(option.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground hover:bg-card/80"
                  }`}
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{option.emoji}</span>
                    <span>{option.label}</span>
                  </span>
                  {selectedGenderPreferences.includes(option.value) && <Check className="w-5 h-5" />}
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {selectedGenderPreferences.length > 0 && (
                <motion.p 
                  className="text-center text-sm text-muted-foreground pt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {selectedGenderPreferences.length} seleccionada{selectedGenderPreferences.length > 1 ? "s" : ""}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        );

      case 6:
        return (
          <motion.div 
            key="step-6-interests" 
            className="space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <InterestsSelector
              selectedInterests={selectedInterests}
              onToggleInterest={toggleInterest}
              maxInterests={10}
              minInterests={3}
              showCounter={true}
              variant="onboarding"
            />
          </motion.div>
        );

      case 7:
        return (
          <motion.div 
            key="step-7-vibe" 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="grid grid-cols-2 gap-3">
              {VIBES.map((vibe) => (
                <motion.button
                  key={vibe.value}
                  onClick={() => { triggerHaptic('selection'); setSelectedVibe(vibe.value); }}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 ${
                    selectedVibe === vibe.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground hover:bg-card/80"
                  }`}
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  <span className="text-xl">{vibe.emoji}</span>
                  <span>{vibe.value}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 8:
        return (
          <motion.div 
            key="step-8-tribes" 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex flex-wrap gap-2 justify-center">
              {TRIBES.map((tribe) => (
                <motion.button
                  key={tribe.value}
                  onClick={() => { triggerHaptic('selection'); toggleTribe(tribe.value); }}
                  variants={itemVariants}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    selectedTribes.includes(tribe.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground hover:bg-card/80"
                  }`}
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  {tribe.emoji} {tribe.value}
                </motion.button>
              ))}
            </div>
            <AnimatePresence>
              {selectedTribes.length > 0 && (
                <motion.p 
                  className="text-center text-sm text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {selectedTribes.length} seleccionadas
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        );

      case 9:
        return (
          <motion.div 
            key="step-9-music" 
            className="space-y-6 max-h-[50vh] overflow-y-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {MUSIC_CATEGORIES.map((category) => (
              <motion.div 
                key={category.name}
                variants={itemVariants}
              >
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
                  <Music className="w-3 h-3" />
                  {category.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {category.styles.map((style) => (
                    <motion.button
                      key={style}
                      onClick={() => { triggerHaptic('selection'); toggleMusicStyle(style); }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                        selectedMusicStyles.includes(style)
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-card-foreground hover:bg-card/80"
                      }`}
                      style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                      {style}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}
            <AnimatePresence>
              {selectedMusicStyles.length > 0 && (
                <motion.p 
                  className="text-center text-sm text-primary sticky bottom-0 bg-background py-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {selectedMusicStyles.length}/5 estilos
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        );

      case 10:
        return (
          <motion.div 
            key="step-10-looking" 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="flex items-center gap-2 text-muted-foreground mb-4"
              variants={itemVariants}
            >
              <Target className="w-4 h-4" />
              <span className="text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>Selecciona todas las que apliquen</span>
            </motion.div>
            <div className="flex flex-wrap gap-2 justify-center">
              {LOOKING_FOR_OPTIONS.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => {
                    setSelectedLookingFor(prev => 
                      prev.includes(option.value)
                        ? prev.filter(v => v !== option.value)
                        : [...prev, option.value]
                    );
                  }}
                  variants={itemVariants}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-3 rounded-2xl text-sm transition-colors flex items-center gap-2 ${
                    selectedLookingFor.includes(option.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground hover:bg-card/80"
                  }`}
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  <span className="text-lg">{option.emoji}</span>
                  <span>{option.value}</span>
                </motion.button>
              ))}
            </div>
            <AnimatePresence>
              {selectedLookingFor.length > 0 && (
                <motion.p 
                  className="text-center text-sm text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {selectedLookingFor.length} seleccionadas
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        );

      case 11:
        return (
          <motion.div 
            key="step-11-bio" 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="flex items-center gap-2 text-muted-foreground mb-2"
              variants={itemVariants}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>Máximo 300 caracteres</span>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Textarea
                placeholder="Cuéntanos algo sobre ti..."
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 300))}
                className="min-h-[120px] resize-none text-base bg-card border-card-foreground/20 text-card-foreground placeholder:text-card-foreground/60 rounded-2xl"
                style={{ fontFamily: 'Arial, sans-serif' }}
                maxLength={300}
              />
              <div className="flex justify-end mt-2">
                <span className={`text-xs ${bio.length >= 280 ? "text-destructive" : "text-muted-foreground"}`} style={{ fontFamily: 'Arial, sans-serif' }}>
                  {bio.length}/300
                </span>
              </div>
            </motion.div>
          </motion.div>
        );

      case 12:
        return (
          <motion.div 
            key="step-12-details" 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="flex items-center gap-2 text-muted-foreground mb-4"
              variants={itemVariants}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>Comparte lo que quieras</span>
            </motion.div>
            {OPTIONAL_DETAILS.map((detail) => {
              const getIsSelected = () => {
                switch (detail.key) {
                  case "has_tattoos": return hasTattoos;
                  case "has_piercings": return hasPiercings;
                  case "alternative_aesthetic": return alternativeAesthetic;
                  case "colored_hair": return coloredHair;
                  case "shaved_head": return shavedHead;
                  case "vintage_style": return vintageStyle;
                  case "gothic_style": return gothicStyle;
                  default: return false;
                }
              };
              
              const toggle = () => {
                triggerHaptic('selection');
                switch (detail.key) {
                  case "has_tattoos": setHasTattoos(!hasTattoos); break;
                  case "has_piercings": setHasPiercings(!hasPiercings); break;
                  case "alternative_aesthetic": setAlternativeAesthetic(!alternativeAesthetic); break;
                  case "colored_hair": setColoredHair(!coloredHair); break;
                  case "shaved_head": setShavedHead(!shavedHead); break;
                  case "vintage_style": setVintageStyle(!vintageStyle); break;
                  case "gothic_style": setGothicStyle(!gothicStyle); break;
                }
              };

              const isSelected = getIsSelected();

              return (
                <motion.button
                  key={detail.key}
                  onClick={toggle}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 rounded-2xl text-base transition-colors flex items-center justify-between ${
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "bg-card text-card-foreground hover:bg-card/80"
                  }`}
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  <span>{detail.emoji} {detail.label}</span>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>
        );

      case 13:
        return (
          <motion.div 
            key="step-13-photo" 
            className="space-y-6 flex flex-col items-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-32 h-32 rounded-full bg-card flex items-center justify-center overflow-hidden ring-4 ring-primary/20 hover:ring-primary/40 transition-all"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : isUploading || uploadPhase === "error" ? (
                <div className="absolute inset-0 bg-background/90 flex items-center justify-center rounded-full">
                  <UploadProgress 
                    isVisible={true}
                    phase={uploadPhase}
                    progress={uploadProgress}
                    errorMessage={errorMessage}
                    onRetry={() => {
                      resetState();
                      fileInputRef.current?.click();
                    }}
                    className="scale-75"
                  />
                </div>
              ) : (
                <Camera className="w-10 h-10 text-muted-foreground" />
              )}
            </motion.button>
            <motion.p 
              className="text-center text-sm text-muted-foreground"
              variants={itemVariants}
            >
              {avatarUrl ? "¡Perfecta! Puedes continuar" : "Toca para subir una foto"}
            </motion.p>
            {!avatarUrl && (
              <motion.p 
                className="text-center text-xs text-primary/80 font-medium"
                variants={itemVariants}
              >
                La foto es obligatoria para crear tu perfil
              </motion.p>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <main 
      className="min-h-[100dvh] max-h-[100dvh] bg-background flex flex-col px-4 sm:px-6 pt-4 sm:pt-6 overflow-hidden relative"
      style={{ 
        // Ensure safe area padding on iOS devices
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

      {/* Header with step indicator */}
      <div className="text-center mb-10">
        <motion.span 
          className="text-xl font-bold text-primary mb-4 block"
          style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          KIKI
        </motion.span>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div 
            key={`header-${step}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
              {currentStep.title}
            </h1>
            <p className="text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
              {currentStep.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="flex justify-center gap-1.5 mt-6">
          {STEPS.map((s) => (
            <motion.div 
              key={s.id}
              className="h-1.5 rounded-full bg-card"
              animate={{
                width: s.id === step ? 24 : 6,
                backgroundColor: s.id <= step ? "hsl(var(--primary))" : "hsl(var(--card))",
                opacity: s.id < step ? 0.5 : 1,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 max-w-md mx-auto w-full overflow-y-auto min-h-0">
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
