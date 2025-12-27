import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone, Share, Plus, MoreVertical, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const dayInMs = 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < dayInMs * 7) {
        setDismissed(true);
      }
    }

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!standalone && !dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show iOS prompt after delay
    if (iOS && !standalone && !dismissed) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  if (isStandalone || dismissed) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">
                    Instalar KIKI
                  </h3>
                  <p className="text-sm text-muted-foreground font-body">
                    Acceso rápido desde tu pantalla
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              /* iOS Instructions */
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground font-body mb-3">
                  Sigue estos pasos para instalar:
                </p>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    1
                  </div>
                  <div className="flex items-center gap-2 text-sm font-body">
                    <span>Pulsa</span>
                    <Share className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">Compartir</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    2
                  </div>
                  <div className="flex items-center gap-2 text-sm font-body">
                    <span>Desplázate y pulsa</span>
                    <Plus className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">Añadir a inicio</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    3
                  </div>
                  <div className="text-sm font-body">
                    <span>Confirma pulsando </span>
                    <span className="text-foreground font-medium">Añadir</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={handleDismiss}
                >
                  Entendido
                </Button>
              </div>
            ) : (
              /* Android/Chrome Instructions or Direct Install */
              <div className="space-y-3">
                {deferredPrompt ? (
                  <Button
                    className="w-full"
                    onClick={handleInstall}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Instalar ahora
                  </Button>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground font-body mb-3">
                      Sigue estos pasos para instalar:
                    </p>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        1
                      </div>
                      <div className="flex items-center gap-2 text-sm font-body">
                        <span>Pulsa</span>
                        <MoreVertical className="w-5 h-5 text-primary" />
                        <span className="text-foreground font-medium">Menú</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        2
                      </div>
                      <div className="flex items-center gap-2 text-sm font-body">
                        <Chrome className="w-5 h-5 text-primary" />
                        <span className="text-foreground font-medium">Instalar app</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={handleDismiss}
                    >
                      Entendido
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
