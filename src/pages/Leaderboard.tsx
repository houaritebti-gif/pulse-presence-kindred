import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Crown, Medal, Award, Sparkles, Zap, Star, MapPin, Filter, X, Percent, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import ParallaxBackground from "@/components/ParallaxBackground";
import { useAchievementsLeaderboard, LeaderboardEntry } from "@/hooks/useAchievementsLeaderboard";
import SharedAvatar from "@/components/SharedAvatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import { ACHIEVEMENTS, AchievementDefinition } from "@/hooks/useAchievements";
import { getSparkLevel, getNextLevel, getProgressToNextLevel, SparkLevelInfo } from "@/hooks/useSparkEnergy";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CategoryFilter = AchievementDefinition['category'] | 'all';
type SortOption = 'achievements' | 'energy';

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'Todas', emoji: '🏆' },
  { value: 'social', label: 'Social', emoji: '💬' },
  { value: 'streak', label: 'Rachas', emoji: '🔥' },
  { value: 'energy', label: 'Energía', emoji: '⚡' },
  { value: 'milestone', label: 'Hitos', emoji: '🎯' },
  { value: 'special', label: 'Especial', emoji: '✨' },
];

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof Trophy }[] = [
  { value: 'achievements', label: 'Logros', icon: Trophy },
  { value: 'energy', label: 'Energía', icon: Zap },
];
const RARITY_COLORS = {
  common: "text-slate-600 dark:text-slate-400",
  uncommon: "text-green-600 dark:text-green-500",
  rare: "text-blue-600 dark:text-blue-500",
  epic: "text-purple-600 dark:text-purple-500",
  legendary: "text-amber-600 dark:text-amber-500",
};

const RARITY_BG = {
  common: "bg-slate-100 dark:bg-slate-800/50",
  uncommon: "bg-green-100 dark:bg-green-900/30",
  rare: "bg-blue-100 dark:bg-blue-900/30",
  epic: "bg-purple-100 dark:bg-purple-900/30",
  legendary: "bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 dark:from-amber-500/20 dark:via-yellow-400/20 dark:to-amber-500/20",
};

const RANK_ICONS = [
  { icon: Crown, color: "text-amber-600 dark:text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/20" },
  { icon: Medal, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-200 dark:bg-slate-400/20" },
  { icon: Medal, color: "text-amber-700 dark:text-amber-600", bg: "bg-amber-200 dark:bg-amber-700/20" },
];

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-card/50">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
}

