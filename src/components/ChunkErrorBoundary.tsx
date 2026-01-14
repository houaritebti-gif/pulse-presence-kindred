import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

/**
 * Error boundary specifically for handling chunk loading failures.
 * Shows a user-friendly message with a reload button.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError = 
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Loading CSS chunk') ||
      error.message.includes('ChunkLoadError');
    
    return { hasError: true, isChunkError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ChunkErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    // Clear any cached modules
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="text-center space-y-6 max-w-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <WifiOff className="w-8 h-8 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Error de carga
                </h2>
                <p className="text-muted-foreground text-sm">
                  No se pudo cargar la página. Esto puede ocurrir por una conexión lenta o una actualización de la app.
                </p>
              </div>
              
              <Button 
                onClick={this.handleReload}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar app
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Si el problema persiste, cierra la app completamente y vuelve a abrirla.
              </p>
            </div>
          </div>
        );
      }
      
      // Generic error fallback
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Algo salió mal
            </h2>
            <Button onClick={this.handleReload}>
              Reintentar
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
