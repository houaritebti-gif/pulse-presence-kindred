import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Crown, Medal, Award, Sparkles, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import ParallaxBackground from "@/components/ParallaxBackground";
import { useAchievementsLeaderboard, LeaderboardEntry } from "@/hooks/useAchievementsLeaderboard";
import SharedAvatar from "@/components/SharedAvatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";

const RARITY_COLORS = {
  common: "text-muted-foreground",
  uncommon: "text-green-500",
  rare: "text-blue-500",
  epic: "text-purple-500",
  legendary: "text-amber-500",
};

const RARITY_BG = {
  common: "bg-muted/50",
  uncommon: "bg-green-500/10",
  rare: "bg-blue-500/10",
  epic: "bg-purple-500/10",
  legendary: "bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20",
};

const RANK_ICONS = [
  { icon: Crown, color: "text-amber-500", bg: "bg-amber-500/20" },
  { icon: Medal, color: "text-slate-400", bg: "bg-slate-400/20" },
  { icon: Medal, color: "text-amber-700", bg: "bg-amber-700/20" },
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
      <div className="text-right">
        <div className="flex items-center gap-1 text-foreground font-bold">
          <Trophy className="w-4 h-4 text-primary" />
          {entry.achievementCount}
        </div>
        <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
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

  const currentUserRank = leaderboard?.findIndex(e => e.profileId === profile?.id);
  const currentUserEntry = currentUserRank !== undefined && currentUserRank !== -1 
    ? leaderboard?.[currentUserRank] 
    : null;

  return (
    <main className="min-h-screen bg-background flex flex-col px-4 sm:px-6 py-6 sm:py-8 pb-24 relative overflow-hidden">
      <ParallaxBackground variant="list" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 font-body group"
          aria-label="Volver"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span style={{ fontFamily: 'Arial, sans-serif' }}>Atrás</span>
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/achievements")}
            className="gap-2"
          >
            <Star className="w-4 h-4" />
            Logros
          </Button>
          <ThemeToggle />
        </div>
      </div>

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
          ) : leaderboard && leaderboard.length > 0 ? (
            leaderboard.map((entry, index) => (
              <LeaderboardCard
                key={entry.profileId}
                entry={entry}
                rank={index + 1}
                isCurrentUser={entry.profileId === profile?.id}
              />
            ))
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
