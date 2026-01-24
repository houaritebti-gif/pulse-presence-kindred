import { useMemo } from "react";
import { LoadingStep } from "@/components/DataLoadingProgress";
import { User, Users, Heart, Bell, Calendar, MessageCircle, Music, Shield, Sparkles } from "lucide-react";

interface LoadingStates {
  [key: string]: boolean;
}

/**
 * Hook to generate loading steps for DataLoadingProgress component
 * Automatically determines step status based on loading states
 */
export function useMultiStepLoading(
  type: "presence" | "profile" | "sparks" | "quedadas" | "custom",
  loadingStates: LoadingStates,
  customSteps?: Omit<LoadingStep, "status">[]
): {
  steps: LoadingStep[];
  progress: number;
  isComplete: boolean;
  currentStep: LoadingStep | undefined;
} {
  const steps = useMemo(() => {
    let baseSteps: Omit<LoadingStep, "status">[];

    switch (type) {
      case "presence":
        baseSteps = [
          { id: "profile", label: "Tu perfil", icon: User },
          { id: "presence", label: "Perfiles activos", icon: Users },
          { id: "sparks", label: "Tus sparks", icon: Heart },
          { id: "notifications", label: "Notificaciones", icon: Bell },
        ];
        break;
      case "profile":
        baseSteps = [
          { id: "basic", label: "Datos básicos", icon: User },
          { id: "photos", label: "Fotos", icon: Sparkles },
          { id: "tribes", label: "Tribus", icon: Users },
          { id: "music", label: "Estilos musicales", icon: Music },
          { id: "achievements", label: "Logros", icon: Shield },
        ];
        break;
      case "sparks":
        baseSteps = [
          { id: "chats", label: "Conversaciones", icon: MessageCircle },
          { id: "messages", label: "Mensajes recientes", icon: Heart },
          { id: "unread", label: "Sin leer", icon: Bell },
        ];
        break;
      case "quedadas":
        baseSteps = [
          { id: "events", label: "Quedadas", icon: Calendar },
          { id: "attendees", label: "Asistentes", icon: Users },
          { id: "messages", label: "Mensajes", icon: MessageCircle },
        ];
        break;
      case "custom":
        baseSteps = customSteps || [];
        break;
      default:
        baseSteps = [];
    }

    // Calculate status for each step based on sequential loading
    let foundLoading = false;
    return baseSteps.map((step): LoadingStep => {
      const isComplete = loadingStates[step.id] === true;
      
      if (isComplete) {
        return { ...step, status: "complete" };
      }
      
      if (!foundLoading) {
        foundLoading = true;
        return { ...step, status: "loading" };
      }
      
      return { ...step, status: "pending" };
    });
  }, [type, loadingStates, customSteps]);

  const progress = useMemo(() => {
    const completed = steps.filter(s => s.status === "complete").length;
    return Math.round((completed / steps.length) * 100);
  }, [steps]);

  const isComplete = useMemo(() => 
    steps.every(s => s.status === "complete"),
    [steps]
  );

  const currentStep = useMemo(() => 
    steps.find(s => s.status === "loading"),
    [steps]
  );

  return { steps, progress, isComplete, currentStep };
}

export default useMultiStepLoading;
