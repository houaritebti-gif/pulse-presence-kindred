import { motion } from "framer-motion";
import { Lock, icons } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  AchievementDefinition, 
  getRarityBgColor, 
  getRarityColor,
  getRarityLabel 
} from "@/hooks/useAchievements";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AchievementBadgeProps {
  achievement: AchievementDefinition;
  unlocked: boolean;
  unlockedAt?: Date | null;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export const AchievementBadge = ({ 
  achievement, 
  unlocked, 
  unlockedAt,
  size = 'md',
  showTooltip = true 
}: AchievementBadgeProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const IconComponent = icons[achievement.icon as keyof typeof icons];

  const badge = (
    <motion.div
      initial={unlocked ? { scale: 0 } : { scale: 1 }}
      animate={{ scale: 1 }}
      whileHover={unlocked ? { scale: 1.1 } : undefined}
      className={`
        ${sizeClasses[size]}
        rounded-xl flex items-center justify-center
        ${unlocked 
          ? getRarityBgColor(achievement.rarity) 
          : 'bg-muted/30 opacity-50 grayscale'
        }
        transition-all duration-200
        ${unlocked ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      {unlocked && IconComponent ? (
        <IconComponent className={`${iconSizes[size]} text-pink-300`} strokeWidth={1.5} />
      ) : (
        <Lock className="w-5 h-5 text-muted-foreground/50" />
      )}
    </motion.div>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px] text-center">
        <p className="font-semibold">{achievement.name}</p>
        <p className="text-xs text-muted-foreground">{achievement.description}</p>
        <p className={`text-xs font-medium mt-1 ${getRarityColor(achievement.rarity)}`}>
          {getRarityLabel(achievement.rarity)}
        </p>
        {unlocked && unlockedAt && (
          <p className="text-xs text-muted-foreground mt-1">
            Desbloqueado {format(unlockedAt, "d 'de' MMMM, yyyy", { locale: es })}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};
