import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, TrendingUp, TrendingDown, Trash2, RefreshCw, 
  AlertTriangle, CheckCircle2, Clock, Gauge, Zap, Monitor,
  Bell, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  getLocalStorageMetrics, 
  getPerformanceSummary, 
  clearStoredMetrics 
} from "@/utils/webVitals";
import { supabase } from "@/integrations/supabase/client";

interface VitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp?: string;
  url?: string;
}

interface MetricSummary {
  latest: VitalsMetric | null;
  average: number;
  count: number;
}

const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25, unit: '', description: 'Cumulative Layout Shift' },
  FCP: { good: 1800, poor: 3000, unit: 'ms', description: 'First Contentful Paint' },
  INP: { good: 200, poor: 500, unit: 'ms', description: 'Interaction to Next Paint' },
  LCP: { good: 2500, poor: 4000, unit: 'ms', description: 'Largest Contentful Paint' },
  TTFB: { good: 800, poor: 1800, unit: 'ms', description: 'Time to First Byte' },
};

const getRatingColor = (rating: string) => {
  switch (rating) {
    case 'good': return 'text-emerald-500';
    case 'needs-improvement': return 'text-yellow-500';
    case 'poor': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
};

const getRatingBg = (rating: string) => {
  switch (rating) {
    case 'good': return 'bg-emerald-500/10 border-emerald-500/30';
    case 'needs-improvement': return 'bg-yellow-500/10 border-yellow-500/30';
    case 'poor': return 'bg-red-500/10 border-red-500/30';
    default: return 'bg-muted';
  }
};

const getRatingIcon = (rating: string) => {
  switch (rating) {
    case 'good': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'needs-improvement': return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'poor': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const formatValue = (name: string, value: number) => {
  if (name === 'CLS') return value.toFixed(3);
  return `${Math.round(value)}ms`;
};

const getProgressValue = (name: string, value: number): number => {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 50;
  
  // Scale: 0 = good threshold, 100 = poor threshold
  const range = threshold.poor - threshold.good;
  const normalized = Math.min(100, Math.max(0, ((value - threshold.good) / range) * 100));
  return normalized;
};

const ALERT_SETTINGS_KEY = 'web-vitals-alert-settings';

interface AlertSettings {
  enabled: boolean;
  email: string;
  thresholds: {
    LCP: number;
    FCP: number;
    CLS: number;
    INP: number;
    TTFB: number;
  };
}

const defaultAlertSettings: AlertSettings = {
  enabled: false,
  email: '',
  thresholds: {
    LCP: 4000,
    FCP: 3000,
    CLS: 0.25,
    INP: 500,
    TTFB: 1800,
  },
};

const AdminWebVitalsPanel = () => {
  const [summary, setSummary] = useState<Record<string, MetricSummary>>({});
  const [recentMetrics, setRecentMetrics] = useState<Array<VitalsMetric & { timestamp: string; url: string }>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(() => {
    try {
      const stored = localStorage.getItem(ALERT_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : defaultAlertSettings;
    } catch {
      return defaultAlertSettings;
    }
  });
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);

  const loadMetrics = useCallback(() => {
    const summaryData = getPerformanceSummary() as unknown as Record<string, MetricSummary>;
    setSummary(summaryData);
    
    const metrics = getLocalStorageMetrics();
    setRecentMetrics(metrics.slice(-20).reverse());
  }, []);

  useEffect(() => {
    loadMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  useEffect(() => {
    localStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(alertSettings));
  }, [alertSettings]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMetrics();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Métricas actualizadas");
    }, 500);
  };

  const handleClearMetrics = () => {
    clearStoredMetrics();
    setSummary({});
    setRecentMetrics([]);
    toast.success("Historial de métricas eliminado");
  };

  const handleSendTestAlert = async () => {
    if (!alertSettings.email) {
      toast.error("Configura un email primero");
      return;
    }

    setIsSendingTestAlert(true);
    try {
      const { error } = await supabase.functions.invoke('performance-alert', {
        body: {
          test: true,
          email: alertSettings.email,
          metrics: summary,
          thresholds: alertSettings.thresholds,
        },
      });

      if (error) throw error;
      toast.success("Email de prueba enviado");
    } catch (error) {
      console.error('Error sending test alert:', error);
      toast.error("Error al enviar email de prueba");
    } finally {
      setIsSendingTestAlert(false);
    }
  };

  const overallScore = Object.entries(summary).reduce((acc, [name, data]) => {
    if (!data.latest) return acc;
    const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
    if (!threshold) return acc;
    
    if (data.latest.rating === 'good') return acc + 1;
    if (data.latest.rating === 'needs-improvement') return acc + 0.5;
    return acc;
  }, 0);

  const maxScore = Object.keys(THRESHOLDS).length;
  const scorePercentage = Math.round((overallScore / maxScore) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Web Vitals en Tiempo Real
          </h3>
          <p className="text-sm text-muted-foreground">
            Monitoreo de rendimiento de la aplicación
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearMetrics}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Puntuación General</p>
              <p className={`text-4xl font-bold ${scorePercentage >= 80 ? 'text-emerald-500' : scorePercentage >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                {scorePercentage}%
              </p>
            </div>
            <div className={`p-4 rounded-full ${scorePercentage >= 80 ? 'bg-emerald-500/10' : scorePercentage >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
              {scorePercentage >= 80 ? (
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              ) : scorePercentage >= 50 ? (
                <Activity className="w-8 h-8 text-yellow-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
            </div>
          </div>
          <Progress 
            value={scorePercentage} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Basado en {Object.values(summary).filter(s => s.latest).length} métricas Core Web Vitals
          </p>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(THRESHOLDS).map(([name, threshold]) => {
          const data = summary[name];
          const latest = data?.latest;
          
          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`border-2 ${latest ? getRatingBg(latest.rating) : 'border-border'}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{name}</CardTitle>
                    {latest && getRatingIcon(latest.rating)}
                  </div>
                  <CardDescription className="text-xs">
                    {threshold.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {latest ? (
                    <>
                      <p className={`text-2xl font-bold ${getRatingColor(latest.rating)}`}>
                        {formatValue(name, latest.value)}
                      </p>
                      <Progress 
                        value={getProgressValue(name, latest.value)} 
                        className="h-1.5 mt-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Bueno: &lt;{threshold.good}{threshold.unit}</span>
                        <span>Pobre: &gt;{threshold.poor}{threshold.unit}</span>
                      </div>
                      {data.count > 1 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Promedio: {formatValue(name, data.average)} ({data.count} muestras)
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin datos</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Alert Configuration */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alertas por Email
          </CardTitle>
          <CardDescription>
            Recibe notificaciones cuando el rendimiento caiga por debajo de los umbrales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="alerts-enabled" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Alertas activadas
            </Label>
            <Switch
              id="alerts-enabled"
              checked={alertSettings.enabled}
              onCheckedChange={(checked) => 
                setAlertSettings(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="alert-email">Email para alertas</Label>
            <Input
              id="alert-email"
              type="email"
              placeholder="admin@ejemplo.com"
              value={alertSettings.email}
              onChange={(e) => 
                setAlertSettings(prev => ({ ...prev, email: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(alertSettings.thresholds).map(([metric, value]) => (
              <div key={metric} className="space-y-1">
                <Label htmlFor={`threshold-${metric}`} className="text-xs">
                  {metric} (umbral)
                </Label>
                <Input
                  id={`threshold-${metric}`}
                  type="number"
                  step={metric === 'CLS' ? '0.01' : '100'}
                  value={value}
                  onChange={(e) => 
                    setAlertSettings(prev => ({
                      ...prev,
                      thresholds: {
                        ...prev.thresholds,
                        [metric]: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSendTestAlert}
            disabled={!alertSettings.email || isSendingTestAlert}
          >
            {isSendingTestAlert ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-1" />
                Enviar alerta de prueba
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Metrics */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Métricas Recientes
          </CardTitle>
          <CardDescription>
            Últimas {recentMetrics.length} mediciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentMetrics.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay métricas registradas. Navega por la app para generar datos.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {recentMetrics.map((metric, i) => (
                  <motion.div
                    key={`${metric.timestamp}-${metric.name}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`flex items-center justify-between p-2 rounded-lg ${getRatingBg(metric.rating)}`}
                  >
                    <div className="flex items-center gap-2">
                      {getRatingIcon(metric.rating)}
                      <span className="font-medium text-sm">{metric.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {metric.url}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm ${getRatingColor(metric.rating)}`}>
                        {formatValue(metric.name, metric.value)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(metric.timestamp).toLocaleTimeString('es-ES')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWebVitalsPanel;
