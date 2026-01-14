import * as React from "react";
import { WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NetworkErrorInlineProps {
  onRetry?: () => void;
  isRetrying?: boolean;
  message?: string;
  compact?: boolean;
  className?: string;
}

const NetworkErrorInline = React.forwardRef<HTMLDivElement, NetworkErrorInlineProps>(
  (
    {
      onRetry,
      isRetrying = false,
      message = "Error de conexión",
      compact = false,
      className,
    },
    ref
  ) => {
    if (compact) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in",
            className
          )}
          role="alert"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">{message}</span>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRetrying && "animate-spin")} />
            </Button>
          )}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20 animate-fade-in",
          className
        )}
        role="alert"
      >
        <div className="flex items-center gap-2 text-destructive">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <WifiOff className="w-5 h-5" />
          </div>
        </div>
        
        <div className="text-center">
          <p className="font-medium text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Revisa tu conexión e intenta de nuevo
          </p>
        </div>

        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRetrying && "animate-spin")} />
            {isRetrying ? "Reintentando..." : "Reintentar"}
          </Button>
        )}
      </div>
    );
  }
);

NetworkErrorInline.displayName = "NetworkErrorInline";

// Toast-style notification for transient network errors
interface NetworkErrorToastProps {
  show: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const NetworkErrorToast = React.forwardRef<HTMLDivElement, NetworkErrorToastProps>(
  ({ show, onDismiss, onRetry, isRetrying = false }, ref) => {
    if (!show) return null;

    return (
      <div
        ref={ref}
        className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up md:left-auto md:right-4 md:w-96"
        role="alert"
      >
        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-destructive/30 shadow-lg backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm">Sin conexión</p>
            <p className="text-xs text-muted-foreground truncate">
              Algunos datos pueden estar desactualizados
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onRetry && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRetry}
                disabled={isRetrying}
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <RefreshCw className={cn("w-4 h-4", isRetrying && "animate-spin")} />
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">Cerrar</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

NetworkErrorToast.displayName = "NetworkErrorToast";

export default NetworkErrorInline;
