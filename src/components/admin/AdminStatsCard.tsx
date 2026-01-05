import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminStatsCardProps {
  icon: ReactNode;
  value: number | string;
  label: string;
  trend?: string;
  trendColor?: "emerald" | "amber" | "destructive" | "primary" | "muted";
  variant?: "default" | "highlight";
  className?: string;
  variants?: Variants;
  tooltip?: string;
}

const AdminStatsCard = ({
  icon,
  value,
  label,
  trend,
  trendColor = "muted",
  variant = "default",
  className,
  variants,
  tooltip,
}: AdminStatsCardProps) => {
  const trendColorClasses = {
    emerald: "text-[hsl(160,60%,45%)] dark:text-[hsl(160,70%,55%)]",
    amber: "text-[hsl(45,90%,40%)] dark:text-[hsl(45,90%,60%)]",
    destructive: "text-destructive dark:text-[hsl(0,65%,60%)]",
    primary: "text-primary",
    muted: "text-muted-foreground",
  };

  return (
    <motion.div
      variants={variants}
      className={cn(
        "p-5 rounded-xl border-2 transition-all duration-200",
        variant === "highlight"
          ? "bg-primary/5 border-primary/30 dark:bg-primary/10"
          : "bg-card border-border hover:border-primary/40",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          variant === "highlight" ? "bg-primary/15" : "bg-muted"
        )}>
          {icon}
        </div>
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-md hover:bg-muted/50 transition-colors">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] text-center">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
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
