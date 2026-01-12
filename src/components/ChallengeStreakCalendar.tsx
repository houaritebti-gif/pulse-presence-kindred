import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Flame, Trophy, Calendar, Zap, Gift, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useChallengeStreak, StreakDay, STREAK_BONUS_MILESTONES } from "@/hooks/useChallengeStreak";
import { useSparkEnergy } from "@/hooks/useSparkEnergy";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";

const DayCell = ({ day, index }: { day: StreakDay; index: number }) => {
  const date = new Date(day.date);
  const dayOfWeek = date.toLocaleDateString('es-ES', { weekday: 'narrow' });
  const dayNumber = date.getDate();
  const isToday = day.date === new Date().toISOString().split('T')[0];
  
  // Determine cell state
  const hasActivity = day.totalCount > 0;
  const partialComplete = hasActivity && day.completedCount > 0 && !day.allCompleted;
  const allComplete = day.allCompleted;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.015 }}
      className="flex flex-col items-center gap-0.5"
    >
      <span className="text-[10px] text-muted-foreground uppercase">
        {dayOfWeek}
      </span>
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
          isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background",
          !hasActivity && "bg-muted/30 text-muted-foreground",
          partialComplete && "bg-amber-500/20 text-amber-600 dark:text-amber-400",
          allComplete && "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm"
        )}
      >
        {allComplete ? (
          <Flame className="h-4 w-4" />
        ) : (
          dayNumber
        )}
      </div>
      {hasActivity && (
        <div className="flex gap-0.5 mt-0.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i < day.completedCount
                  ? "bg-primary"
                  : "bg-muted-foreground/20"
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const StatBadge = ({ 
  icon: Icon, 
  value, 
  label, 
  color 
}: { 
  icon: typeof Flame; 
  value: number; 
  label: string; 
  color: string;
}) => (
  <div className={cn(
    "flex items-center gap-2 px-3 py-2 rounded-xl",
    color
  )}>
    <Icon className="h-5 w-5" />
    <div className="text-left">
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="text-[10px] opacity-80">{label}</div>
    </div>
  </div>
);

// Streak bonus milestone component
const StreakBonusMilestone = ({
  milestone,
  currentStreak,
  isClaimed,
  onClaim,
  isClaiming,
}: {
  milestone: typeof STREAK_BONUS_MILESTONES[number];
  currentStreak: number;
  isClaimed: boolean;
  onClaim: () => void;
  isClaiming: boolean;
}) => {
  const isReached = currentStreak >= milestone.days;
  const canClaim = isReached && !isClaimed;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-xl border transition-all",
        isClaimed && "bg-muted/30 border-muted opacity-60",
        canClaim && "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 shadow-sm",
        !isReached && !isClaimed && "bg-muted/10 border-border/50"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{milestone.emoji}</span>
        <div>
          <div className="font-medium text-sm">
            {milestone.days} días seguidos
          </div>
          <div className="text-xs text-muted-foreground">
            +{milestone.bonus} ⚡ de bonus
          </div>
        </div>
      </div>
      
      {isClaimed ? (
        <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md">
          ✓ Reclamado
        </div>
      ) : canClaim ? (
        <Button
          size="sm"
          onClick={onClaim}
          disabled={isClaiming}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
        >
          {isClaiming ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Gift className="h-3.5 w-3.5" />
          )}
          Reclamar
        </Button>
      ) : (
        <div className="text-xs text-muted-foreground">
          {milestone.days - currentStreak} días más
        </div>
      )}
    </div>
  );
};

