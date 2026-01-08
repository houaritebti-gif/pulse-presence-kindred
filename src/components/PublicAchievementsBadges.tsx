import { Trophy } from "lucide-react";
import { usePublicAchievementBadges } from "@/hooks/usePublicAchievements";
import { AchievementBadge } from "@/components/AchievementBadge";
import { getRarityColor, ACHIEVEMENTS } from "@/hooks/useAchievements";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicAchievementsBadgesProps {
  profileId: string | undefined;
  maxDisplay?: number;
}

const PublicAchievementsBadges = ({ profileId, maxDisplay = 6 }: PublicAchievementsBadgesProps) => {
  const { achievements, isLoading, count } = usePublicAchievementBadges(profileId);
  
  if (isLoading) {
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
      {achievements.length > 0 && achievements[0].definition && (
        <p className={`mt-2 text-xs font-medium ${getRarityColor(achievements[0].definition.rarity)}`}>
          {achievements[0].definition.emoji} Mejor logro: {achievements[0].definition.name}
        </p>
      )}
    </div>
  );
};

export default PublicAchievementsBadges;
