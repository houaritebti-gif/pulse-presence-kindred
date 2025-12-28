import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Cookie, Settings, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = 'kiki-cookie-consent';
const COOKIE_PREFERENCES_KEY = 'kiki-cookie-preferences';

const defaultPreferences: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    } else {
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(allAccepted);
  };

  const rejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    saveConsent(onlyNecessary);
  };

  const saveCustomPreferences = () => {
    saveConsent(preferences);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Can't disable necessary cookies
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
          >
            <div className="mx-auto max-w-4xl">
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl">
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                
                <div className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10">
                      <Cookie className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          🍪 Usamos cookies
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar el contenido. 
                          Puedes aceptar todas, rechazarlas o personalizar tus preferencias.{' '}
                          <Link 
                            to="/cookies" 
                            className="text-primary hover:underline font-medium"
                          >
                            Más información
                          </Link>
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={acceptAll}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Aceptar todas
                        </Button>
                        <Button
                          onClick={rejectAll}
                          variant="outline"
                          className="border-border/50 hover:bg-muted"
                        >
                          Solo necesarias
                        </Button>
                        <Button
                          onClick={() => setShowSettings(true)}
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Personalizar
                        </Button>
                      </div>
                    </div>
                    
                    <button
                      onClick={rejectAll}
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
                      aria-label="Cerrar"
                    >
                      <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              Preferencias de cookies
            </DialogTitle>
            <DialogDescription>
              Personaliza qué tipos de cookies deseas permitir. Las cookies necesarias no se pueden desactivar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Necesarias</Label>
                <p className="text-sm text-muted-foreground">
                  Esenciales para el funcionamiento del sitio. No se pueden desactivar.
                </p>
              </div>
              <Switch checked={true} disabled className="data-[state=checked]:bg-primary" />
            </div>
            
            {/* Functional Cookies */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Funcionales</Label>
                <p className="text-sm text-muted-foreground">
                  Permiten recordar tus preferencias y personalizar tu experiencia.
                </p>
              </div>
              <Switch 
                checked={preferences.functional}
                onCheckedChange={() => togglePreference('functional')}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            
            {/* Analytics Cookies */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Analíticas</Label>
                <p className="text-sm text-muted-foreground">
                  Nos ayudan a entender cómo usas el sitio para mejorarlo.
                </p>
              </div>
              <Switch 
                checked={preferences.analytics}
                onCheckedChange={() => togglePreference('analytics')}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            
            {/* Marketing Cookies */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Marketing</Label>
                <p className="text-sm text-muted-foreground">
                  Utilizadas para mostrarte anuncios relevantes.
                </p>
              </div>
              <Switch 
                checked={preferences.marketing}
                onCheckedChange={() => togglePreference('marketing')}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={rejectAll}
              variant="outline"
              className="flex-1"
            >
              Rechazar opcionales
            </Button>
            <Button
              onClick={saveCustomPreferences}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Guardar preferencias
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
