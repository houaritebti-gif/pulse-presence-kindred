import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Bell, Send, Zap, Clock, CheckCircle2, XCircle, 
  AlertTriangle, RefreshCw, Activity, Shield, 
  Loader2, Play, Trash2, BarChart3, Download, Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfHour, eachHourOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TestLog {
  id: string;
  timestamp: Date;
  type: 'in-app' | 'push' | 'rate-limit' | 'rotation';
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

interface RotationInfo {
  current_secret: string;
  previous_secret: string | null;
  rotated_at: string;
  next_rotation_at: string;
}

interface RateLimitInfo {
  profile_id: string;
  window_start: string;
  request_count: number;
}

interface RateLimitChartData {
  hour: string;
  requests: number;
  date: Date;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const AdminNotificationTestCenter = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [notificationTitle, setNotificationTitle] = useState("🔔 Test de notificación");
  const [notificationBody, setNotificationBody] = useState("Este es un mensaje de prueba desde el centro de testing.");
  const [notificationType, setNotificationType] = useState<string>("connection_request");
const [rotationInfo, setRotationInfo] = useState<RotationInfo | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo[]>([]);
  const [rateLimitChartData, setRateLimitChartData] = useState<RateLimitChartData[]>([]);

  const addLog = (log: Omit<TestLog, 'id' | 'timestamp'>) => {
    setLogs(prev => [{
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }, ...prev].slice(0, 50));
  };

  const clearLogs = () => {
    setLogs([]);
    toast.success("Logs limpiados");
  };

  // Test in-app notification
  const testInAppNotification = async () => {
    setIsLoading('in-app');
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) {
        throw new Error('No se encontró el perfil');
      }

      const { error } = await supabase.from('notifications').insert({
        profile_id: profile.id,
        type: notificationType,
        title: notificationTitle,
        description: notificationBody,
        link: '/admin',
      });

      if (error) throw error;

      addLog({
        type: 'in-app',
        status: 'success',
        message: 'Notificación in-app creada correctamente',
        details: `Tipo: ${notificationType}, Título: ${notificationTitle}`,
      });
      toast.success("Notificación in-app enviada");
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      addLog({
        type: 'in-app',
        status: 'error',
        message: 'Error al crear notificación in-app',
        details: message,
      });
      toast.error(message);
    } finally {
      setIsLoading(null);
    }
  };

  // Test push notification
  const testPushNotification = async () => {
    setIsLoading('push');
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) {
        throw new Error('No se encontró el perfil');
      }

      // Check if user has push subscriptions
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('profile_id', profile.id);

      if (!subscriptions || subscriptions.length === 0) {
        addLog({
          type: 'push',
          status: 'warning',
          message: 'No hay suscripciones push activas',
          details: 'Activa las notificaciones push en tu perfil primero',
        });
        toast.warning("No tienes suscripciones push activas");
        return;
      }

      // Create a connection request to trigger the push notification via trigger
      // Instead, we'll call the edge function directly for testing
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          profile_id: profile.id,
          title: notificationTitle,
          body: notificationBody,
          url: '/admin',
          tag: 'admin-test',
          test_mode: true,
        },
      });

      if (error) throw error;

      addLog({
        type: 'push',
        status: data?.sent ? 'success' : 'warning',
        message: data?.sent ? 'Push notification enviada' : 'Push procesado pero no enviado',
        details: `Suscripciones: ${subscriptions.length}, Resultado: ${JSON.stringify(data)}`,
      });
      
      if (data?.sent) {
        toast.success("Push notification enviada");
      } else {
        toast.info("Push procesado, revisa los logs");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      addLog({
        type: 'push',
        status: 'error',
        message: 'Error al enviar push notification',
        details: message,
      });
      toast.error(message);
    } finally {
      setIsLoading(null);
    }
  };

  // Fetch rotation info
  const fetchRotationInfo = async () => {
    setIsLoading('rotation');
    try {
      const { data, error } = await supabase
        .from('internal_secrets_rotation')
        .select('*')
        .eq('secret_name', 'trigger_internal_secret')
        .single();

      if (error) throw error;

      setRotationInfo({
        current_secret: data.current_secret.substring(0, 25) + '...',
        previous_secret: data.previous_secret ? data.previous_secret.substring(0, 25) + '...' : null,
        rotated_at: data.rotated_at,
        next_rotation_at: data.next_rotation_at,
      });

      addLog({
        type: 'rotation',
        status: 'success',
        message: 'Info de rotación obtenida',
        details: `Próxima rotación: ${format(new Date(data.next_rotation_at), 'dd MMM yyyy HH:mm', { locale: es })}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo obtener info de rotación';
      addLog({
        type: 'rotation',
        status: 'error',
        message: 'Error al obtener info de rotación',
        details: message,
      });
      // This is expected for non-service_role users
      toast.info("Info de rotación no accesible (solo service_role)");
    } finally {
      setIsLoading(null);
    }
  };

  // Fetch rate limit info
  const fetchRateLimitInfo = async () => {
    setIsLoading('rate-limit');
    try {
      const { data, error } = await supabase
        .from('push_rate_limits')
        .select('*')
        .order('window_start', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRateLimitInfo(data || []);

      addLog({
        type: 'rate-limit',
        status: 'success',
        message: `${data?.length || 0} registros de rate limit encontrados`,
        details: data?.length ? `Último: ${data[0].request_count} requests` : 'Sin registros recientes',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo obtener rate limits';
      addLog({
        type: 'rate-limit',
        status: 'error',
        message: 'Error al obtener rate limits',
        details: message,
      });
      toast.info("Rate limits no accesibles (solo service_role)");
    } finally {
      setIsLoading(null);
    }
  };

  // Fetch rate limit chart data for the last 7 days
  const fetchRateLimitChartData = async () => {
    setIsLoading('chart');
    try {
      const sevenDaysAgo = subDays(new Date(), 7);
      
      const { data, error } = await supabase
        .from('push_rate_limits')
        .select('window_start, request_count')
        .gte('window_start', sevenDaysAgo.toISOString())
        .order('window_start', { ascending: true });

      if (error) throw error;

      // Group by hour
      const hourlyData = new Map<string, number>();
      const hours = eachHourOfInterval({
        start: sevenDaysAgo,
        end: new Date(),
      });

      // Initialize all hours with 0
      hours.forEach(hour => {
        const key = format(hour, 'yyyy-MM-dd HH:00');
        hourlyData.set(key, 0);
      });

      // Aggregate actual data
      (data || []).forEach(record => {
        const hourKey = format(new Date(record.window_start), 'yyyy-MM-dd HH:00');
        const current = hourlyData.get(hourKey) || 0;
        hourlyData.set(hourKey, current + record.request_count);
      });

      // Convert to chart data - sample every 4 hours for readability
      const chartData: RateLimitChartData[] = [];
      let counter = 0;
      hourlyData.forEach((requests, hour) => {
        if (counter % 4 === 0) {
          const date = new Date(hour);
          chartData.push({
            hour: format(date, 'dd/MM HH:mm'),
            requests,
            date,
          });
        }
        counter++;
      });

      setRateLimitChartData(chartData);

      addLog({
        type: 'rate-limit',
        status: 'success',
        message: 'Datos del gráfico cargados',
        details: `${chartData.length} puntos de datos de los últimos 7 días`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo obtener datos';
      addLog({
        type: 'rate-limit',
        status: 'error',
        message: 'Error al cargar gráfico',
        details: message,
      });
      toast.info("Datos de rate limit no accesibles");
    } finally {
      setIsLoading(null);
    }
  };

  // Fetch rotation logs
  const fetchRotationLogs = async () => {
    setIsLoading('logs');
    try {
      const { data, error } = await supabase
        .from('secrets_rotation_log')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      (data || []).forEach(log => {
        addLog({
          type: 'rotation',
          status: log.action.includes('failed') ? 'error' : 'success',
          message: `[${log.action}] ${log.details || 'Sin detalles'}`,
          details: format(new Date(log.executed_at), 'dd/MM/yyyy HH:mm:ss', { locale: es }),
        });
      });

      toast.success(`${data?.length || 0} logs de rotación cargados`);
    } catch (err) {
      toast.info("Logs de rotación no accesibles (solo service_role)");
    } finally {
      setIsLoading(null);
    }
  };

  // Export logs to CSV
  const exportLogsToCSV = () => {
    if (logs.length === 0) {
      toast.warning("No hay logs para exportar");
      return;
    }

    const headers = ['Timestamp', 'Type', 'Status', 'Message', 'Details'];
    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const row = [
        format(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        log.type,
        log.status,
        `"${log.message.replace(/"/g, '""')}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kiki-test-logs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addLog({
      type: 'in-app',
      status: 'success',
      message: 'Logs exportados a CSV',
      details: `${logs.length} registros exportados`,
    });
    toast.success("Logs exportados correctamente");
  };

  // Simulate rate limit exceeded
  const simulateRateLimitExceeded = async () => {
    setIsLoading('simulate-rate');
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) {
        throw new Error('No se encontró el perfil');
      }

      // Send multiple push requests rapidly to trigger rate limit
      const results: Array<{ success: boolean; error?: string }> = [];
      
      for (let i = 0; i < 35; i++) {
        try {
          const { data, error } = await supabase.functions.invoke('send-push-notification', {
            body: {
              profile_id: profile.id,
              title: `Rate Limit Test #${i + 1}`,
              body: 'Testing rate limit behavior',
              url: '/admin',
              tag: 'rate-limit-test',
              test_mode: true,
            },
          });

          if (error) {
            results.push({ success: false, error: error.message });
            // If we get rate limited, log it and stop
            if (error.message.includes('rate limit') || error.message.includes('429')) {
              addLog({
                type: 'rate-limit',
                status: 'warning',
                message: `Rate limit alcanzado en request #${i + 1}`,
                details: error.message,
              });
              toast.warning(`Rate limit alcanzado después de ${i + 1} requests`);
              break;
            }
          } else {
            results.push({ success: true });
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Error';
          results.push({ success: false, error: errMsg });
          if (errMsg.includes('rate limit') || errMsg.includes('429')) {
            addLog({
              type: 'rate-limit',
              status: 'warning',
              message: `Rate limit alcanzado en request #${i + 1}`,
              details: errMsg,
            });
            toast.warning(`Rate limit alcanzado después de ${i + 1} requests`);
            break;
          }
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      addLog({
        type: 'rate-limit',
        status: failCount > 0 ? 'warning' : 'success',
        message: `Simulación completada: ${successCount} exitosos, ${failCount} bloqueados`,
        details: `Total de requests enviados: ${results.length}`,
      });

      // Refresh rate limit info after simulation
      await fetchRateLimitInfo();
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en simulación';
      addLog({
        type: 'rate-limit',
        status: 'error',
        message: 'Error al simular rate limit',
        details: message,
      });
      toast.error(message);
    } finally {
      setIsLoading(null);
    }
  };

  const getStatusIcon = (status: TestLog['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getTypeIcon = (type: TestLog['type']) => {
    switch (type) {
      case 'in-app': return <Bell className="w-4 h-4" />;
      case 'push': return <Send className="w-4 h-4" />;
      case 'rate-limit': return <Zap className="w-4 h-4" />;
      case 'rotation': return <RefreshCw className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Centro de Pruebas de Notificaciones
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Prueba el sistema de notificaciones y monitorea la seguridad
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportLogsToCSV} 
            disabled={logs.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={clearLogs} disabled={logs.length === 0}>
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar logs
          </Button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Test Notifications */}
        <motion.div variants={itemVariants}>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Probar Notificaciones
              </CardTitle>
              <CardDescription>
                Envía notificaciones de prueba a tu propio perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de notificación</label>
                <Select value={notificationType} onValueChange={setNotificationType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="connection_request">Solicitud de conexión</SelectItem>
                    <SelectItem value="connection_accepted">Conexión aceptada</SelectItem>
                    <SelectItem value="profile_visit">Visita al perfil</SelectItem>
                    <SelectItem value="premium_ghost_message">Mensaje especial</SelectItem>
                    <SelectItem value="new_message">Nuevo mensaje</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input 
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Título de la notificación"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea 
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  placeholder="Contenido del mensaje"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={testInAppNotification}
                  disabled={isLoading === 'in-app'}
                  className="flex-1"
                >
                  {isLoading === 'in-app' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2" />
                  )}
                  In-App
                </Button>
                <Button 
                  onClick={testPushNotification}
                  disabled={isLoading === 'push'}
                  variant="secondary"
                  className="flex-1"
                >
                  {isLoading === 'push' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Push
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Monitoring */}
        <motion.div variants={itemVariants}>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Monitoreo de Seguridad
              </CardTitle>
              <CardDescription>
                Verifica el estado del sistema de rotación y rate limiting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={fetchRotationInfo}
                  disabled={isLoading === 'rotation'}
                  variant="outline"
                  size="sm"
                >
                  {isLoading === 'rotation' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Ver rotación
                </Button>
                <Button 
                  onClick={fetchRateLimitInfo}
                  disabled={isLoading === 'rate-limit'}
                  variant="outline"
                  size="sm"
                >
                  {isLoading === 'rate-limit' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Rate limits
                </Button>
                <Button 
                  onClick={fetchRotationLogs}
                  disabled={isLoading === 'logs'}
                  variant="outline"
                  size="sm"
                >
                  {isLoading === 'logs' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4 mr-2" />
                  )}
                  Logs de rotación
                </Button>
                <Button 
                  onClick={simulateRateLimitExceeded}
                  disabled={isLoading === 'simulate-rate'}
                  variant="destructive"
                  size="sm"
                >
                  {isLoading === 'simulate-rate' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4 mr-2" />
                  )}
                  Simular Rate Limit
                </Button>
              </div>

              {rotationInfo && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Secreto actual:</span>
                    <code className="text-xs bg-background px-2 py-0.5 rounded">
                      {rotationInfo.current_secret}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última rotación:</span>
                    <span>{format(new Date(rotationInfo.rotated_at), 'dd/MM/yy HH:mm')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Próxima rotación:</span>
                    <span className="text-primary font-medium">
                      {format(new Date(rotationInfo.next_rotation_at), 'dd MMM yyyy')}
                    </span>
                  </div>
                </div>
              )}

              {rateLimitInfo.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
                  <p className="font-medium mb-2">Rate limits recientes:</p>
                  {rateLimitInfo.slice(0, 3).map((rl, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[120px]">
                        {rl.profile_id.substring(0, 8)}...
                      </span>
                      <Badge variant={rl.request_count > 20 ? "destructive" : "secondary"}>
                        {rl.request_count}/30
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Rate Limit Chart */}
      <motion.div variants={itemVariants}>
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Rate Limiting - Últimos 7 días
            </CardTitle>
            <CardDescription>
              Solicitudes de push notifications por hora
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button 
                onClick={fetchRateLimitChartData}
                disabled={isLoading === 'chart'}
                variant="outline"
                size="sm"
              >
                {isLoading === 'chart' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Cargar datos
              </Button>
            </div>
            {rateLimitChartData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rateLimitChartData}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRequests)"
                      name="Requests"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <BarChart3 className="w-10 h-10 mb-3 opacity-50" />
                <p>Haz clic en "Cargar datos" para ver el gráfico</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Logs */}
      <motion.div variants={itemVariants}>
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Logs de actividad
              {logs.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {logs.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                  <Activity className="w-10 h-10 mb-3 opacity-50" />
                  <p>No hay logs aún</p>
                  <p className="text-sm">Ejecuta una prueba para ver los resultados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div 
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className="flex items-center gap-2 mt-0.5">
                        {getStatusIcon(log.status)}
                        {getTypeIcon(log.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{log.message}</p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {log.details}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(log.timestamp, 'HH:mm:ss')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminNotificationTestCenter;