function LeaderboardCard({ entry, rank, isCurrentUser }: { entry: LeaderboardEntry; rank: number; isCurrentUser: boolean }) {
  const navigate = useNavigate();
  const RankIcon = rank <= 3 ? RANK_ICONS[rank - 1] : null;
  const sparkLevel = getSparkLevel(entry.totalEnergy);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05, duration: 0.3 }}
      onClick={() => navigate(`/user/${entry.profileId}`)}
      className={`
        flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300
        ${isCurrentUser 
          ? "bg-primary/10 ring-2 ring-primary/30" 
          : "bg-card/50 hover:bg-card/80"
        }
        ${rank === 1 ? RARITY_BG.legendary : ""}
      `}
    >
      {/* Rank */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
        ${RankIcon ? RankIcon.bg : "bg-muted"}
      `}>
        {RankIcon ? (
          <RankIcon.icon className={`w-4 h-4 ${RankIcon.color}`} />
        ) : (
          <span className="text-muted-foreground">{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <SharedAvatar
        profileId={entry.profileId}
        avatarUrl={entry.avatarUrl}
        name={entry.name}
        size="md"
        useLazyLoading
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground truncate">
            {entry.name || "Usuario"}
          </span>
          {entry.identityVerified && <VerifiedBadge type="identity" size="sm" />}
          {isCurrentUser && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
              Tú
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {entry.city && <span>{entry.city}</span>}
          <span className={`flex items-center gap-0.5 ${RARITY_COLORS[entry.bestRarity]}`}>
            <Sparkles className="w-3 h-3" />
            {entry.bestRarity.charAt(0).toUpperCase() + entry.bestRarity.slice(1)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="text-right space-y-0.5">
        <div className="flex items-center justify-end gap-1 text-foreground font-bold">
          <Trophy className="w-4 h-4 text-primary" />
          {entry.achievementCount}
        </div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="flex items-center justify-end gap-1 text-xs cursor-help hover:opacity-80 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-base leading-none">{sparkLevel.emoji}</span>
                <span className="text-muted-foreground">{sparkLevel.name}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[220px]">
              {(() => {
                const nextLevel = getNextLevel(sparkLevel.level);
                const progress = getProgressToNextLevel(entry.totalEnergy);
                
                return (
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">
                      {sparkLevel.emoji} Nivel {sparkLevel.level}: {sparkLevel.name}
                    </p>
                    {(sparkLevel.discount > 0 || sparkLevel.bonusGhostMessages > 0) ? (
                      <div className="space-y-1 text-xs">
                        {sparkLevel.discount > 0 && (
                          <div className="flex items-center gap-1.5 text-green-500">
                            <Percent className="w-3 h-3" />
                            <span>{sparkLevel.discount}% descuento en tienda</span>
                          </div>
                        )}
                        {sparkLevel.bonusGhostMessages > 0 && (
                          <div className="flex items-center gap-1.5 text-purple-400">
                            <Ghost className="w-3 h-3" />
                            <span>+{sparkLevel.bonusGhostMessages} mensaje{sparkLevel.bonusGhostMessages > 1 ? 's' : ''} fantasma</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Sigue ganando energía para desbloquear beneficios
                      </p>
                    )}
                    
                    {/* Progress to next level */}
                    {nextLevel ? (
                      <div className="pt-1.5 border-t border-border/50 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Siguiente:</span>
                          <span className="font-medium">
                            {nextLevel.emoji} {nextLevel.name}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <Progress value={progress} className="h-1.5" />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{entry.totalEnergy} ⚡</span>
                            <span>{nextLevel.minTotal} ⚡</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1.5 border-t border-border/50">
                        <p className="text-xs text-amber-500 flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          ¡Nivel máximo alcanzado!
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex items-center justify-end gap-0.5 text-xs text-muted-foreground">
          <Zap className="w-3 h-3 text-amber-500" />
          {entry.totalEnergy}
        </div>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: leaderboard, isLoading } = useAchievementsLeaderboard(50);
  
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('achievements');
  const [showFilters, setShowFilters] = useState(false);

  // Extract unique cities from leaderboard
  const availableCities = useMemo(() => {
    if (!leaderboard) return [];
    const cities = leaderboard
      .map(e => e.city)
      .filter((city): city is string => !!city);
    return [...new Set(cities)].sort();
  }, [leaderboard]);

  // Filter and sort leaderboard based on selected options
  const filteredLeaderboard = useMemo(() => {
    if (!leaderboard) return [];
    
    let result = leaderboard.filter(entry => {
      // City filter
      if (cityFilter && entry.city !== cityFilter) {
        return false;
      }
      
      // Category filter - check if user has any achievement in that category
      if (categoryFilter !== 'all') {
        const categoryAchievementKeys = ACHIEVEMENTS
          .filter(a => a.category === categoryFilter)
          .map(a => a.key);
        const hasAchievementInCategory = entry.achievementKeys.some(
          key => categoryAchievementKeys.includes(key as any)
        );
        if (!hasAchievementInCategory) {
          return false;
        }
      }
      
      return true;
    });

    // Sort based on selected option
    result.sort((a, b) => {
      if (sortBy === 'energy') {
        // Sort by energy first, then by achievements
        if (b.totalEnergy !== a.totalEnergy) {
          return b.totalEnergy - a.totalEnergy;
        }
        return b.achievementCount - a.achievementCount;
      } else {
        // Sort by achievements first, then by energy
        if (b.achievementCount !== a.achievementCount) {
          return b.achievementCount - a.achievementCount;
        }
        return b.totalEnergy - a.totalEnergy;
      }
    });

    return result;
  }, [leaderboard, cityFilter, categoryFilter, sortBy]);

  const hasActiveFilters = cityFilter !== null || categoryFilter !== 'all';

  const clearFilters = () => {
    setCityFilter(null);
    setCategoryFilter('all');
  };

  const currentUserRank = filteredLeaderboard?.findIndex(e => e.profileId === profile?.id);
  const currentUserEntry = currentUserRank !== undefined && currentUserRank !== -1 
    ? filteredLeaderboard?.[currentUserRank] 
    : null;
  return (
    <main className="min-h-screen bg-background flex flex-col px-4 sm:px-6 py-6 sm:py-8 pb-24 relative overflow-hidden">
      <ParallaxBackground variant="list" />

      {/* Header */}
      <PageHeader 
        backLabel="Atrás"
        rightContent={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/achievements")}
            className="gap-2"
          >
            <Star className="w-4 h-4" />
            Logros
          </Button>
        }
      />

      <div className="flex-1 max-w-lg mx-auto w-full relative z-10">
        {/* Hero section */}
        <div className="text-center mb-8 animate-fade-up">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse-soft" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-500/20 to-primary/10 flex items-center justify-center ring-2 ring-amber-500/30 ring-offset-4 ring-offset-background">
              <Trophy className="w-10 h-10 text-amber-500" />
            </div>
            <Crown className="absolute -top-2 -right-1 w-6 h-6 text-amber-400 animate-pulse-soft" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Ranking de logros
          </h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
            Los usuarios con más logros desbloqueados
          </p>
        </div>

        {/* Sort and Filters toggle */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {/* Sort buttons */}
          <div className="flex items-center rounded-lg border border-border/50 bg-card/50 p-0.5">
            {SORT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setSortBy(option.value)}
                className="gap-1.5 text-xs"
              >
                <option.icon className={`w-3.5 h-3.5 ${sortBy === option.value ? '' : option.value === 'energy' ? 'text-amber-500' : 'text-primary'}`} />
                {option.label}
              </Button>
            ))}
          </div>

          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 w-5 h-5 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center">
                {(cityFilter ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-muted-foreground"
            >
              <X className="w-4 h-4" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-4 rounded-xl bg-card/50 border border-border/50 space-y-4">
                {/* Category filter */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Categoría de logros
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={categoryFilter === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCategoryFilter(option.value)}
                        className="gap-1.5 text-xs"
                      >
                        <span>{option.emoji}</span>
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* City filter */}
                {availableCities.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Ciudad
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={cityFilter === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCityFilter(null)}
                        className="text-xs"
                      >
                        Todas
                      </Button>
                      {availableCities.map((city) => (
                        <Button
                          key={city}
                          variant={cityFilter === city ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCityFilter(city)}
                          className="text-xs"
                        >
                          {city}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current user position (if not in top) */}
        {currentUserEntry && currentUserRank !== undefined && currentUserRank >= 10 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20"
          >
            <p className="text-xs text-muted-foreground mb-2">Tu posición</p>
            <LeaderboardCard 
              entry={currentUserEntry} 
              rank={currentUserRank + 1} 
              isCurrentUser={true} 
            />
          </motion.div>
        )}

        {/* Leaderboard list */}
        <div className="space-y-2">
          {isLoading ? (
            <LeaderboardSkeleton />
          ) : filteredLeaderboard && filteredLeaderboard.length > 0 ? (
            filteredLeaderboard.map((entry, index) => (
              <LeaderboardCard
                key={entry.profileId}
                entry={entry}
                rank={index + 1}
                isCurrentUser={entry.profileId === profile?.id}
              />
            ))
          ) : hasActiveFilters ? (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-3">
                No hay usuarios que coincidan con los filtros
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aún no hay usuarios con logros desbloqueados
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
