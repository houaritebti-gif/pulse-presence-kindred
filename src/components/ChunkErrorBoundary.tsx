import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff, AlertTriangle, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  isRetrying: boolean;
  retryCount: number;
}

const MAX_AUTO_RETRIES = 2;

/**
 * Error boundary specifically for handling chunk loading failures.
 * Shows a user-friendly modal with retry options.
 * Auto-retries a few times before showing the modal.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      isChunkError: false, 
      isRetrying: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const message = error.message.toLowerCase();
    const isChunkError = 
      message.includes('failed to fetch dynamically imported module') ||
      message.includes('loading chunk') ||
      message.includes('loading css chunk') ||
      message.includes('chunkloaderror') ||
      message.includes('failed to fetch') ||
      message.includes('network error') ||
      message.includes('load failed');
    
    return { hasError: true, isChunkError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ChunkErrorBoundary] Caught error:', error, errorInfo);
    
    // Auto-retry for chunk errors
    if (this.state.isChunkError && this.state.retryCount < MAX_AUTO_RETRIES) {
      this.scheduleAutoRetry();
    }
  }
  
  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }
  
  scheduleAutoRetry = () => {
    const delay = 1000 * Math.pow(2, this.state.retryCount); // 1s, 2s, 4s...
    
    this.setState({ isRetrying: true });
    
    this.retryTimeoutId = setTimeout(() => {
      this.setState(prev => ({
        hasError: false,
        isRetrying: false,
        retryCount: prev.retryCount + 1
      }));
    }, delay);
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      isRetrying: true,
      retryCount: 0
    });
    
    // Brief delay to show loading state, then reset
    setTimeout(() => {
      this.setState({ isRetrying: false });
    }, 300);
  };

  handleReload = async () => {
    this.setState({ isRetrying: true });
    
    // Clear cached modules
    if ('caches' in window) {
      try {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      } catch (e) {
        console.error('Error clearing caches:', e);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    window.location.reload();
  };
  
  handleGoBack = () => {
    window.history.back();
  };

  render() {
    // Auto-retrying state - show minimal loading
    if (this.state.isRetrying && this.state.retryCount < MAX_AUTO_RETRIES) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Reconectando...</p>
          </div>
        </div>
      );
    }
    
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
                {isChunkError ? 'Problema de conexión' : 'Algo salió mal'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isChunkError 
                  ? 'No se pudo cargar la página. Revisa tu conexión a internet.'
                  : 'Ocurrió un error inesperado.'}
              </p>
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
              {/* Primary: Try without reload first */}
              <Button 
                onClick={this.handleRetry}
                disabled={isRetrying}
                className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                size="lg"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                Reintentar
              </Button>
              
              {/* Secondary options */}
              <div className="flex gap-3">
                <Button 
                  onClick={this.handleGoBack}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  disabled={isRetrying}
                  className="flex-1 h-12 rounded-xl"
                >
                  Recargar app
                </Button>
              </div>
            </div>
            
            {/* Help text */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-xs text-center text-muted-foreground leading-relaxed">
                💡 Si el problema persiste, cierra la app y vuelve a abrirla.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