export const ChallengeStreakCalendar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: streakData, isLoading } = useChallengeStreak();
  const { data: profile } = useProfile();
  const { earnEnergy } = useSparkEnergy();
  const queryClient = useQueryClient();

  // Mutation to claim streak bonus
  const claimBonusMutation = useMutation({
    mutationFn: async (days: number) => {
      if (!profile?.id) throw new Error('No profile');

      const milestone = STREAK_BONUS_MILESTONES.find(m => m.days === days);
      if (!milestone) throw new Error('Invalid milestone');

      // Check if already claimed
      const { data: existing } = await supabase
        .from('spark_transactions')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('action', `challenge_streak_bonus_${days}`)
        .maybeSingle();

      if (existing) throw new Error('Ya reclamaste este bonus');

      // Award energy
      await earnEnergy({
        action: `challenge_streak_bonus_${days}`,
        description: `Bonus racha ${days} días`,
        customAmount: milestone.bonus,
      });

      return milestone;
    },
    onSuccess: (milestone) => {
      triggerHaptic('success');
      toast.success(`${milestone.emoji} ¡Bonus de racha reclamado!`, {
        description: `+${milestone.bonus} ⚡ por ${milestone.days} días consecutivos`,
      });
      queryClient.invalidateQueries({ queryKey: ['challenge_streak'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error al reclamar');
    },
  });

  if (isLoading || !streakData) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { currentStreak, longestStreak, totalDaysCompleted, last30Days, streakBonusesClaimed } = streakData;

  // Split into weeks for display
  const weeks: StreakDay[][] = [];
  for (let i = 0; i < last30Days.length; i += 7) {
    weeks.push(last30Days.slice(i, i + 7));
  }

  // Check for available bonuses
  const availableBonuses = STREAK_BONUS_MILESTONES.filter(
    m => currentStreak >= m.days && !streakBonusesClaimed.includes(m.days)
  );

  // Find next milestone to show progress
  const nextMilestone = STREAK_BONUS_MILESTONES.find(
    m => currentStreak < m.days && !streakBonusesClaimed.includes(m.days)
  );
  
  // Calculate progress to next milestone
  const getProgressToNextMilestone = () => {
    if (!nextMilestone) return { progress: 100, daysLeft: 0 };
    const previousMilestone = [...STREAK_BONUS_MILESTONES]
      .reverse()
      .find(m => m.days < nextMilestone.days && currentStreak >= m.days);
    const startDays = previousMilestone?.days || 0;
    const range = nextMilestone.days - startDays;
    const progressDays = currentStreak - startDays;
    return {
      progress: Math.min(100, Math.round((progressDays / range) * 100)),
      daysLeft: nextMilestone.days - currentStreak,
    };
  };

  const { progress: progressPercent, daysLeft } = getProgressToNextMilestone();

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex flex-col gap-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                <Flame className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Racha de retos</h3>
                <p className="text-sm text-muted-foreground">
                  {currentStreak > 0 
                    ? `🔥 ${currentStreak} día${currentStreak > 1 ? 's' : ''} consecutivo${currentStreak > 1 ? 's' : ''}`
                    : 'Completa todos los retos hoy'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {availableBonuses.length > 0 && (
                <div className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium animate-pulse">
                  🎁 {availableBonuses.length}
                </div>
              )}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
          
          {/* Progress bar to next milestone - shown when collapsed */}
          {!isExpanded && nextMilestone && currentStreak > 0 && (
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Próximo bonus: {nextMilestone.emoji} {nextMilestone.days} días
                </span>
                <span className="text-primary font-medium">
                  +{nextMilestone.bonus} ⚡
                </span>
              </div>
              <div className="relative h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                {daysLeft === 1 ? '¡Solo 1 día más!' : `${daysLeft} días para el bonus`}
              </p>
            </div>
          )}
        </button>

        {/* Expandable content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                {/* Stats row */}
                <div className="flex gap-2 justify-center">
                  <StatBadge
                    icon={Flame}
                    value={currentStreak}
                    label="Actual"
                    color="bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-600 dark:text-orange-400"
                  />
                  <StatBadge
                    icon={Trophy}
                    value={longestStreak}
                    label="Récord"
                    color="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 text-yellow-600 dark:text-yellow-400"
                  />
                  <StatBadge
                    icon={Zap}
                    value={totalDaysCompleted}
                    label="30 días"
                    color="bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                  />
                </div>

                {/* Streak Bonus Milestones */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Gift className="h-3.5 w-3.5" />
                    <span>Bonus por racha</span>
                  </div>
                  <div className="space-y-2">
                    {STREAK_BONUS_MILESTONES.map((milestone) => (
                      <StreakBonusMilestone
                        key={milestone.days}
                        milestone={milestone}
                        currentStreak={currentStreak}
                        isClaimed={streakBonusesClaimed.includes(milestone.days)}
                        onClaim={() => claimBonusMutation.mutate(milestone.days)}
                        isClaiming={claimBonusMutation.isPending}
                      />
                    ))}
                  </div>
                </div>

                {/* Calendar grid */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Últimos 30 días</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex justify-between gap-1">
                        {week.map((day, dayIndex) => (
                          <DayCell
                            key={day.date}
                            day={day}
                            index={weekIndex * 7 + dayIndex}
                          />
                        ))}
                        {/* Fill empty cells for incomplete weeks */}
                        {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
                          <div key={`empty-${i}`} className="w-8" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-muted/30" />
                    <span>Sin actividad</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-amber-500/40" />
                    <span>Parcial</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-green-500 to-emerald-600" />
                    <span>Completo</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ChallengeStreakCalendar;
