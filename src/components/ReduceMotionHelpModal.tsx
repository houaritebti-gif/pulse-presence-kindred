import { useState, useMemo } from "react";
import { ExternalLink, Copy, Check, Monitor, Smartphone, Apple, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { triggerHaptic } from "@/utils/haptics";

type DetectedOS = "windows" | "macos" | "ios" | "android" | "unknown";

const detectOS = (): DetectedOS => {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/mac/.test(ua)) return "macos";
  if (/win/.test(ua)) return "windows";
  return "unknown";
};

interface OSInstruction {
  name: string;
  icon: React.ReactNode;
  deepLink?: string;
  steps: {
    title: string;
    description: string;
    visual: React.ReactNode;
  }[];
}

const osInstructionsData: Record<DetectedOS, OSInstruction> = {
  windows: {
    name: "Windows",
    icon: <Monitor className="w-5 h-5" />,
    steps: [
      {
        title: "Abre Configuración",
        description: "Pulsa Windows + I o haz clic en el menú de inicio y selecciona ⚙️ Configuración",
        visual: (
          <div className="w-full h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)]" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">⚙️</div>
              <span className="font-medium">Configuración</span>
            </div>
          </div>
        )
      },
      {
        title: "Ve a Accesibilidad",
        description: "En el menú lateral izquierdo, busca y selecciona 'Accesibilidad'",
        visual: (
          <div className="w-full h-24 bg-gray-800 rounded-lg p-3 flex gap-3">
            <div className="w-1/3 bg-gray-700 rounded p-2 space-y-1.5">
              <div className="h-3 w-16 bg-gray-600 rounded" />
              <div className="h-3 w-20 bg-blue-500 rounded" />
              <div className="h-3 w-14 bg-gray-600 rounded" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-white/70 text-sm">♿ Accesibilidad</span>
            </div>
          </div>
        )
      },
      {
        title: "Selecciona 'Efectos visuales'",
        description: "Desplázate hasta encontrar la sección de 'Efectos visuales'",
        visual: (
          <div className="w-full h-24 bg-gray-800 rounded-lg p-3 flex flex-col justify-center gap-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-white/70 text-xs">Efectos de transparencia</span>
              <div className="w-8 h-4 bg-blue-500 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-2 bg-blue-500/20 rounded py-1">
              <span className="text-white text-xs font-medium">Efectos de animación</span>
              <div className="w-8 h-4 bg-gray-600 rounded-full" />
            </div>
          </div>
        )
      },
      {
        title: "Desactiva las animaciones",
        description: "Desactiva el interruptor de 'Efectos de animación' para reducir el movimiento",
        visual: (
          <div className="w-full h-24 bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Check className="w-6 h-6 text-green-500" />
              <span className="text-green-500 font-medium">¡Listo!</span>
            </div>
          </div>
        )
      }
    ]
  },
  macos: {
    name: "macOS",
    icon: <Apple className="w-5 h-5" />,
    steps: [
      {
        title: "Abre Preferencias del Sistema",
        description: "Haz clic en el menú  Apple y selecciona 'Preferencias del Sistema' o 'Ajustes del Sistema'",
        visual: (
          <div className="w-full h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-6 bg-gray-900 flex items-center px-2 gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className="text-2xl"></span>
              <span className="text-white/80">Ajustes del Sistema</span>
            </div>
          </div>
        )
      },
      {
        title: "Ve a Accesibilidad",
        description: "Busca el icono de Accesibilidad (figura humana en un círculo) en la barra lateral",
        visual: (
          <div className="w-full h-24 bg-gray-200 dark:bg-gray-800 rounded-lg p-2 flex gap-2">
            <div className="w-1/4 bg-gray-300 dark:bg-gray-700 rounded p-2 space-y-1">
              <div className="h-2 w-12 bg-gray-400 dark:bg-gray-600 rounded" />
              <div className="h-2 w-10 bg-blue-500 rounded" />
              <div className="h-2 w-14 bg-gray-400 dark:bg-gray-600 rounded" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-foreground/70 text-sm">♿ Accesibilidad</span>
            </div>
          </div>
        )
      },
      {
        title: "Selecciona 'Pantalla'",
        description: "En las opciones de Accesibilidad, busca la sección 'Pantalla' o 'Display'",
        visual: (
          <div className="w-full h-24 bg-gray-200 dark:bg-gray-800 rounded-lg p-3 flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-300 dark:bg-gray-700 rounded p-1 text-center text-[10px] text-foreground/60">Visión</div>
              <div className="bg-blue-500 rounded p-1 text-center text-[10px] text-white font-medium">Pantalla</div>
              <div className="bg-gray-300 dark:bg-gray-700 rounded p-1 text-center text-[10px] text-foreground/60">Audio</div>
            </div>
          </div>
        )
      },
      {
        title: "Activa 'Reducir movimiento'",
        description: "Marca la casilla 'Reducir movimiento' para minimizar las animaciones del sistema",
        visual: (
          <div className="w-full h-24 bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-green-500 font-medium">Reducir movimiento</span>
            </div>
          </div>
        )
      }
    ]
  },
  ios: {
    name: "iOS",
    icon: <Smartphone className="w-5 h-5" />,
    deepLink: "App-prefs:ACCESSIBILITY&path=MOTION_TITLE",
    steps: [
      {
        title: "Abre Ajustes",
        description: "Toca el icono de ⚙️ Ajustes en tu pantalla de inicio",
        visual: (
          <div className="w-full h-24 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center relative">
            <div className="absolute top-1 left-0 right-0 flex justify-center">
              <div className="w-20 h-4 bg-black rounded-full" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl">⚙️</span>
            </div>
          </div>
        )
      },
      {
        title: "Ve a Accesibilidad",
        description: "Desplázate hacia abajo y toca 'Accesibilidad'",
        visual: (
          <div className="w-full h-24 bg-gray-100 dark:bg-gray-900 rounded-lg p-2 space-y-1.5">
            <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 flex items-center justify-between">
              <span className="text-xs text-foreground/60">General</span>
              <span className="text-foreground/40">&gt;</span>
            </div>
            <div className="bg-blue-500/20 rounded-lg px-3 py-1.5 flex items-center justify-between border border-blue-500">
              <span className="text-xs text-blue-500 font-medium">♿ Accesibilidad</span>
              <span className="text-blue-500">&gt;</span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 flex items-center justify-between">
              <span className="text-xs text-foreground/60">Privacidad</span>
              <span className="text-foreground/40">&gt;</span>
            </div>
          </div>
        )
      },
      {
        title: "Selecciona 'Movimiento'",
        description: "Dentro de Accesibilidad, busca y toca la opción 'Movimiento'",
        visual: (
          <div className="w-full h-24 bg-gray-100 dark:bg-gray-900 rounded-lg p-2 space-y-1.5">
            <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 flex items-center justify-between">
              <span className="text-xs text-foreground/60">Pantalla y tamaño</span>
              <span className="text-foreground/40">&gt;</span>
            </div>
            <div className="bg-blue-500/20 rounded-lg px-3 py-1.5 flex items-center justify-between border border-blue-500">
              <span className="text-xs text-blue-500 font-medium">🔄 Movimiento</span>
              <span className="text-blue-500">&gt;</span>
            </div>
          </div>
        )
      },
      {
        title: "Activa 'Reducir movimiento'",
        description: "Activa el interruptor de 'Reducir movimiento'",
        visual: (
          <div className="w-full h-24 bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
              <span className="text-sm font-medium text-foreground">Reducir movimiento</span>
              <div className="w-12 h-7 bg-green-500 rounded-full flex items-center justify-end px-1">
                <div className="w-5 h-5 bg-white rounded-full shadow" />
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  android: {
    name: "Android",
    icon: <Smartphone className="w-5 h-5" />,
    deepLink: "android.settings.ACCESSIBILITY_SETTINGS",
    steps: [
      {
        title: "Abre Ajustes",
        description: "Desliza hacia abajo desde la parte superior y toca ⚙️ o abre la app de Ajustes",
        visual: (
          <div className="w-full h-24 bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-700" />
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">⚙️</span>
            </div>
          </div>
        )
      },
      {
        title: "Busca Accesibilidad",
        description: "Desplázate hacia abajo y busca 'Accesibilidad' (puede estar en 'Sistema')",
        visual: (
          <div className="w-full h-24 bg-gray-900 rounded-lg p-2 space-y-1">
            <div className="bg-gray-800 rounded px-3 py-1.5 flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gray-600" />
              <span className="text-xs text-white/60">Sistema</span>
            </div>
            <div className="bg-green-500/20 rounded px-3 py-1.5 flex items-center gap-2 border border-green-500">
              <div className="w-5 h-5 rounded bg-green-500/50 flex items-center justify-center text-[10px]">♿</div>
              <span className="text-xs text-green-400 font-medium">Accesibilidad</span>
            </div>
            <div className="bg-gray-800 rounded px-3 py-1.5 flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gray-600" />
              <span className="text-xs text-white/60">Acerca del teléfono</span>
            </div>
          </div>
        )
      },
      {
        title: "Busca opciones de animación",
        description: "Busca 'Quitar animaciones', 'Animación de ventana' o similar según tu versión",
        visual: (
          <div className="w-full h-24 bg-gray-900 rounded-lg p-3 flex flex-col justify-center gap-2">
            <div className="flex items-center justify-between px-2 bg-green-500/20 rounded py-1.5 border border-green-500">
              <span className="text-white text-xs font-medium">Quitar animaciones</span>
              <div className="w-10 h-5 bg-gray-600 rounded-full flex items-center px-0.5">
                <div className="w-4 h-4 bg-gray-400 rounded-full" />
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Activa la opción",
        description: "Activa el interruptor para reducir o eliminar las animaciones del sistema",
        visual: (
          <div className="w-full h-24 bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium text-white">Quitar animaciones</span>
              <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end px-0.5">
                <div className="w-5 h-5 bg-white rounded-full" />
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  unknown: {
    name: "Otro sistema",
    icon: <Monitor className="w-5 h-5" />,
    steps: [
      {
        title: "Abre Ajustes del sistema",
        description: "Busca la aplicación de Configuración o Ajustes de tu dispositivo",
        visual: (
          <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-2xl">⚙️</span>
          </div>
        )
      },
      {
        title: "Busca Accesibilidad",
        description: "Navega hasta la sección de Accesibilidad o Facilidad de acceso",
        visual: (
          <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-2xl">♿</span>
          </div>
        )
      },
      {
        title: "Busca opciones de movimiento",
        description: "Busca términos como 'Reducir movimiento', 'Animaciones' o 'Efectos visuales'",
        visual: (
          <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-2xl">🔄</span>
          </div>
        )
      },
      {
        title: "Activa la reducción",
        description: "Activa la opción correspondiente para reducir las animaciones",
        visual: (
          <div className="w-full h-24 bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500 rounded-lg flex items-center justify-center">
            <Check className="w-6 h-6 text-green-500" />
          </div>
        )
      }
    ]
  }
};

// Animation variants for step transitions
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.95,
  }),
};

const stepIndicatorVariants = {
  inactive: { scale: 1 },
  active: { scale: 1.15 },
};

export const ReduceMotionHelpModal = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const detectedOS = useMemo(() => detectOS(), []);
  const [selectedOS, setSelectedOS] = useState<DetectedOS>(detectedOS);
  const reduceMotion = useReducedMotion();
  
  const currentOSData = osInstructionsData[selectedOS];

  const handleCopy = async () => {
    const allSteps = currentOSData.steps
      .map((step, i) => `${i + 1}. ${step.title}: ${step.description}`)
      .join("\n");
    
    try {
      await navigator.clipboard.writeText(`${currentOSData.name}:\n${allSteps}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = `${currentOSData.name}:\n${allSteps}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenSettings = () => {
    if (!currentOSData.deepLink) return;
    
    if (selectedOS === "ios") {
      window.location.href = currentOSData.deepLink;
    } else if (selectedOS === "android") {
      const intentUrl = `intent://${currentOSData.deepLink}#Intent;scheme=android.settings;end`;
      window.location.href = intentUrl;
    }
  };

  const handleTabChange = (value: string) => {
    setSelectedOS(value as DetectedOS);
    setCurrentStep(0);
    setDirection(0);
  };

  const goNext = (os: DetectedOS) => {
    const maxStep = osInstructionsData[os].steps.length - 1;
    if (currentStep < maxStep) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
      triggerHaptic("light");
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
      triggerHaptic("light");
    }
  };

  const goToStep = (index: number) => {
    if (index !== currentStep) {
      setDirection(index > currentStep ? 1 : -1);
      setCurrentStep(index);
      triggerHaptic("selection");
    }
  };

  const availableOS: DetectedOS[] = ["windows", "macos", "ios", "android"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1 rounded-full hover:bg-muted/50 transition-colors">
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <span>Cómo activar reducir movimiento</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Sigue estos pasos para configurar tu sistema
          </p>
        </DialogHeader>

        <Tabs value={selectedOS} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-3 grid grid-cols-4 h-auto p-1">
            {availableOS.map((os) => (
              <TabsTrigger 
                key={os} 
                value={os}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                  os === detectedOS && "ring-1 ring-primary/50"
                )}
              >
                {osInstructionsData[os].icon}
                <span>{osInstructionsData[os].name}</span>
                {os === detectedOS && (
                  <span className="text-[8px] opacity-70">(detectado)</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {availableOS.map((os) => (
            <TabsContent key={os} value={os} className="flex-1 mt-0 p-4">
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-4">
                  {/* Animated progress bar */}
                  <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-primary rounded-full"
                      initial={false}
                      animate={{ 
                        width: `${((currentStep + 1) / osInstructionsData[os].steps.length) * 100}%` 
                      }}
                      transition={reduceMotion 
                        ? { duration: 0 } 
                        : { type: "spring", stiffness: 300, damping: 30 }
                      }
                    />
                  </div>

                  {/* Step indicator with animations */}
                  <div className="flex items-center justify-center gap-2">
                    {osInstructionsData[os].steps.map((_, index) => (
                      <motion.button
                        key={index}
                        onClick={() => goToStep(index)}
                        variants={reduceMotion ? undefined : stepIndicatorVariants}
                        initial={false}
                        animate={currentStep === index ? "active" : "inactive"}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={cn(
                          "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                          currentStep === index
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {index + 1}
                      </motion.button>
                    ))}
                  </div>

                  {/* Animated step content with swipe support */}
                  <div className="relative overflow-hidden min-h-[220px] touch-pan-y">
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={`${os}-${currentStep}`}
                        custom={direction}
                        variants={reduceMotion ? undefined : stepVariants}
                        initial={reduceMotion ? { opacity: 1 } : "enter"}
                        animate={reduceMotion ? { opacity: 1 } : "center"}
                        exit={reduceMotion ? { opacity: 0 } : "exit"}
                        transition={reduceMotion 
                          ? { duration: 0 } 
                          : { 
                              type: "spring", 
                              stiffness: 300, 
                              damping: 30,
                              opacity: { duration: 0.2 }
                            }
                        }
                        drag={reduceMotion ? false : "x"}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                          const swipeThreshold = 50;
                          const velocity = info.velocity.x;
                          const offset = info.offset.x;
                          
                          // Swipe left = next step
                          if (offset < -swipeThreshold || velocity < -500) {
                            if (currentStep < osInstructionsData[os].steps.length - 1) {
                              goNext(os);
                            }
                          }
                          // Swipe right = previous step
                          else if (offset > swipeThreshold || velocity > 500) {
                            if (currentStep > 0) {
                              goPrev();
                            }
                          }
                        }}
                        className="space-y-3 cursor-grab active:cursor-grabbing"
                      >
                        <motion.h3 
                          className="font-medium text-sm text-center pointer-events-none"
                          initial={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: reduceMotion ? 0 : 0.1 }}
                        >
                          Paso {currentStep + 1}: {osInstructionsData[os].steps[currentStep].title}
                        </motion.h3>
                        
                        {/* Visual representation with scale animation */}
                        <motion.div 
                          className="aspect-video flex items-center justify-center pointer-events-none select-none"
                          initial={reduceMotion ? undefined : { scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: reduceMotion ? 0 : 0.15, type: "spring", stiffness: 400 }}
                        >
                          {osInstructionsData[os].steps[currentStep].visual}
                        </motion.div>
                        
                        <motion.p 
                          className="text-xs text-muted-foreground text-center px-4 pointer-events-none"
                          initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: reduceMotion ? 0 : 0.2 }}
                        >
                          {osInstructionsData[os].steps[currentStep].description}
                        </motion.p>
                        
                        {/* Swipe hint for mobile - only on first step */}
                        {currentStep === 0 && !reduceMotion && (
                          <motion.div 
                            className="flex items-center justify-center gap-2 pt-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            <motion.div
                              animate={{ x: [-5, 5, -5] }}
                              transition={{ repeat: 2, duration: 0.6 }}
                              className="text-[10px] text-muted-foreground/60 flex items-center gap-1"
                            >
                              <ChevronLeft className="w-3 h-3" />
                              <span>Desliza para navegar</span>
                              <ChevronRight className="w-3 h-3" />
                            </motion.div>
                          </motion.div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Navigation buttons with icons */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goPrev}
                      disabled={currentStep === 0}
                      className="text-xs gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => goNext(os)}
                      disabled={currentStep === osInstructionsData[os].steps.length - 1}
                      className="text-xs gap-1"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Deep link button for mobile */}
                  {osInstructionsData[os].deepLink && (
                    <motion.div
                      initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button
                        onClick={handleOpenSettings}
                        className="w-full gap-2"
                        variant="default"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir Ajustes de Accesibilidad
                      </Button>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer actions */}
        <div className="p-4 pt-2 border-t border-border flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground max-w-[55%]">
              Al activar esta opción, KIKI respetará tu preferencia automáticamente.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  triggerHaptic("light");
                  setOpen(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Saltar tutorial
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
