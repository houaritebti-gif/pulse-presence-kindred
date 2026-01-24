import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Bell, Send, Zap, Clock, CheckCircle2, XCircle, 
  AlertTriangle, RefreshCw, Activity, Shield, 
  Loader2, Play, Trash2, BarChart3, Download, Ban,
  Filter, AlertOctagon, Settings2, Mail
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalStorage, STORAGE_KEYS } from "@/hooks/useLocalStorage";
import { format, subDays, startOfHour, eachHourOfInterval, startOfDay, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TestLog {
  id: string;
  timestamp: Date;
  type: 'in-app' | 'push' | 'rate-limit' | 'rotation' | 'alert';
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
  emails: number;
  date: Date;
}

interface RateLimitAlert {
  id: string;
  timestamp: Date;
  profileId: string;
  requestCount: number;
  threshold: number;
}

interface EmailAlertHistory {
  id: string;
  sentAt: Date;
  sentBy?: string;
  recipients: number;
  alertCount: number;
  threshold: number;
  windowMinutes: number;
  status: 'success' | 'error';
  messageId?: string;
  errorMessage?: string;
  isFromRealtime?: boolean;
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

const LOG_TYPES = ['all', 'in-app', 'push', 'rate-limit', 'rotation', 'alert'] as const;
const LOG_STATUSES = ['all', 'success', 'error', 'warning'] as const;

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
  
  // Log filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Rate limit threshold alerts - persisted in localStorage
  const [alertThreshold, setAlertThreshold] = useLocalStorage<number>(STORAGE_KEYS.ADMIN_ALERT_THRESHOLD, 20);
  const [alertsEnabled, setAlertsEnabled] = useLocalStorage<boolean>(STORAGE_KEYS.ADMIN_ALERTS_ENABLED, true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useLocalStorage<boolean>(STORAGE_KEYS.ADMIN_EMAIL_ALERTS_ENABLED, false);
  const [emailAlertCount, setEmailAlertCount] = useLocalStorage<number>(STORAGE_KEYS.ADMIN_EMAIL_ALERT_COUNT, 3);
  const [emailWindowMinutes, setEmailWindowMinutes] = useLocalStorage<number>(STORAGE_KEYS.ADMIN_EMAIL_WINDOW_MINUTES, 5);
  const [rateLimitAlerts, setRateLimitAlerts] = useState<RateLimitAlert[]>([]);
  const [isSendingEmailAlert, setIsSendingEmailAlert] = useState(false);
  const [emailAlertHistory, setEmailAlertHistory] = useState<EmailAlertHistory[]>([]);
  
  // Track alerts for email notification (multiple alerts in short period)
  const alertCountRef = useRef<{ count: number; windowStart: Date }>({ count: 0, windowStart: new Date() });

  const addLog = useCallback((log: Omit<TestLog, 'id' | 'timestamp'>) => {
    setLogs(prev => [{
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }, ...prev].slice(0, 100));
  }, []);
  
  // Load email history from database on mount
  const loadEmailHistoryFromDB = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('email_alert_history')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.log('Could not load email history:', error.message);
        return;
      }
      
      const history: EmailAlertHistory[] = (data || []).map(record => ({
        id: record.id,
        sentAt: new Date(record.sent_at),
        sentBy: record.sent_by || undefined,
        recipients: record.recipients_count,
        alertCount: record.alert_count || 0,
        threshold: record.threshold || 0,
        windowMinutes: record.time_window_minutes || 0,
        status: record.status as 'success' | 'error',
        messageId: record.message_id || undefined,
        errorMessage: record.error_message || undefined,
      }));
      
      setEmailAlertHistory(history);
    } catch (err) {
      console.log('Error loading email history:', err);
    }
  }, []);
  
  // Subscribe to realtime updates for email alert history
  useEffect(() => {
    loadEmailHistoryFromDB();
    
    const channel = supabase
      .channel('email-alert-history-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'email_alert_history',
        },
        (payload) => {
          const record = payload.new as any;
          
          // Check if this was sent by the current user (to avoid duplicates)
          if (record.sent_by === user?.id) {
            // Already added locally, no need to add again
            return;
          }
          
          const newEntry: EmailAlertHistory = {
            id: record.id,
            sentAt: new Date(record.sent_at),
            sentBy: record.sent_by || undefined,
            recipients: record.recipients_count,
            alertCount: record.alert_count || 0,
            threshold: record.threshold || 0,
            windowMinutes: record.time_window_minutes || 0,
            status: record.status as 'success' | 'error',
            messageId: record.message_id || undefined,
            errorMessage: record.error_message || undefined,
            isFromRealtime: true,
          };
          
          setEmailAlertHistory(prev => [newEntry, ...prev].slice(0, 20));
          
          // Show toast for realtime notification from other admin
          toast.info('📧 Otro admin envió un email de alerta', {
            description: `${record.recipients_count} destinatario(s) • ${record.alert_count || 0} alerta(s)`,
          });
          
          addLog({
            type: 'alert',
            status: 'success',
            message: '📧 [Realtime] Email de alerta enviado por otro admin',
            details: `${record.recipients_count} destinatario(s)`,
          });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadEmailHistoryFromDB, addLog]);
  
  // Send email alert to admins
  const sendEmailAlert = useCallback(async (alerts: RateLimitAlert[], isTest: boolean = false) => {
    if (isSendingEmailAlert) return;
    
    setIsSendingEmailAlert(true);
    try {
      const { data, error } = await supabase.functions.invoke('rate-limit-alert-email', {
        body: {
          alertCount: alerts.length,
          threshold: alertThreshold,
          timeWindowMinutes: emailWindowMinutes,
          alerts: alerts.map(a => ({
            profileId: a.profileId,
            requestCount: a.requestCount,
            timestamp: a.timestamp.toISOString(),
          })),
          isTest,
        },
      });

      if (error) throw error;

      // Save to database
      const { error: dbError } = await supabase.from('email_alert_history').insert({
        sent_by: user?.id,
        recipients_count: data?.recipients || 0,
        is_test: isTest,
        status: data?.sent ? 'success' : 'error',
        message_id: data?.messageId || null,
        alert_count: alerts.length,
        threshold: alertThreshold,
        time_window_minutes: emailWindowMinutes,
        error_message: data?.sent ? null : (data?.reason || 'Unknown error'),
      });

      if (dbError) {
        console.log('Could not save email history to DB:', dbError.message);
      }

      const historyEntry: EmailAlertHistory = {
        id: crypto.randomUUID(),
        sentAt: new Date(),
        sentBy: user?.id,
        recipients: data?.recipients || 0,
        alertCount: alerts.length,
        threshold: alertThreshold,
        windowMinutes: emailWindowMinutes,
        status: data?.sent ? 'success' : 'error',
        messageId: data?.messageId,
        errorMessage: data?.sent ? undefined : (data?.reason || 'Unknown error'),
      };
      
      setEmailAlertHistory(prev => [historyEntry, ...prev].slice(0, 20));

      if (data?.sent) {
        addLog({
          type: 'alert',
          status: 'success',
          message: `📧 ${isTest ? '[TEST] ' : ''}Email de alerta enviado a ${data.recipients} admin(s)`,
          details: `ID: ${data.messageId || 'N/A'}`,
        });
        toast.success(isTest ? "Email de prueba enviado" : "Email de alerta enviado a administradores");
      } else {
        addLog({
          type: 'alert',
          status: 'warning',
          message: `📧 Email no enviado: ${data?.reason || 'Razón desconocida'}`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      
      const historyEntry: EmailAlertHistory = {
        id: crypto.randomUUID(),
        sentAt: new Date(),
        recipients: 0,
        alertCount: alerts.length,
        threshold: alertThreshold,
        windowMinutes: emailWindowMinutes,
        status: 'error',
        errorMessage: message,
      };
      setEmailAlertHistory(prev => [historyEntry, ...prev].slice(0, 20));
      
      addLog({
        type: 'alert',
        status: 'error',
        message: '❌ Error al enviar email de alerta',
        details: message,
      });
      console.error("Error sending rate limit alert email:", err);
    } finally {
      setIsSendingEmailAlert(false);
    }
  }, [isSendingEmailAlert, alertThreshold, emailWindowMinutes, addLog]);
  
  // Test email manually
  const sendTestEmailAlert = useCallback(() => {
    const testAlerts: RateLimitAlert[] = [{
      id: crypto.randomUUID(),
      timestamp: new Date(),
      profileId: 'test-profile-' + crypto.randomUUID().substring(0, 8),
      requestCount: alertThreshold + 5,
      threshold: alertThreshold,
    }];
    sendEmailAlert(testAlerts, true);
  }, [alertThreshold, sendEmailAlert]);
  
  // Check for rate limit threshold exceeded
  const checkRateLimitThreshold = useCallback((records: RateLimitInfo[]) => {
    if (!alertsEnabled) return;
    
    const exceededRecords = records.filter(r => r.request_count >= alertThreshold);
    const newAlerts: RateLimitAlert[] = [];
    
    exceededRecords.forEach(record => {
      const existingAlert = rateLimitAlerts.find(
        a => a.profileId === record.profile_id && 
        new Date().getTime() - a.timestamp.getTime() < 60000 // Don't duplicate within 1 min
      );
      
      if (!existingAlert) {
        const newAlert: RateLimitAlert = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          profileId: record.profile_id,
          requestCount: record.request_count,
          threshold: alertThreshold,
        };
        
        newAlerts.push(newAlert);
        
        addLog({
          type: 'alert',
          status: 'warning',
          message: `⚠️ Umbral de rate limit superado: ${record.request_count}/${alertThreshold}`,
          details: `Profile: ${record.profile_id.substring(0, 8)}...`,
        });
        
        toast.warning(`Rate limit excedido: ${record.request_count} requests`, {
          description: `Perfil ${record.profile_id.substring(0, 8)}... superó el umbral de ${alertThreshold}`,
          duration: 5000,
        });
      }
    });
    
    if (newAlerts.length > 0) {
      setRateLimitAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
      
      // Track alerts for email notification
      const now = new Date();
      const windowMs = emailWindowMinutes * 60 * 1000;
      
      // Reset window if expired
      if (now.getTime() - alertCountRef.current.windowStart.getTime() > windowMs) {
        alertCountRef.current = { count: 0, windowStart: now };
      }
      
      alertCountRef.current.count += newAlerts.length;
      
      // Send email if threshold reached
      if (alertCountRef.current.count >= emailAlertCount && emailAlertsEnabled) {
        const recentAlerts = [...newAlerts, ...rateLimitAlerts].slice(0, emailAlertCount);
        sendEmailAlert(recentAlerts);
        alertCountRef.current = { count: 0, windowStart: now }; // Reset after sending
      }
    }
  }, [alertsEnabled, alertThreshold, rateLimitAlerts, addLog, emailAlertsEnabled, sendEmailAlert, emailWindowMinutes, emailAlertCount]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const typeMatch = filterType === 'all' || log.type === filterType;
      const statusMatch = filterStatus === 'all' || log.status === filterStatus;
      return typeMatch && statusMatch;
    });
  }, [logs, filterType, filterStatus]);

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
        .maybeSingle();

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
        .maybeSingle();

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
      
      // Check threshold alerts
      if (data) {
        checkRateLimitThreshold(data);
      }

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

  // Fetch rate limit chart data for the last 7 days with email stats
  const fetchRateLimitChartData = async () => {
    setIsLoading('chart');
    try {
      const sevenDaysAgo = subDays(new Date(), 7);
      
      // Fetch rate limit data
      const { data: rateLimitData, error: rateLimitError } = await supabase
        .from('push_rate_limits')
        .select('window_start, request_count')
        .gte('window_start', sevenDaysAgo.toISOString())
        .order('window_start', { ascending: true });

      if (rateLimitError) throw rateLimitError;

      // Fetch email alert history from database
      const { data: emailData } = await supabase
        .from('email_alert_history')
        .select('*')
        .gte('sent_at', sevenDaysAgo.toISOString())
        .order('sent_at', { ascending: true });

      // Group by hour for rate limits
      const hourlyData = new Map<string, { requests: number; emails: number }>();
      const hours = eachHourOfInterval({
        start: sevenDaysAgo,
        end: new Date(),
      });

      // Initialize all hours with 0
      hours.forEach(hour => {
        const key = format(hour, 'yyyy-MM-dd HH:00');
        hourlyData.set(key, { requests: 0, emails: 0 });
      });

      // Aggregate rate limit data
      (rateLimitData || []).forEach(record => {
        const hourKey = format(new Date(record.window_start), 'yyyy-MM-dd HH:00');
        const current = hourlyData.get(hourKey) || { requests: 0, emails: 0 };
        hourlyData.set(hourKey, { ...current, requests: current.requests + record.request_count });
      });

      // Aggregate email data
      (emailData || []).forEach(record => {
        const hourKey = format(new Date(record.sent_at), 'yyyy-MM-dd HH:00');
        const current = hourlyData.get(hourKey) || { requests: 0, emails: 0 };
        hourlyData.set(hourKey, { ...current, emails: current.emails + 1 });
      });

      // Convert to chart data - sample every 4 hours for readability
      const chartData: RateLimitChartData[] = [];
      let counter = 0;
      hourlyData.forEach((data, hour) => {
        if (counter % 4 === 0) {
          const date = new Date(hour);
          chartData.push({
            hour: format(date, 'dd/MM HH:mm'),
            requests: data.requests,
            emails: data.emails,
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
        details: `${chartData.length} puntos de datos, ${emailData?.length || 0} emails de alerta`,
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
        .maybeSingle();

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
      case 'alert': return <AlertOctagon className="w-4 h-4 text-destructive" />;
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
        
        {/* Alert Configuration */}
        <motion.div variants={itemVariants}>
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                Alertas Automáticas
              </CardTitle>
              <CardDescription>
                Configura alertas cuando el rate limit supere un umbral
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="alerts-enabled" className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Alertas activadas
                </Label>
                <Switch
                  id="alerts-enabled"
                  checked={alertsEnabled}
                  onCheckedChange={setAlertsEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="email-alerts" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Notificar por email
                </Label>
                <Switch
                  id="email-alerts"
                  checked={emailAlertsEnabled}
                  onCheckedChange={setEmailAlertsEnabled}
                  disabled={!alertsEnabled}
                />
              </div>
              
              {emailAlertsEnabled && (
                <div className="space-y-3 bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    📧 Se enviará email a admins cuando se detecten {emailAlertCount}+ alertas en {emailWindowMinutes} minutos
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="email-alert-count" className="text-xs">Nº alertas para email</Label>
                      <Input
                        id="email-alert-count"
                        type="number"
                        min={1}
                        max={10}
                        value={emailAlertCount}
                        onChange={(e) => setEmailAlertCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 3)))}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email-window" className="text-xs">Ventana (minutos)</Label>
                      <Input
                        id="email-window"
                        type="number"
                        min={1}
                        max={60}
                        value={emailWindowMinutes}
                        onChange={(e) => setEmailWindowMinutes(Math.max(1, Math.min(60, parseInt(e.target.value) || 5)))}
                        className="h-8"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={sendTestEmailAlert}
                    disabled={isSendingEmailAlert}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {isSendingEmailAlert ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Enviar email de prueba
                  </Button>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="threshold">Umbral de alerta (requests)</Label>
                <div className="flex gap-2">
                  <Input
                    id="threshold"
                    type="number"
                    min={1}
                    max={30}
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Math.max(1, Math.min(30, parseInt(e.target.value) || 20)))}
                    className="w-24"
                    disabled={!alertsEnabled}
                  />
                  <span className="text-sm text-muted-foreground self-center">/ 30 máximo</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se mostrará una alerta cuando un perfil supere {alertThreshold} requests por minuto
                  {alertsEnabled && " (configuración guardada)"}
                </p>
              </div>
              
              {/* Email Alert History */}
              {emailAlertHistory.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    Historial de emails ({emailAlertHistory.length})
                    <Badge variant="outline" className="text-[10px] px-1">Realtime</Badge>
                  </Label>
                  <ScrollArea className="h-[150px]">
                    {emailAlertHistory.map((entry) => (
                      <div 
                        key={entry.id} 
                        className={`p-2 mb-2 rounded-lg border text-xs ${
                          entry.status === 'success' 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-destructive/10 border-destructive/30'
                        } ${entry.isFromRealtime ? 'ring-1 ring-blue-500/50' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1">
                            {entry.status === 'success' ? (
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-destructive" />
                            )}
                            <span className="font-medium">
                              {entry.status === 'success' ? 'Enviado' : 'Error'}
                            </span>
                            {entry.isFromRealtime && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                Otro admin
                              </Badge>
                            )}
                          </div>
                          <span className="text-muted-foreground">
                            {format(entry.sentAt, 'dd/MM HH:mm:ss')}
                          </span>
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          {entry.status === 'success' ? (
                            <>
                              {entry.recipients} destinatario(s) • {entry.alertCount} alerta(s)
                              {entry.messageId && (
                                <span className="block truncate">ID: {entry.messageId}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-destructive">{entry.errorMessage}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
              
              {rateLimitAlerts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Alertas recientes</Label>
                  <ScrollArea className="h-[120px]">
                    {rateLimitAlerts.map((alert) => (
                      <Alert key={alert.id} variant="destructive" className="mb-2">
                        <AlertOctagon className="h-4 w-4" />
                        <AlertTitle className="text-sm">
                          {alert.requestCount}/{alert.threshold} requests
                        </AlertTitle>
                        <AlertDescription className="text-xs">
                          Perfil {alert.profileId.substring(0, 8)}... • {format(alert.timestamp, 'HH:mm:ss')}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </ScrollArea>
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
              Rate Limiting y Emails - Últimos 7 días
            </CardTitle>
            <CardDescription>
              Solicitudes de push notifications y emails de alerta por hora
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
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rateLimitChartData}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
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
                      yAxisId="requests"
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      yAxisId="emails"
                      orientation="right"
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                      domain={[0, 'auto']}
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
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      iconType="circle"
                    />
                    <Area 
                      yAxisId="requests"
                      type="monotone" 
                      dataKey="requests" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRequests)"
                      name="Push Requests"
                    />
                    <Area 
                      yAxisId="emails"
                      type="stepAfter" 
                      dataKey="emails" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorEmails)"
                      name="Emails de Alerta"
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Logs de actividad
                {logs.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {filteredLogs.length}/{logs.length}
                  </Badge>
                )}
              </CardTitle>
              
              {/* Filters */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos tipos</SelectItem>
                    <SelectItem value="in-app">In-App</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="rate-limit">Rate Limit</SelectItem>
                    <SelectItem value="rotation">Rotación</SelectItem>
                    <SelectItem value="alert">Alertas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[110px] h-8 text-xs">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos estados</SelectItem>
                    <SelectItem value="success">Éxito</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Advertencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                  <Activity className="w-10 h-10 mb-3 opacity-50" />
                  {logs.length === 0 ? (
                    <>
                      <p>No hay logs aún</p>
                      <p className="text-sm">Ejecuta una prueba para ver los resultados</p>
                    </>
                  ) : (
                    <>
                      <p>Sin resultados</p>
                      <p className="text-sm">Ajusta los filtros para ver más logs</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
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
