/**
 * Presence cache warning alert component
 * Shows only when cache is too large and not dismissed today
 */

import { useState, useEffect } from "react";
import { X, Database, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  shouldShowCacheWarning, 
  dismissCacheWarning, 
  getPresenceCacheStats 
} from "@/hooks/usePresenceCache";

const PresenceCacheWarning = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [memorySizeKB, setMemorySizeKB] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const checkWarning = async () => {
      const shouldShow = await shouldShowCacheWarning();
      if (shouldShow) {
        const stats = getPresenceCacheStats();
        setMemorySizeKB(stats.memorySizeKB);
        setIsVisible(true);
      }
    };
    
    // Check after a delay to not block initial render
    const timer = setTimeout(checkWarning, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    dismissCacheWarning();
    setIsVisible(false);
  };

  const handleGoToSettings = () => {
    dismissCacheWarning();
    setIsVisible(false);
    navigate("/profile?section=advanced");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300 md:left-auto md:right-6 md:max-w-sm">
      <div className="bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
            <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Caché de presencia grande
              </h4>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-md hover:bg-amber-200/50 dark:hover:bg-amber-800/50 text-amber-600 dark:text-amber-400 transition-colors"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Tienes {memorySizeKB > 1024 ? `${(memorySizeKB / 1024).toFixed(1)} MB` : `${memorySizeKB} KB`} en caché. 
              Limpiarlo puede mejorar el rendimiento.
            </p>
            
            <button
              onClick={handleGoToSettings}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 text-amber-800 dark:text-amber-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Limpiar caché
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresenceCacheWarning;