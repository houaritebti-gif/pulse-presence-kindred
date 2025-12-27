import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineMessageIndicatorProps {
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  className?: string;
}

const OfflineMessageIndicator = ({ 
  pendingCount, 
  isOnline, 
  isSyncing,
  className 
}: OfflineMessageIndicatorProps) => {
  if (pendingCount === 0 && isOnline) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-body",
      isOnline 
        ? "bg-primary/10 text-primary" 
        : "bg-destructive/10 text-destructive",
      className
    )}>
      {isSyncing ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Enviando {pendingCount} mensaje{pendingCount !== 1 ? 's' : ''}...</span>
        </>
      ) : !isOnline ? (
        <>
          <CloudOff className="w-3 h-3" />
          <span>
            Sin conexión
            {pendingCount > 0 && ` · ${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}`}
          </span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <Cloud className="w-3 h-3" />
          <span>Sincronizando...</span>
        </>
      ) : null}
    </div>
  );
};

export default OfflineMessageIndicator;
