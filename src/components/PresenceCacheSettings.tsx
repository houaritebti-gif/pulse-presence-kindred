/**
 * Presence Cache Settings Component
 * Shows detailed statistics and clear option for presence cache
 */

import { useState, useEffect } from "react";
import { Database, Trash2, RefreshCw, HardDrive, Cpu, RefreshCcw, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { 
  getPresenceCacheStats, 
  clearPresenceCache 
} from "@/hooks/usePresenceCache";
import { getCacheStats } from "@/utils/profileCacheDB";

interface CacheStats {
  memoryCount: number;
  memorySizeKB: number;
  indexedDBCount: number;
  expiredCount: number;
  totalSizeKB: number;
}

// Storage key for last sync time
const LAST_SYNC_KEY = "kiki_presence_cache_last_sync";

const PresenceCacheSettings = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const memStats = getPresenceCacheStats();
      const dbStats = await getCacheStats();
      
      // Estimate IndexedDB size (~2KB per profile average)
      const indexedDBSizeKB = dbStats.validCount * 2;
      
      setStats({
        memoryCount: memStats.memoryCount,
        memorySizeKB: memStats.memorySizeKB,
        indexedDBCount: dbStats.validCount,
        expiredCount: dbStats.expiredCount,
        totalSizeKB: memStats.memorySizeKB + indexedDBSizeKB,
      });
      
      // Load last sync time
      const storedSync = localStorage.getItem(LAST_SYNC_KEY);
      if (storedSync) {
        setLastSyncTime(new Date(parseInt(storedSync, 10)));
      }
    } catch (error) {
      console.error('[PresenceCacheSettings] Error loading stats:', error);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearPresenceCache();
      localStorage.removeItem(LAST_SYNC_KEY);
      setLastSyncTime(null);
      await loadStats();
      toast.success("Caché de presencia limpiada", {
        description: "Los perfiles se cargarán desde el servidor"
      });
    } catch (error) {
      console.error('[PresenceCacheSettings] Error clearing cache:', error);
      toast.error("Error al limpiar la caché");
    } finally {
      setIsClearing(false);
    }
  };

  const formatSize = (kb: number): string => {
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(1)} MB`;
    }
    return `${kb} KB`;
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "hace un momento";
    if (diffMins < 60) return `hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    
    return date.toLocaleDateString();
  };

  const totalCount = stats ? stats.memoryCount + stats.indexedDBCount : 0;
  const hasCache = totalCount > 0;

  return (
    <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-muted-foreground" />
          <div>
            <span className="font-body text-sm text-foreground block">
              Caché de presencia
            </span>
            <span className="font-body text-xs text-muted-foreground">
              {isLoading 
                ? "Cargando estadísticas..."
                : hasCache 
                  ? `${totalCount} perfiles (${formatSize(stats?.totalSizeKB || 0)})`
                  : "Sin perfiles en caché"
              }
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            disabled={isLoading}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            aria-label="Actualizar estadísticas"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleClearCache}
            disabled={isClearing || !hasCache}
            className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" />
            {isClearing ? "Limpiando..." : "Limpiar"}
          </button>
        </div>
      </div>

      {/* Detailed stats when cache exists */}
      {hasCache && stats && !isLoading && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <div>
                <span className="text-xs font-medium text-foreground block">
                  {stats.memoryCount}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  En memoria ({formatSize(stats.memorySizeKB)})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
              <div>
                <span className="text-xs font-medium text-foreground block">
                  {stats.indexedDBCount}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  En disco local
                </span>
              </div>
            </div>
          </div>
          
          {/* Sync status */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <RefreshCcw className="w-3.5 h-3.5 text-primary" />
            <div className="flex-1">
              <span className="text-xs font-medium text-foreground block">
                Sincronización automática
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                {lastSyncTime ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                    Última: {formatRelativeTime(lastSyncTime)}
                  </>
                ) : (
                  <>
                    <Clock className="w-2.5 h-2.5" />
                    Pendiente de primera sincronización
                  </>
                )}
              </span>
            </div>
          </div>
          
          {stats.expiredCount > 0 && (
            <div className="text-[10px] text-amber-600 dark:text-amber-400">
              {stats.expiredCount} perfiles expirados serán limpiados automáticamente
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PresenceCacheSettings;