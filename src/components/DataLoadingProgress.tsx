import { memo, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { 
  User, Users, Heart, MessageCircle, Bell, Calendar, 
  Shield, Music, Sparkles, CheckCircle2, Loader2 
} from "lucide-react";

export interface LoadingStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: "pending" | "loading" | "complete" | "error";
}

interface DataLoadingProgressProps {
  /** Array of loading steps with their status */
  steps: LoadingStep[];
  /** Whether all loading is complete */
  isComplete?: boolean;
  /** Variant style */
  variant?: "default" | "compact" | "minimal";
  /** Custom completion message */
  completionMessage?: string;
  /** Show percentage */
  showPercentage?: boolean;
}

// Preset configurations for common loading scenarios
export const presenceLoadingSteps = (states: {
  profile?: boolean;
  presence?: boolean;
  sparks?: boolean;
  notifications?: boolean;
}): LoadingStep[] => [
  { id: "profile", label: "Tu perfil", icon: User, status: states.profile ? "complete" : "loading" },
  { id: "presence", label: "Perfiles activos", icon: Users, status: states.presence ? "complete" : states.profile ? "loading" : "pending" },
  { id: "sparks", label: "Tus sparks", icon: Heart, status: states.sparks ? "complete" : states.presence ? "loading" : "pending" },
  { id: "notifications", label: "Notificaciones", icon: Bell, status: states.notifications ? "complete" : "pending" },
];

export const profileLoadingSteps = (states: {
  basic?: boolean;
  photos?: boolean;
  tribes?: boolean;
  music?: boolean;
  achievements?: boolean;
}): LoadingStep[] => [
  { id: "basic", label: "Datos básicos", icon: User, status: states.basic ? "complete" : "loading" },
  { id: "photos", label: "Fotos", icon: Sparkles, status: states.photos ? "complete" : states.basic ? "loading" : "pending" },
  { id: "tribes", label: "Tribus", icon: Users, status: states.tribes ? "complete" : states.photos ? "loading" : "pending" },
  { id: "music", label: "Estilos musicales", icon: Music, status: states.music ? "complete" : "pending" },
  { id: "achievements", label: "Logros", icon: Shield, status: states.achievements ? "complete" : "pending" },
];

export const sparksLoadingSteps = (states: {
  chats?: boolean;
  messages?: boolean;
  unread?: boolean;
}): LoadingStep[] => [
  { id: "chats", label: "Conversaciones", icon: MessageCircle, status: states.chats ? "complete" : "loading" },
  { id: "messages", label: "Mensajes recientes", icon: Heart, status: states.messages ? "complete" : states.chats ? "loading" : "pending" },
  { id: "unread", label: "Sin leer", icon: Bell, status: states.unread ? "complete" : "pending" },
];

export const quedadasLoadingSteps = (states: {
  events?: boolean;
  attendees?: boolean;
  messages?: boolean;
}): LoadingStep[] => [
  { id: "events", label: "Quedadas", icon: Calendar, status: states.events ? "complete" : "loading" },
  { id: "attendees", label: "Asistentes", icon: Users, status: states.attendees ? "complete" : states.events ? "loading" : "pending" },
  { id: "messages", label: "Mensajes", icon: MessageCircle, status: states.messages ? "complete" : "pending" },
];

/**
 * Multi-step data loading progress indicator
 * Shows detailed feedback about what's being loaded
 */
export const DataLoadingProgress = memo(({
  steps,
  isComplete = false,
  variant = "default",
  completionMessage = "¡Todo listo!",
  showPercentage = true
}: DataLoadingProgressProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [showComplete, setShowComplete] = useState(false);

  // Calculate progress percentage
  const progress = useMemo(() => {
    const completed = steps.filter(s => s.status === "complete").length;
    return Math.round((completed / steps.length) * 100);
  }, [steps]);

  // Current loading step
  const currentStep = useMemo(() => 
    steps.find(s => s.status === "loading") || steps[0],
    [steps]
  );

  // Show completion animation
  useEffect(() => {
    if (isComplete || progress === 100) {
      const timer = setTimeout(() => setShowComplete(true), 200);
      return () => clearTimeout(timer);
    }
    setShowComplete(false);
  }, [isComplete, progress]);

  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="relative">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {currentStep?.label || "Cargando..."}
          </p>
          {showPercentage && (
            <p className="text-xs text-muted-foreground">{progress}%</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="w-full max-w-sm mx-auto px-4">
        {/* Progress bar */}
        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        
        {/* Current step indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentStep && (
              <>
                <currentStep.icon className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {currentStep.label}
                </span>
              </>
            )}
          </div>
          {showPercentage && (
            <span className="text-xs font-medium text-primary">{progress}%</span>
          )}
        </div>
      </div>
    );
  }

  // Default variant - full detailed view
  return (
    <AnimatePresence mode="wait">
      {!showComplete ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.3 }}
          className={cn(
            "w-full max-w-sm mx-auto rounded-2xl p-5",
            "bg-gradient-to-br from-card via-card to-primary/5",
            "border border-primary/10 shadow-lg shadow-primary/5"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Preparando tu experiencia
            </h3>
            {showPercentage && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {progress}%
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          {/* Steps list */}
          <div className="space-y-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.status === "loading";
              const isComplete = step.status === "complete";
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: prefersReducedMotion ? 0 : index * 0.1,
                    duration: 0.2 
                  }}
                  className={cn(
                    "flex items-center gap-3 py-1.5 px-2 rounded-lg transition-colors",
                    isActive && "bg-primary/5",
                    isComplete && "opacity-60"
                  )}
                >
                  {/* Status icon */}
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                    isComplete && "bg-primary/20 text-primary",
                    isActive && "bg-primary/10",
                    step.status === "pending" && "bg-muted/50"
                  )}>
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isActive ? (
                      <motion.div
                        animate={prefersReducedMotion ? {} : { rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-4 h-4 text-primary" />
                      </motion.div>
                    ) : (
                      <Icon className="w-3.5 h-3.5 text-muted-foreground/50" />
                    )}
                  </div>

                  {/* Label */}
                  <span className={cn(
                    "text-sm transition-colors",
                    isActive && "text-foreground font-medium",
                    isComplete && "text-muted-foreground",
                    step.status === "pending" && "text-muted-foreground/50"
                  )}>
                    {step.label}
                  </span>

                  {/* Active indicator */}
                  {isActive && !prefersReducedMotion && (
                    <motion.div
                      className="ml-auto flex gap-0.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 h-1 rounded-full bg-primary"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="complete"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.3 }}
          className="flex flex-col items-center gap-3 py-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 10,
              delay: 0.1
            }}
            className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
          >
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </motion.div>
          <p className="text-sm font-medium text-foreground">{completionMessage}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

DataLoadingProgress.displayName = "DataLoadingProgress";

export default DataLoadingProgress;
