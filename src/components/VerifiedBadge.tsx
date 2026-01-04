import { BadgeCheck, Mail } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  type: "email";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const VerifiedBadge = ({ type, size = "md", showLabel = false }: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const containerSizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-2.5 py-1",
  };

  const config = {
    email: {
      icon: Mail,
      label: "Email verificado",
      tooltip: "Este usuario ha verificado su dirección de email",
      className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    },
  };

  const { icon: Icon, label, tooltip, className } = config[type];

  const badge = (
    <span 
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${containerSizeClasses[size]} ${className}`}
    >
      <Icon className={sizeClasses[size]} />
      {showLabel && <span>{label}</span>}
      {!showLabel && <BadgeCheck className={sizeClasses[size]} />}
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
