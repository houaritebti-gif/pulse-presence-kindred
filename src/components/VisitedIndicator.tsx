// Subtle indicator for visited/viewed profiles
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VisitedIndicatorProps {
  className?: string;
  showTooltip?: boolean;
}

/**
 * A subtle indicator showing that a profile has been visited before
 * Non-invasive design: small, muted icon that doesn't distract
 */
export const VisitedIndicator = ({ className, showTooltip = true }: VisitedIndicatorProps) => {
  const indicator = (
    <span
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded-full",
        "bg-muted/60 text-muted-foreground/60",
        "backdrop-blur-sm",
        className
      )}
    >
      <Eye className="w-3 h-3" />
    </span>
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Ya viste este perfil
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VisitedIndicator;
