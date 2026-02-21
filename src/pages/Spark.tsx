import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, 
  TrendingUp, 
  History, 
  ShoppingBag,
  Trophy,
  Zap,
  Calendar,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { SparkFlame } from "@/components/SparkFlame";
import { SparkShop } from "@/components/SparkShop";
import LevelUpCelebration from "@/components/LevelUpCelebration";
import PageHeader from "@/components/PageHeader";
import { useSparkEnergy, SPARK_LEVELS, ENERGY_AMOUNTS } from "@/hooks/useSparkEnergy";
import { useLevelUpCelebration } from "@/hooks/useLevelUpCelebration";

// Transaction type icons
const getTransactionIcon = (action: string, type: string) => {
  if (type === "spend") return <ShoppingBag className="w-4 h-4" />;
  
  const iconMap: Record<string, React.ReactNode> = {
    daily_login: <Calendar className="w-4 h-4" />,
    send_spark: <Flame className="w-4 h-4" />,
    mutual_spark: <Sparkles className="w-4 h-4" />,
    send_ghost: <Zap className="w-4 h-4" />,
    reply_ghost: <Zap className="w-4 h-4" />,
    join_quedada: <Trophy className="w-4 h-4" />,
  };
  
  return iconMap[action] || <TrendingUp className="w-4 h-4" />;
};

// Action labels in Spanish
const ACTION_LABELS: Record<string, string> = {
  daily_login: "Login diario",
  explore_profiles: "Explorar perfiles",
  send_ghost: "Ghost enviado",
  reply_ghost: "Respuesta ghost",
  send_spark: "Spark enviado",
  mutual_spark: "¡Match mutuo!",
  conversation_active: "Conversación activa",
  join_quedada: "Unirse a quedada",
  update_profile: "Actualizar perfil",
  complete_profile: "Perfil completado",
};

function SparkEnergyDisplay() {
  const {
    sparkEnergy,
    isLoading,
    currentLevel,
    nextLevel,
    progressToNext,
    todayEarned,
    remainingToday,
    DAILY_MAX_ENERGY,
  } = useSparkEnergy();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 rounded-3xl bg-gradient-to-br from-card to-card/80 border border-border">
        <div className="flex items-center justify-center">
          <Skeleton className="w-24 h-24 rounded-full" />
        </div>
        <Skeleton className="h-8 w-32 mx-auto" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 rounded-3xl bg-gradient-to-br from-card to-card/80 border border-border">
      {/* Main flame display */}
      <div className="flex flex-col items-center">
        <SparkFlame level={currentLevel.level} size="xl" animate />
        
        <motion.div 
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl">{currentLevel.emoji}</span>
            <h2 className="text-2xl font-bold text-foreground">{currentLevel.name}</h2>
          </div>
          <p className="text-4xl font-black text-primary mt-1">
            {sparkEnergy?.current_energy || 0}
            <span className="text-lg ml-1">⚡</span>
          </p>
        </motion.div>
      </div>

      {/* Progress to next level */}
      {nextLevel && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Nivel {currentLevel.level}</span>
            <span className="text-muted-foreground flex items-center gap-1">
              {nextLevel.emoji} Nivel {nextLevel.level}
            </span>
          </div>
          <Progress value={progressToNext} className="h-3" />
          <p className="text-xs text-center text-muted-foreground">
            {sparkEnergy?.total_earned || 0} / {nextLevel.minTotal} energía total
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Streak */}
        <div className="p-3 rounded-xl bg-muted/50 text-center">
          <p className="text-2xl font-bold text-foreground">
            {sparkEnergy?.current_streak || 0}
          </p>
          <p className="text-[10px] text-muted-foreground">Racha días</p>
        </div>
        
        {/* Today earned */}
        <div className="p-3 rounded-xl bg-muted/50 text-center">
          <p className="text-2xl font-bold text-primary">
            {todayEarned}/{DAILY_MAX_ENERGY}
          </p>
          <p className="text-[10px] text-muted-foreground">Hoy ganado</p>
        </div>
        
        {/* Longest streak */}
        <div className="p-3 rounded-xl bg-muted/50 text-center">
          <p className="text-2xl font-bold text-foreground">
            {sparkEnergy?.longest_streak || 0}
          </p>
          <p className="text-[10px] text-muted-foreground">Mejor racha</p>
        </div>
      </div>

      {/* Level benefits */}
      {currentLevel.discount > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
          <span className="text-sm text-foreground">Descuento tienda</span>
          <span className="font-bold text-primary">-{currentLevel.discount}%</span>
        </div>
      )}
    </div>
  );
}

