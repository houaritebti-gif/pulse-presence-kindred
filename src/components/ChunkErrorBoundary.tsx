import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  isRetrying: boolean;
}

/**
 * Error boundary specifically for handling chunk loading failures.
 * Shows a user-friendly modal with a reload button.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false, isRetrying: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isChunkError = 
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Loading CSS chunk') ||
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Failed to fetch');
    
    return { hasError: true, isChunkError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ChunkErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = async () => {
    this.setState({ isRetrying: true });
    
    // Clear any cached modules
    if ('caches' in window) {
      try {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      } catch (e) {
        console.error('Error clearing caches:', e);
      }
    }
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { isChunkError, isRetrying } = this.state;
      
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/50">
          {/* Animated background pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          {/* Modal card */}
          <div className="relative bg-card border border-border/50 rounded-3xl shadow-2xl shadow-foreground/10 p-8 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-300">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                isChunkError 
                  ? 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30' 
                  : 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30'
              }`}>
                {isChunkError ? (
                  <WifiOff className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                ) : (
                  <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="text-center space-y-3 mb-8">
              <h2 className="text-2xl font-bold text-foreground">
                {isChunkError ? '¡Ups! Sin conexión' : 'Algo salió mal'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isChunkError 
                  ? 'La página no se pudo cargar. Revisa tu conexión a internet e inténtalo de nuevo.'
                  : 'Ocurrió un error inesperado. Por favor, recarga la aplicación.'}
              </p>
            </div>
            
            {/* Primary action */}
            <Button 
              onClick={this.handleReload}
              disabled={isRetrying}
              className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Recargando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Reintentar
                </>
              )}
            </Button>
            
            {/* Help text */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-xs text-center text-muted-foreground leading-relaxed">
                {isChunkError ? (
                  <>
                    💡 <span className="font-medium">Consejo:</span> Si el problema persiste, cierra la app completamente y vuelve a abrirla.
                  </>
                ) : (
                  <>
                    Si el error continúa, intenta cerrar y abrir la aplicación.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
