import * as React from "react";
import { LucideIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface ErrorStateProps {
  icon: LucideIcon;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  fullScreen?: boolean;
  customAction?: ReactNode;
  isRetrying?: boolean;
}

const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      icon: Icon,
      title = "Error de conexión",
      description = "No pudimos cargar los datos. Revisa tu conexión.",
      onRetry,
      retryLabel = "Reintentar",
      fullScreen = false,
      customAction,
      isRetrying = false,
    },
    ref
  ) => {
    const content = (
      <div ref={!fullScreen ? ref : undefined} className="text-center py-16 animate-fade-up">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="w-full h-full rounded-full bg-destructive/20 flex items-center justify-center">
            <Icon className="w-8 h-8 text-destructive" />
          </div>
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="font-body text-sm text-muted-foreground max-w-[240px] mx-auto leading-relaxed mb-6">
          {description}
        </p>
        {customAction ? customAction : onRetry && (
          <Button variant="kiki-soft" onClick={onRetry} disabled={isRetrying}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Cargando..." : retryLabel}
          </Button>
        )}
      </div>
    );

    if (fullScreen) {
      return (
        <main ref={ref} className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
          {content}
        </main>
      );
    }

    return content;
  }
);

ErrorState.displayName = "ErrorState";

export default ErrorState;
