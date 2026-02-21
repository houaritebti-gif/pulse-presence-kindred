import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  History, 
  ShoppingBag,
  Trophy,
  Zap,
  Calendar,
  Flame,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Filter,
  ChevronDown,
  X
} from "lucide-react";
import { format, subDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useSparkEnergy, SparkTransaction } from "@/hooks/useSparkEnergy";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { triggerHaptic } from "@/utils/haptics";
import PageHeader from "@/components/PageHeader";

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
    explore_profiles: <TrendingUp className="w-4 h-4" />,
    streak_bonus: <Flame className="w-4 h-4" />,
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
  streak_bonus: "Bonus de racha",
  shop_purchase: "Compra en tienda",
};

// Date range presets
type DateRange = "all" | "today" | "week" | "month" | "custom";
type TransactionType = "all" | "earn" | "spend";

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  all: "Todo el tiempo",
  today: "Hoy",
  week: "Última semana",
  month: "Último mes",
  custom: "Personalizado",
};

export default function SparkHistory() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  
  // Filters
  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [transactionType, setTransactionType] = useState<TransactionType>("all");
  const [customDateStart, setCustomDateStart] = useState<Date | undefined>();
  const [customDateEnd, setCustomDateEnd] = useState<Date | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch all transactions (not just recent 50)
  const { data: allTransactions, isLoading } = useQuery({
    queryKey: ["all-spark-transactions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("spark_transactions")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return (data || []) as SparkTransaction[];
    },
    enabled: !!profile?.id,
    staleTime: 30000,
  });

  // Apply filters
  const filteredTransactions = useMemo(() => {
    if (!allTransactions) return [];

    return allTransactions.filter((tx) => {
      // Type filter
      if (transactionType !== "all" && tx.type !== transactionType) {
        return false;
      }

      // Date filter
      const txDate = new Date(tx.created_at);
      const now = new Date();

      switch (dateRange) {
        case "today":
          return isAfter(txDate, startOfDay(now));
        case "week":
          return isAfter(txDate, subDays(now, 7));
        case "month":
          return isAfter(txDate, subDays(now, 30));
        case "custom":
          if (customDateStart && isBefore(txDate, startOfDay(customDateStart))) {
            return false;
          }
          if (customDateEnd && isAfter(txDate, endOfDay(customDateEnd))) {
            return false;
          }
          return true;
        default:
          return true;
      }
    });
  }, [allTransactions, dateRange, transactionType, customDateStart, customDateEnd]);

  // Calculate totals for filtered transactions
  const totals = useMemo(() => {
    const earned = filteredTransactions
      .filter((tx) => tx.type === "earn")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const spent = filteredTransactions
      .filter((tx) => tx.type === "spend")
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { earned, spent, net: earned - spent };
  }, [filteredTransactions]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, SparkTransaction[]> = {};
    filteredTransactions.forEach((tx) => {
      const dateKey = format(new Date(tx.created_at), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const activeFiltersCount = 
    (transactionType !== "all" ? 1 : 0) + 
    (dateRange !== "all" ? 1 : 0);

  const clearFilters = () => {
    setDateRange("all");
    setTransactionType("all");
    setCustomDateStart(undefined);
    setCustomDateEnd(undefined);
    triggerHaptic("light");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-3">
          <PageHeader 
            backLabel="Volver"
            showThemeToggle={false}
            className="mb-0"
          />
        </div>

        {/* Filter bar */}
        <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Date Range Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "rounded-full gap-1 shrink-0",
                  dateRange !== "all" && "bg-primary/10 border-primary/30"
                )}
                onClick={() => triggerHaptic("selection")}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs">{DATE_RANGE_LABELS[dateRange]}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Período
              </DropdownMenuLabel>
              {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).filter(k => k !== "custom").map((range) => (
                <DropdownMenuItem
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    triggerHaptic("light");
                  }}
                  className={cn(dateRange === range && "bg-primary/10")}
                >
                  {DATE_RANGE_LABELS[range]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setShowDatePicker(true);
                  setDateRange("custom");
                  triggerHaptic("light");
                }}
              >
                Personalizado...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Transaction Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "rounded-full gap-1 shrink-0",
                  transactionType !== "all" && "bg-primary/10 border-primary/30"
                )}
                onClick={() => triggerHaptic("selection")}
              >
                {transactionType === "earn" ? (
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                ) : transactionType === "spend" ? (
                  <TrendingDown className="w-3.5 h-3.5 text-orange-500" />
                ) : (
                  <Filter className="w-3.5 h-3.5" />
                )}
                <span className="text-xs">
                  {transactionType === "all" 
                    ? "Tipo" 
                    : transactionType === "earn" 
                      ? "Ganado" 
                      : "Gastado"}
                </span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem
                onClick={() => {
                  setTransactionType("all");
                  triggerHaptic("light");
                }}
                className={cn(transactionType === "all" && "bg-primary/10")}
              >
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setTransactionType("earn");
                  triggerHaptic("light");
                }}
                className={cn(transactionType === "earn" && "bg-primary/10")}
              >
                <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                Ganado
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setTransactionType("spend");
                  triggerHaptic("light");
                }}
                className={cn(transactionType === "spend" && "bg-primary/10")}
              >
                <TrendingDown className="w-4 h-4 mr-2 text-orange-500" />
                Gastado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="rounded-full gap-1 shrink-0 text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
              <span className="text-xs">Limpiar</span>
            </Button>
          )}
        </div>
      </header>

      {/* Custom Date Picker Popover */}
      <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
        <PopoverTrigger className="hidden" />
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            <p className="text-sm font-medium">Selecciona rango de fechas</p>
            <div className="flex gap-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Desde</p>
                <CalendarComponent
                  mode="single"
                  selected={customDateStart}
                  onSelect={setCustomDateStart}
                  disabled={(date) => date > new Date()}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Hasta</p>
                <CalendarComponent
                  mode="single"
                  selected={customDateEnd}
                  onSelect={setCustomDateEnd}
                  disabled={(date) => date > new Date()}
                />
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowDatePicker(false)}
              className="w-full"
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Summary Card */}
        <motion.div 
          className="p-4 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-500">
                +{totals.earned}
              </p>
              <p className="text-xs text-muted-foreground">Ganado</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">
                -{totals.spent}
              </p>
              <p className="text-xs text-muted-foreground">Gastado</p>
            </div>
            <div>
              <p className={cn(
                "text-2xl font-bold",
                totals.net >= 0 ? "text-primary" : "text-destructive"
              )}>
                {totals.net >= 0 ? "+" : ""}{totals.net}⚡
              </p>
              <p className="text-xs text-muted-foreground">Balance</p>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            {filteredTransactions.length} transacciones
          </p>
        </motion.div>

        {/* Transaction List */}
        <ScrollArea className="h-[calc(100vh-320px)]">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay transacciones</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Prueba a cambiar los filtros
              </p>
            </div>
          ) : (
            <div className="space-y-4 pr-2">
              {Object.entries(groupedByDate).map(([dateKey, transactions]) => (
                <div key={dateKey}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 sticky top-0 bg-background py-1 capitalize">
                    {format(new Date(dateKey), "EEEE d MMMM", { locale: es })}
                  </p>
                  
                  <div className="space-y-2">
                    <AnimatePresence>
                      {transactions.map((tx, index) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl transition-colors",
                            tx.type === "earn" 
                              ? "bg-green-500/5 hover:bg-green-500/10" 
                              : "bg-orange-500/5 hover:bg-orange-500/10"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              tx.type === "earn" 
                                ? "bg-green-500/20 text-green-500" 
                                : "bg-orange-500/20 text-orange-500"
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
                            "font-bold text-lg",
                            tx.type === "earn" ? "text-green-500" : "text-orange-500"
                          )}>
                            {tx.type === "earn" ? "+" : "-"}{tx.amount}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </main>
    </div>
  );
}
