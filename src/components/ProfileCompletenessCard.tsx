// Profile completeness indicator card
import { Progress } from "@/components/ui/progress";
import { ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfileCompletenessCardProps {
  percentage: number;
  missingFields: string[];
  completedFields: string[];
  onEditClick?: () => void;
  compact?: boolean;
}

export const ProfileCompletenessCard = ({
  percentage,
  missingFields,
  completedFields,
  onEditClick,
  compact = false,
}: ProfileCompletenessCardProps) => {
  const isComplete = percentage >= 100;
  const isAlmostComplete = percentage >= 80;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onEditClick}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                isComplete
                  ? "bg-green-500/20 text-green-600 dark:text-green-400"
                  : isAlmostComplete
                  ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                  : "bg-primary/20 text-primary"
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <span className="font-bold">{percentage}%</span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            {isComplete ? (
              <p className="text-xs">¡Perfil completo!</p>
            ) : (
              <div className="text-xs">
                <p className="font-medium mb-1">Faltan: {missingFields.length} campos</p>
                <ul className="text-muted-foreground">
                  {missingFields.slice(0, 3).map(f => (
                    <li key={f}>• {f}</li>
                  ))}
                  {missingFields.length > 3 && (
                    <li>...y {missingFields.length - 3} más</li>
                  )}
                </ul>
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <button
      onClick={onEditClick}
      className={cn(
        "w-full p-4 rounded-2xl border transition-all group",
        isComplete
          ? "bg-green-500/10 border-green-500/30 hover:border-green-500/50"
          : isAlmostComplete
          ? "bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50"
          : "bg-primary/5 border-primary/20 hover:border-primary/40"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className={cn(
              "w-4 h-4",
              isAlmostComplete ? "text-yellow-500" : "text-primary"
            )} />
          )}
          <span className="text-sm font-medium text-foreground">
            {isComplete
              ? "Perfil completo"
              : `Perfil ${percentage}% completo`}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>

      <Progress value={percentage} className="h-1.5 mb-2" />

      {!isComplete && missingFields.length > 0 && (
        <p className="text-xs text-muted-foreground text-left">
          Falta: {missingFields.slice(0, 2).join(", ")}
          {missingFields.length > 2 && ` y ${missingFields.length - 2} más`}
        </p>
      )}
    </button>
  );
};

export default ProfileCompletenessCard;
