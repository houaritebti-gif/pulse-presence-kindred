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
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    destructive: "text-destructive",
    primary: "text-primary",
    muted: "text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border transition-all duration-200",
        variant === "highlight"
          ? "bg-primary/5 border-primary/20"
          : "bg-card border-border hover:border-primary/30",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          variant === "highlight" ? "bg-primary/10" : "bg-muted"
        )}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Arial Black, sans-serif' }}>
        {value}
      </p>
      <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
        {label}
      </p>
      {trend && (
        <p className={cn("text-xs mt-2 font-medium", trendColorClasses[trendColor])}>
          {trend}
        </p>
      )}
    </motion.div>
  );
};

export default AdminStatsCard;
