import { Trophy, icons } from "lucide-react";
import { usePublicAchievementBadges, useAchievementsVisibility } from "@/hooks/usePublicAchievements";
import { AchievementBadge } from "@/components/AchievementBadge";
import { getRarityColor, ACHIEVEMENTS } from "@/hooks/useAchievements";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicAchievementsBadgesProps {
  profileId: string | undefined;
  maxDisplay?: number;
}

const PublicAchievementsBadges = ({ profileId, maxDisplay = 6 }: PublicAchievementsBadgesProps) => {
  const { achievements, isLoading, count } = usePublicAchievementBadges(profileId);
  const { showAchievements, isLoading: visibilityLoading } = useAchievementsVisibility(profileId);
  
  if (isLoading || visibilityLoading) {
    return (
      <div className="animate-fade-up">
        <div className="flex items-center gap-1.5 mb-2">
          <Skeleton className="w-3.5 h-3.5 rounded" />
          <Skeleton className="w-16 h-3" />
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-10 h-10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  // Don't show if user has disabled achievements visibility
  if (!showAchievements) {
    return null;
  }
  
  if (count === 0) {
    return null; // Don't show section if no achievements
  }
  
  const displayedAchievements = achievements.slice(0, maxDisplay);
  const remainingCount = count - maxDisplay;
  
  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
        <Trophy className="w-3.5 h-3.5" />
        Logros ({count}/{ACHIEVEMENTS.length})
      </h2>
      
      <div className="flex flex-wrap gap-2 items-center">
        {displayedAchievements.map(achievement => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement.definition!}
            unlocked={true}
            unlockedAt={new Date(achievement.unlocked_at)}
            size="sm"
            showTooltip={true}
          />
        ))}
        
        {remainingCount > 0 && (
          <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">
              +{remainingCount}
            </span>
          </div>
        )}
      </div>
      
      {/* Show rarity highlight for best achievement */}
      {achievements.length > 0 && achievements[0].definition && (() => {
        const BestIcon = icons[achievements[0].definition!.icon as keyof typeof icons];
        return (
          <p className={`mt-2 text-xs font-medium flex items-center gap-1.5 ${getRarityColor(achievements[0].definition!.rarity)}`}>
            {BestIcon && <BestIcon className="w-3.5 h-3.5" strokeWidth={1.5} />}
            Mejor logro: {achievements[0].definition!.name}
          </p>
        );
      })()}
    </div>
  );
};

export default PublicAchievementsBadges;
