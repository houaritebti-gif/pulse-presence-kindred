import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, ArrowRight, ArrowLeft, Check, Sparkles, Music, User, MapPin, Target, FileText } from "lucide-react";
import { useProfile, useUpdateProfile, useUpdateTribes, useUpdateMusicStyles } from "@/hooks/useProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { toast } from "sonner";
import { TRIBES, MUSIC_CATEGORIES, VIBES, OPTIONAL_DETAILS, LOOKING_FOR_OPTIONS } from "@/constants/profileOptions";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { playCelebrationSound } from "@/utils/notificationSound";
import UploadProgress from "@/components/UploadProgress";
import ImageCropModal from "@/components/ImageCropModal";
import { triggerHaptic } from "@/utils/haptics";

const STEPS = [
  { id: 1, title: "¿Cómo te llamas?", subtitle: "Tu nombre o alias" },
  { id: 2, title: "¿Cuál es tu ciudad?", subtitle: "Donde conectas" },
  { id: 3, title: "Elige tu vibra", subtitle: "¿Cómo te sientes hoy?" },
  { id: 4, title: "Tus tribus", subtitle: "¿Con quién conectas?" },
  { id: 5, title: "Tu música", subtitle: "Hasta 5 estilos" },
  { id: 6, title: "¿Qué buscas?", subtitle: "En KIKI" },
  { id: 7, title: "Sobre ti", subtitle: "Breve descripción (opcional)" },
  { id: 8, title: "Detalles opcionales", subtitle: "Lo que quieras compartir" },
  { id: 9, title: "Tu foto", subtitle: "Opcional pero recomendado" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const updateTribes = useUpdateTribes();
  const updateMusicStyles = useUpdateMusicStyles();
  const { uploadAvatar, isUploading, uploadPhase, uploadProgress } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("Madrid");
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedTribes, setSelectedTribes] = useState<string[]>([]);
  const [selectedMusicStyles, setSelectedMusicStyles] = useState<string[]>([]);
  const [hasTattoos, setHasTattoos] = useState(false);
  const [hasPiercings, setHasPiercings] = useState(false);
  const [alternativeAesthetic, setAlternativeAesthetic] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);

  const currentStep = STEPS.find(s => s.id === step)!;
  const progress = (step / STEPS.length) * 100;

  // Animation variants for framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.15 }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring" as const,
        stiffness: 300,
        damping: 24,
      }
    },
  };

  const slideVariants = {
    enter: (dir: "forward" | "back") => ({
      x: dir === "forward" ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
      },
    },
    exit: (dir: "forward" | "back") => ({
      x: dir === "forward" ? -100 : 100,
      opacity: 0,
      transition: { duration: 0.2 },
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

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length > 0;
      case 2: return city.trim().length > 0;
      case 3: return selectedVibe !== null;
      case 4: return true; // Tribes are optional
      case 5: return true; // Music is optional
      case 6: return true; // Looking for is optional
      case 7: return true; // Bio is optional
      case 8: return true; // Details are optional
      case 9: return true; // Photo is optional
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
      // Update profile
      await updateProfile.mutateAsync({
        name,
        city,
        vibe: selectedVibe,
        avatar_url: avatarUrl,
        has_tattoos: hasTattoos,
        has_piercings: hasPiercings,
        alternative_aesthetic: alternativeAesthetic,
        bio: bio || null,
        looking_for: selectedLookingFor.length > 0 ? selectedLookingFor : null,
      } as any);

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
                  className={`p-4 rounded-2xl font-body text-base transition-colors flex items-center justify-center gap-2 ${
                    selectedVibe === vibe.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground hover:bg-card/80"
                  }`}
                >
                  <span className="text-xl">{vibe.emoji}</span>
                  <span>{vibe.value}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div 
            key="step-4" 
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
                  className={`px-4 py-2 rounded-full font-body text-sm transition-colors ${
                    selectedTribes.includes(tribe.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground hover:bg-card/80"
                  }`}
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

      case 5:
        return (
          <motion.div 
            key="step-5" 
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
                <h3 className="font-display text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <Music className="w-3 h-3" />
                  {category.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {category.styles.map((style) => (
                    <motion.button
                      key={style}
                      onClick={() => toggleMusicStyle(style)}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1.5 rounded-full font-body text-xs transition-colors ${
                        selectedMusicStyles.includes(style)
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-card-foreground hover:bg-card/80"
                      }`}
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

      case 6:
        return (
          <motion.div 
            key="step-6" 
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
              <span className="font-body text-sm">Selecciona todas las que apliquen</span>
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
                  className={`px-4 py-3 rounded-2xl font-body text-sm transition-colors flex items-center gap-2 ${
                    selectedLookingFor.includes(option.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground hover:bg-card/80"
                  }`}
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

      case 7:
        return (
          <motion.div 
            key="step-7" 
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
              <span className="font-body text-sm">Máximo 300 caracteres</span>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Textarea
                placeholder="Cuéntanos algo sobre ti..."
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 300))}
                className="min-h-[120px] resize-none font-body text-base bg-card border-card-foreground/20 text-card-foreground placeholder:text-card-foreground/60 rounded-2xl"
                maxLength={300}
              />
              <div className="flex justify-end mt-2">
                <span className={`text-xs font-body ${bio.length >= 280 ? "text-destructive" : "text-muted-foreground"}`}>
                  {bio.length}/300
                </span>
              </div>
            </motion.div>
          </motion.div>
        );

      case 8:
        return (
          <motion.div 
            key="step-8" 
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
              <span className="font-body text-sm">Comparte lo que quieras</span>
            </motion.div>
            {OPTIONAL_DETAILS.map((detail) => {
              const isSelected = 
                detail.key === "has_tattoos" ? hasTattoos :
                detail.key === "has_piercings" ? hasPiercings :
                alternativeAesthetic;
              
              const toggle = () => {
                if (detail.key === "has_tattoos") setHasTattoos(!hasTattoos);
                else if (detail.key === "has_piercings") setHasPiercings(!hasPiercings);
                else setAlternativeAesthetic(!alternativeAesthetic);
              };

              return (
                <motion.button
                  key={detail.key}
                  onClick={toggle}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 rounded-2xl font-body text-base transition-colors flex items-center justify-between ${
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "bg-card text-card-foreground hover:bg-card/80"
                  }`}
                >
                  <span>{detail.label}</span>
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

      case 9:
        return (
          <motion.div 
            key="step-9" 
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
              ) : isUploading ? (
                <div className="absolute inset-0 bg-background/90 flex items-center justify-center rounded-full">
                  <UploadProgress 
                    isVisible={true}
                    phase={uploadPhase}
                    progress={uploadProgress}
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
              Toca para subir una foto
            </motion.p>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col px-6 py-8 overflow-hidden">
      {/* Progress bar */}
      <motion.div 
        className="w-full h-1 bg-card rounded-full mb-8 overflow-hidden"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </motion.div>

      {/* Header with step indicator */}
      <div className="text-center mb-12">
        <motion.span 
          className="font-display text-xl font-bold text-primary mb-4 block"
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
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              {currentStep.title}
            </h1>
            <p className="font-body text-muted-foreground">
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
      <div className="flex-1 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait" custom={direction}>
          {renderStepContent()}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-8 max-w-md mx-auto w-full">
        {step > 1 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 h-14 rounded-2xl font-display"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Atrás
          </Button>
        )}
        {step < STEPS.length ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 h-14 rounded-2xl font-display"
          >
            Siguiente
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={updateProfile.isPending}
            className="flex-1 h-14 rounded-2xl font-display"
          >
            {updateProfile.isPending ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Empezar
                <Check className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Skip option for optional steps */}
      {step >= 4 && step < STEPS.length && (
        <button
          onClick={handleNext}
          className="mt-4 text-center font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
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
