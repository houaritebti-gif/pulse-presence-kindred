import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, ArrowRight, ArrowLeft, Check, Sparkles, Music, User, MapPin } from "lucide-react";
import { useProfile, useUpdateProfile, useUpdateTribes, useUpdateMusicStyles } from "@/hooks/useProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { toast } from "sonner";
import { TRIBES, MUSIC_CATEGORIES, VIBES, OPTIONAL_DETAILS } from "@/constants/profileOptions";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { playCelebrationSound } from "@/utils/notificationSound";

const STEPS = [
  { id: 1, title: "¿Cómo te llamas?", subtitle: "Tu nombre o alias" },
  { id: 2, title: "¿Cuál es tu ciudad?", subtitle: "Donde conectas" },
  { id: 3, title: "Elige tu vibra", subtitle: "¿Cómo te sientes hoy?" },
  { id: 4, title: "Tus tribus", subtitle: "¿Con quién conectas?" },
  { id: 5, title: "Tu música", subtitle: "Hasta 5 estilos" },
  { id: 6, title: "Detalles opcionales", subtitle: "Lo que quieras compartir" },
  { id: 7, title: "Tu foto", subtitle: "Opcional pero recomendado" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const updateTribes = useUpdateTribes();
  const updateMusicStyles = useUpdateMusicStyles();
  const { uploadAvatar, isUploading } = useAvatarUpload();
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadAvatar(file);
    if (url) {
      setAvatarUrl(url);
    }
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
      case 6: return true; // Details are optional
      case 7: return true; // Photo is optional
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
      });

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
                  onClick={() => setSelectedVibe(vibe.value)}
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
                  onClick={() => toggleTribe(tribe.value)}
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

      case 7:
        return (
          <motion.div 
            key="step-7" 
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
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
    </main>
  );
};

export default Onboarding;
