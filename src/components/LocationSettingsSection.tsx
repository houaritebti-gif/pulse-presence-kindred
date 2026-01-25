import { MapPin, RefreshCw, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGeolocation, formatDistance } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function LocationSettingsSection() {
  const {
    latitude,
    longitude,
    shareLocation,
    locationUpdatedAt,
    loading,
    error,
    permissionState,
    updateLocation,
    clearLocation,
    toggleShareLocation,
    hasLocation,
    isSupported,
  } = useGeolocation();

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-foreground/10 bg-card p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Tu navegador no soporta geolocalización.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Ubicación</h3>
        </div>
        
        {hasLocation && (
          <div className="flex items-center gap-2">
            <Label htmlFor="share-location" className="text-sm text-muted-foreground">
              {shareLocation ? 'Visible' : 'Oculta'}
            </Label>
            <Switch
              id="share-location"
              checked={shareLocation}
              onCheckedChange={toggleShareLocation}
              disabled={loading}
            />
          </div>
        )}
      </div>

      {permissionState === 'denied' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>
            Permiso de ubicación denegado. Habilítalo en la configuración de tu navegador.
          </p>
        </div>
      )}

      {error && !permissionState && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {hasLocation ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              Ubicación guardada
              {locationUpdatedAt && (
                <> · Actualizada {format(new Date(locationUpdatedAt), "d 'de' MMM, HH:mm", { locale: es })}</>
              )}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {shareLocation ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Otros usuarios pueden ver tu distancia aproximada</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Tu ubicación está oculta para otros usuarios</span>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateLocation(shareLocation)}
              disabled={loading}
              className="flex-1"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Actualizar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLocation}
              disabled={loading}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Comparte tu ubicación aproximada para ver quién está cerca de ti.
            Tu ubicación exacta nunca se muestra, solo una distancia aproximada.
          </p>
          
          <Button
            onClick={() => updateLocation(true)}
            disabled={loading || permissionState === 'denied'}
            className="w-full"
          >
            <MapPin className={cn("w-4 h-4 mr-2", loading && "animate-pulse")} />
            {loading ? 'Obteniendo ubicación...' : 'Activar ubicación'}
          </Button>
        </div>
      )}
    </div>
  );
}
