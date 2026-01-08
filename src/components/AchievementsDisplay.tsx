import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Zap, Target, Star, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  useAchievements, 
  ACHIEVEMENTS, 
  AchievementDefinition,
  getRarityBgColor,
  getRarityColor,
  getRarityLabel 
} from "@/hooks/useAchievements";
import { AchievementBadge } from "@/components/AchievementBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const categoryIcons = {
  social: Flame,
  streak: Zap,
  energy: Star,
  milestone: Target,
  special: Trophy,
};

const categoryLabels = {
  social: 'Social',
  streak: 'Rachas',
  energy: 'Energía',
  milestone: 'Hitos',
  special: 'Especiales',
};

interface AchievementsDisplayProps {
  compact?: boolean;
  showHeader?: boolean;
}

export const AchievementsDisplay = ({ compact = false, showHeader = true }: AchievementsDisplayProps) => {
  const navigate = useNavigate();
  const { 
    achievements, 
    unlockedAchievements, 
    isLoading, 
    isUnlocked, 
    getUnlockDate,
    unlockedCount,
    totalCount 
  } = useAchievements();
  const [activeCategory, setActiveCategory] = useState<AchievementDefinition['category']>('social');

  const progressPercentage = (unlockedCount / totalCount) * 100;

  const filteredAchievements = achievements.filter(a => a.category === activeCategory);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-full" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="w-16 h-16 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    // Compact view for profile page
    const recentUnlocked = [...(unlockedAchievements || [])]
      .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
      .slice(0, 4);

    return (
      <Card 
        className="border-border/50 cursor-pointer hover:bg-accent/5 transition-colors"
        onClick={() => navigate('/achievements')}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Logros</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {unlockedCount}/{totalCount}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progressPercentage} className="h-1.5" />
          
          {recentUnlocked.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {recentUnlocked.map(ua => {
                const def = achievements.find(a => a.key === ua.achievement_key);
                if (!def) return null;
                return (
                  <AchievementBadge
                    key={ua.id}
                    achievement={def}
                    unlocked={true}
                    unlockedAt={new Date(ua.unlocked_at)}
                    size="sm"
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              ¡Completa acciones para desbloquear logros!
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view for achievements page
  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-display font-bold">Logros</h1>
          </div>
          <p className="text-muted-foreground">
            {unlockedCount} de {totalCount} desbloqueados
          </p>
          <Progress value={progressPercentage} className="h-2 max-w-xs mx-auto" />
        </div>
      )}

      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as AchievementDefinition['category'])}>
        <TabsList className="grid grid-cols-5 w-full">
          {(Object.keys(categoryLabels) as AchievementDefinition['category'][]).map(cat => {
            const Icon = categoryIcons[cat];
            const unlockedInCategory = achievements
              .filter(a => a.category === cat)
              .filter(a => isUnlocked(a.key)).length;
            const totalInCategory = achievements.filter(a => a.category === cat).length;
            
            return (
              <TabsTrigger key={cat} value={cat} className="flex flex-col gap-0.5 py-2">
                <Icon className="w-4 h-4" />
                <span className="text-[10px] hidden sm:block">{categoryLabels[cat]}</span>
                <span className="text-[10px] text-muted-foreground">
                  {unlockedInCategory}/{totalInCategory}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <AnimatePresence mode="wait">
          {(Object.keys(categoryLabels) as AchievementDefinition['category'][]).map(cat => (
            <TabsContent key={cat} value={cat} className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
              >
                {achievements
                  .filter(a => a.category === cat)
                  .map(achievement => {
                    const unlocked = isUnlocked(achievement.key);
                    const unlockedAt = getUnlockDate(achievement.key);
                    
                    return (
                      <motion.div
                        key={achievement.key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`
                          p-4 rounded-xl border
                          ${unlocked 
                            ? `${getRarityBgColor(achievement.rarity)} border-transparent` 
                            : 'bg-muted/20 border-border/30'
                          }
                        `}
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          <AchievementBadge
                            achievement={achievement}
                            unlocked={unlocked}
                            unlockedAt={unlockedAt}
                            size="lg"
                            showTooltip={false}
                          />
                          <div>
                            <p className={`font-semibold text-sm ${!unlocked && 'text-muted-foreground'}`}>
                              {achievement.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {achievement.description}
                            </p>
                            <p className={`text-xs font-medium mt-1 ${getRarityColor(achievement.rarity)}`}>
                              {getRarityLabel(achievement.rarity)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </motion.div>
            </TabsContent>
          ))}
        </AnimatePresence>
      </Tabs>
    </div>
  );
};
