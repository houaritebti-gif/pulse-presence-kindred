import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AdminStatsCardProps {
  icon: ReactNode;
  value: number | string;
  label: string;
  trend?: string;
  trendColor?: "emerald" | "amber" | "destructive" | "primary" | "muted";
  variant?: "default" | "highlight";
  className?: string;
}

const AdminStatsCard = ({
  icon,
  value,
  label,
  trend,
  trendColor = "muted",
  variant = "default",
  className,
}: AdminStatsCardProps) => {
  const trendColorClasses = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    destructive: "text-destructive",
    primary: "text-primary",
    muted: "text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-5 rounded-xl border-2 transition-all duration-200",
        variant === "highlight"
          ? "bg-primary/5 border-primary/30 dark:bg-primary/10"
          : "bg-card border-border hover:border-primary/40",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          variant === "highlight" ? "bg-primary/15" : "bg-muted"
        )}>
          {icon}
        </div>
      </div>
      <p className="text-4xl font-black text-foreground tracking-tight leading-none">
        {value}
      </p>
      <p className="text-sm font-medium text-muted-foreground mt-1.5">
        {label}
      </p>
      {trend && (
        <p className={cn("text-xs mt-2.5 font-semibold", trendColorClasses[trendColor])}>
          {trend}
        </p>
      )}
    </motion.div>
  );
};

export default AdminStatsCard;
