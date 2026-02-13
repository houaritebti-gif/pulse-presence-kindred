import { Crown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PremiumBadgeProps {
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

const PremiumBadge = ({ size = "md", showTooltip = true }: PremiumBadgeProps) => {
  const sizeClasses = {
    sm: "w-4 h-4 text-[8px]",
    md: "w-5 h-5 text-[10px]",
    lg: "w-6 h-6 text-xs",
  };

  const iconSizes = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  };

  const badge = (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 ring-1 ring-primary/50`}
    >
      <Crown className={`${iconSizes[size]} text-white drop-shadow-sm`} />
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-body text-xs">Usuario Premium</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PremiumBadge;
