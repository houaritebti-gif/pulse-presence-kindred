import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  ChevronDown,
  Gift,
  Check,
  Zap,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useDailyChallenges } from "@/hooks/useDailyChallenges";
import { useState } from "react";

export const DailyChallengesCard = () => {
  const {
    challenges,
    isLoading,
    completedCount,
    totalCount,
    pendingRewards,
    totalPendingEnergy,
    initializeChallenges,
    claimReward,
    claimAllRewards,
  } = useDailyChallenges();

  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize challenges on mount
  useEffect(() => {
    if (!isLoading && challenges.length > 0) {
      initializeChallenges();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-foreground/5 shadow-md shadow-foreground/10 animate-pulse">
        <div className="p-4">
          <div className="h-12 bg-muted/30 rounded-lg" />
        </div>
      </Card>
    );
  }

  const allCompleted = completedCount === totalCount;
  const hasRewards = pendingRewards > 0;

  return (
    <Card className="overflow-hidden border-foreground/5 shadow-md shadow-foreground/10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            allCompleted 
              ? "bg-gradient-to-br from-green-400 to-emerald-500"
              : "bg-gradient-to-br from-violet-400 to-purple-500"
          )}>
            {allCompleted ? (
              <Check className="w-5 h-5 text-white" />
            ) : (
              <Target className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Retos diarios</h3>
              {hasRewards && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center gap-1"
                >
                  <Gift className="w-3 h-3" />
                  {pendingRewards}
                </motion.span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{totalCount} completados
              {hasRewards && ` · ${totalPendingEnergy}⚡ pendientes`}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CardContent className="pt-0 pb-4 px-4">
              {/* Claim all button */}
              {pendingRewards > 1 && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full mb-4 gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    claimAllRewards();
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Reclamar todo (+{totalPendingEnergy}⚡)
                </Button>
              )}

              {/* Challenges list */}
              <div className="space-y-3">
                {challenges.map((challenge, index) => (
                  <motion.div
                    key={challenge.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-3 rounded-xl transition-colors",
                      challenge.isCompleted
                        ? challenge.rewardClaimed
                          ? "bg-muted/30"
                          : "bg-primary/10 ring-1 ring-primary/30"
                        : "bg-muted/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xl",
                          challenge.isCompleted
                            ? "bg-green-500/20"
                            : "bg-muted"
                        )}
                      >
                        {challenge.isCompleted ? "✅" : challenge.emoji}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4
                            className={cn(
                              "font-medium text-sm",
                              challenge.isCompleted && challenge.rewardClaimed
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            )}
                          >
                            {challenge.name}
                          </h4>
                          <span className="text-xs font-medium text-primary flex items-center gap-0.5">
                            <Zap className="w-3 h-3" />
                            {challenge.energyReward}
                          </span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2">
                          {challenge.description}
                        </p>

                        {/* Progress bar */}
                        {!challenge.isCompleted && (
                          <div className="flex items-center gap-2">
                            <Progress
                              value={(challenge.currentProgress / challenge.targetValue) * 100}
                              className="h-1.5 flex-1"
                            />
                            <span className="text-xs text-muted-foreground">
                              {challenge.currentProgress}/{challenge.targetValue}
                            </span>
                          </div>
                        )}

                        {/* Claim button */}
                        {challenge.isCompleted && !challenge.rewardClaimed && (
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full mt-2 h-8 text-xs gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              claimReward(challenge.key);
                            }}
                          >
                            <Gift className="w-3 h-3" />
                            Reclamar +{challenge.energyReward}⚡
                          </Button>
                        )}

                        {/* Claimed indicator */}
                        {challenge.rewardClaimed && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Check className="w-3 h-3" />
                            Recompensa reclamada
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Reset timer */}
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-center text-muted-foreground">
                  🔄 Los retos se renuevan cada día a medianoche
                </p>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default DailyChallengesCard;
