import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  type: "email" | "identity";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const VerifiedBadge = ({ type, size = "md", showLabel = false }: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const config = {
    email: {
      label: "Email verificado",
      tooltip: "Este usuario ha verificado su dirección de email",
      className: "text-emerald-500 dark:text-emerald-400",
    },
    identity: {
      label: "Identidad verificada",
      tooltip: "Este usuario ha verificado su identidad con selfie",
      className: "text-blue-500 dark:text-blue-400",
    },
  };

  const { label, tooltip, className } = config[type];

  const badge = (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <BadgeCheck className={sizeClasses[size]} />
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </span>
  );

  if (showLabel) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerifiedBadge;
