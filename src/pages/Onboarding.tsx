import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, ArrowRight, ArrowLeft, Check, Sparkles, Music } from "lucide-react";
import { useProfile, useUpdateProfile, useUpdateTribes, useUpdateMusicStyles } from "@/hooks/useProfile";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { toast } from "sonner";
import { TRIBES, MUSIC_CATEGORIES, VIBES, OPTIONAL_DETAILS } from "@/constants/profileOptions";

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

  // Animation helper for step transitions
  const animationClass = direction === "forward" 
    ? "animate-slide-in-right" 
    : "animate-slide-in-left";

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

      toast.success("¡Perfil completado!");
      navigate("/presence");
    } catch (error) {
      toast.error("Error al guardar el perfil");
    }
  };

  const renderStepContent = () => {
    const baseClass = `${animationClass}`;
    
    switch (step) {
      case 1:
        return (
          <div key="step-1" className={`space-y-6 ${baseClass}`}>
            <Input
              type="text"
              placeholder="Tu nombre o alias"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 text-lg text-center rounded-2xl bg-card border-card-foreground/20 text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        );

      case 2:
        return (
          <div key="step-2" className={`space-y-6 ${baseClass}`}>
            <Input
              type="text"
              placeholder="Tu ciudad"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-14 text-lg text-center rounded-2xl bg-card border-card-foreground/20 text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        );

      case 3:
        return (
          <div key="step-3" className={`space-y-4 ${baseClass}`}>
            <div className="grid grid-cols-2 gap-3">
              {VIBES.map((vibe, index) => (
                <button
                  key={vibe}
                  onClick={() => setSelectedVibe(vibe)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`p-4 rounded-2xl font-body text-base transition-all animate-bounce-in ${
                    selectedVibe === vibe
                      ? "bg-primary text-primary-foreground scale-105"
                      : "bg-card text-card-foreground hover:bg-card/80"
                  }`}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div key="step-4" className={`space-y-4 ${baseClass}`}>
            <div className="flex flex-wrap gap-2 justify-center">
              {TRIBES.map((tribe, index) => (
                <button
                  key={tribe}
                  onClick={() => toggleTribe(tribe)}
                  style={{ animationDelay: `${index * 30}ms` }}
                  className={`px-4 py-2 rounded-full font-body text-sm transition-all animate-bounce-in ${
                    selectedTribes.includes(tribe)
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground hover:bg-card/80"
                  }`}
                >
                  {tribe}
                </button>
              ))}
            </div>
            {selectedTribes.length > 0 && (
              <p className="text-center text-sm text-muted-foreground animate-fade-up">
                {selectedTribes.length} seleccionadas
              </p>
            )}
          </div>
        );

      case 5:
        return (
          <div key="step-5" className={`space-y-6 max-h-[50vh] overflow-y-auto ${baseClass}`}>
            {MUSIC_CATEGORIES.map((category, catIndex) => (
              <div 
                key={category.name}
                style={{ animationDelay: `${catIndex * 50}ms` }}
                className="animate-fade-up"
              >
                <h3 className="font-display text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <Music className="w-3 h-3" />
                  {category.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {category.styles.map((style) => (
                    <button
                      key={style}
                      onClick={() => toggleMusicStyle(style)}
                      className={`px-3 py-1.5 rounded-full font-body text-xs transition-all ${
                        selectedMusicStyles.includes(style)
                          ? "bg-primary text-primary-foreground scale-105"
                          : "bg-card text-card-foreground hover:bg-card/80"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {selectedMusicStyles.length > 0 && (
              <p className="text-center text-sm text-primary sticky bottom-0 bg-background py-2 animate-fade-up">
                {selectedMusicStyles.length}/5 estilos
              </p>
            )}
          </div>
        );

      case 6:
        return (
          <div key="step-6" className={`space-y-4 ${baseClass}`}>
            <div className="flex items-center gap-2 text-muted-foreground mb-4 animate-fade-up">
              <Sparkles className="w-4 h-4" />
              <span className="font-body text-sm">Comparte lo que quieras</span>
            </div>
            {OPTIONAL_DETAILS.map((detail, index) => {
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
                <button
                  key={detail.key}
                  onClick={toggle}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className={`w-full p-4 rounded-2xl font-body text-base transition-all flex items-center justify-between animate-bounce-in ${
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "bg-card text-card-foreground hover:bg-card/80"
                  }`}
                >
                  <span>{detail.label}</span>
                  {isSelected && <Check className="w-5 h-5" />}
                </button>
              );
            })}
          </div>
        );

      case 7:
        return (
          <div key="step-7" className={`space-y-6 flex flex-col items-center ${baseClass}`}>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-32 h-32 rounded-full bg-card flex items-center justify-center overflow-hidden ring-4 ring-primary/20 hover:ring-primary/40 transition-all animate-bounce-in"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : isUploading ? (
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-10 h-10 text-muted-foreground" />
              )}
            </button>
            <p className="text-center text-sm text-muted-foreground animate-fade-up animate-delay-200">
              Toca para subir una foto
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col px-6 py-8 overflow-hidden">
      {/* Progress bar */}
      <div className="w-full h-1 bg-card rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header with step indicator */}
      <div className="text-center mb-12">
        <span className="font-display text-xl font-bold text-primary mb-4 block">KIKI</span>
        <div 
          key={`header-${step}`}
          className={animationClass}
        >
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            {currentStep.title}
          </h1>
          <p className="font-body text-muted-foreground">
            {currentStep.subtitle}
          </p>
        </div>
        <div className="flex justify-center gap-1.5 mt-6">
          {STEPS.map((s) => (
            <div 
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s.id === step 
                  ? "w-6 bg-primary" 
                  : s.id < step 
                    ? "w-1.5 bg-primary/50" 
                    : "w-1.5 bg-card"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 max-w-md mx-auto w-full">
        {renderStepContent()}
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