function HowToEarn() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Cómo ganar energía
      </h3>
      
      <div className="space-y-2">
        {Object.entries(ENERGY_AMOUNTS).slice(0, 8).map(([action, amount]) => (
          <div 
            key={action}
            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {getTransactionIcon(action, "earn")}
              </div>
              <span className="text-sm text-foreground">
                {ACTION_LABELS[action] || action}
              </span>
            </div>
            <span className="font-bold text-primary">+{amount}⚡</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LevelsOverview() {
  const { currentLevel } = useSparkEnergy();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Trophy className="w-4 h-4" />
        Niveles
      </h3>
      
      <div className="space-y-2">
        {SPARK_LEVELS.map((level) => {
          const isCurrentLevel = level.level === currentLevel.level;
          const isLocked = level.level > currentLevel.level;
          
          return (
            <motion.div 
              key={level.level}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-all",
                isCurrentLevel 
                  ? "bg-primary/10 border-primary/30" 
                  : isLocked 
                    ? "bg-muted/20 border-muted/30 opacity-60" 
                    : "bg-muted/30 border-muted/30"
              )}
              whileHover={!isLocked ? { scale: 1.01 } : undefined}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{level.emoji}</span>
                <div>
                  <p className={cn(
                    "font-semibold",
                    isCurrentLevel ? "text-primary" : "text-foreground"
                  )}>
                    {level.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {level.minTotal}+ energía total
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                {level.discount > 0 && (
                  <p className="text-sm font-bold text-primary">-{level.discount}%</p>
                )}
                {level.bonusGhostMessages > 0 && (
                  <p className="text-xs text-muted-foreground">
                    +{level.bonusGhostMessages} ghost/día
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function TransactionHistory() {
  const navigate = useNavigate();
  const { recentTransactions, isLoading } = useSparkEnergy();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!recentTransactions?.length) {
    return (
      <div className="text-center py-12">
        <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No hay transacciones aún</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Empieza a ganar energía interactuando
        </p>
      </div>
    );
  }

  // Group by date (only show first 20 for preview)
  const previewTransactions = recentTransactions.slice(0, 20);
  const groupedByDate: Record<string, typeof recentTransactions> = {};
  previewTransactions.forEach((tx) => {
    const dateKey = format(new Date(tx.created_at), "yyyy-MM-dd");
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(tx);
  });

  return (
    <div className="space-y-4">
      {Object.entries(groupedByDate).map(([dateKey, transactions]) => (
        <div key={dateKey}>
          <p className="text-xs font-medium text-muted-foreground mb-2 sticky top-0 bg-background py-1">
            {format(new Date(dateKey), "EEEE d MMMM", { locale: es })}
          </p>
          
          <div className="space-y-2">
            <AnimatePresence>
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl",
                    tx.type === "earn" ? "bg-primary/5" : "bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      tx.type === "earn" 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {getTransactionIcon(tx.action, tx.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {tx.description || ACTION_LABELS[tx.action] || tx.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                  
                  <span className={cn(
                    "font-bold",
                    tx.type === "earn" ? "text-primary" : "text-muted-foreground"
                  )}>
                    {tx.type === "earn" ? "+" : "-"}{tx.amount}⚡
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}

      {/* View all button */}
      {recentTransactions.length > 20 && (
        <Button
          variant="outline"
          className="w-full rounded-xl"
          onClick={() => navigate("/spark-history")}
        >
          <ChevronRight className="w-4 h-4 mr-2" />
          Ver historial completo
        </Button>
      )}
    </div>
  );
}

export default function Spark() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const { sparkEnergy } = useSparkEnergy();
  
  // Level up celebration detection
  const { isOpen, newLevel, previousLevel, closeCelebration } = useLevelUpCelebration(
    sparkEnergy?.total_earned
  );

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Level Up Celebration Modal */}
      <LevelUpCelebration
        isOpen={isOpen}
        onClose={closeCelebration}
        newLevel={newLevel}
        previousLevel={previousLevel}
      />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <PageHeader 
          backLabel="Volver"
          className="mb-0"
        />
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Energy display always visible */}
        <SparkEnergyDisplay />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="overview" className="text-xs">
              <TrendingUp className="w-4 h-4 mr-1" />
              Info
            </TabsTrigger>
            <TabsTrigger value="shop" className="text-xs">
              <ShoppingBag className="w-4 h-4 mr-1" />
              Tienda
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              <History className="w-4 h-4 mr-1" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <HowToEarn />
            <LevelsOverview />
          </TabsContent>

          <TabsContent value="shop" className="mt-6">
            <SparkShop />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <ScrollArea className="h-[400px] pr-4">
              <TransactionHistory />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
