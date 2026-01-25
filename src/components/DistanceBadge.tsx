import { MapPin } from 'lucide-react';
import { formatDistance } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DistanceBadgeProps {
  distanceKm: number | null | undefined;
  className?: string;
  showTooltip?: boolean;
  variant?: 'default' | 'card' | 'fullscreen';
}

export function DistanceBadge({ 
  distanceKm, 
  className,
  showTooltip = true,
  variant = 'default'
}: DistanceBadgeProps) {
  const formattedDistance = formatDistance(distanceKm);
  
  if (!formattedDistance) return null;

  const badge = (
    <div 
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        variant === 'default' && "px-2 py-0.5 rounded-full bg-primary/10 text-primary",
        variant === 'card' && "px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white",
        variant === 'fullscreen' && "px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white",
        className
      )}
    >
      <MapPin className="w-3 h-3" />
      <span>{formattedDistance}</span>
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>Distancia aproximada</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
