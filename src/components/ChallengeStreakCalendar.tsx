import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Flame, Trophy, Calendar, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useChallengeStreak, StreakDay } from "@/hooks/useChallengeStreak";
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

export const ChallengeStreakCalendar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: streakData, isLoading } = useChallengeStreak();

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

  const { currentStreak, longestStreak, totalDaysCompleted, last30Days } = streakData;

  // Split into weeks for display
  const weeks: StreakDay[][] = [];
  for (let i = 0; i < last30Days.length; i += 7) {
    weeks.push(last30Days.slice(i, i + 7));
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
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
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
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
