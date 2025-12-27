import { useState, useRef } from "react";
import { ChevronDown, ChevronUp, Clock, Send, Trash2, RefreshCw, Wifi, WifiOff, MessageSquare, Calendar, AlertCircle, CheckCircle2, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOfflineQueue, QueuedMessage } from "@/hooks/useOfflineQueue";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BackupData {
  exportedAt: string;
  totalMessages: number;
  messages: Array<{
    id: string;
    type: 'spark' | 'quedada';
    chatId: string;
    content: string;
    timestamp: number;
    status: 'pending' | 'sending' | 'failed';
    retryCount: number;
  }>;
}

const OfflineQueueManager = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const {
    isOnline,
    queue,
    pendingCount,
    isSyncing,
    addToQueue,
    removeFromQueue,
    resetForRetry,
    clearQueue,
    triggerBackgroundSync,
    canRetry,
    MAX_RETRIES,
  } = useOfflineQueue();

  const getStatusIcon = (status: QueuedMessage['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'sending':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: QueuedMessage['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'sending':
        return 'Enviando...';
      case 'failed':
        return 'Fallido';
      default:
        return status;
    }
  };

  const handleRetry = async (messageId: string) => {
    await resetForRetry(messageId);
    if (isOnline) {
      await triggerBackgroundSync();
    }
    toast.info("Reintentando envío...");
  };

  const handleDelete = async (messageId: string) => {
    await removeFromQueue(messageId);
    toast.success("Mensaje eliminado de la cola");
  };

  const handleExportQueue = () => {
    if (queue.length === 0) {
      toast.info("No hay mensajes para exportar");
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalMessages: queue.length,
      messages: queue.map(msg => ({
        id: msg.id,
        type: msg.type,
        chatId: msg.chatId,
        content: msg.content,
        timestamp: msg.timestamp,
        status: msg.status,
        retryCount: msg.retryCount,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiki-offline-queue-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Cola exportada correctamente");
  };

  const handleImportQueue = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data: BackupData = JSON.parse(content);

        // Validate structure
        if (!data.messages || !Array.isArray(data.messages)) {
          toast.error("Archivo de backup inválido");
          return;
        }

        let importedCount = 0;
        const existingIds = new Set(queue.map(m => m.id));

        for (const msg of data.messages) {
          // Skip if already exists
          if (existingIds.has(msg.id)) continue;

          // Validate message structure
          if (!msg.id || !msg.type || !msg.chatId || !msg.content || !msg.timestamp) {
            continue;
          }

          await addToQueue({
            type: msg.type,
            chatId: msg.chatId,
            content: msg.content,
          });
          importedCount++;
        }

        if (importedCount > 0) {
          toast.success(`${importedCount} mensaje(s) importado(s)`);
        } else {
          toast.info("No se importaron mensajes nuevos");
        }
      } catch (error) {
        console.error("Error importing queue:", error);
        toast.error("Error al leer el archivo de backup");
      }
    };

    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    if (queue.length === 0) return;
    await clearQueue();
    toast.success("Cola vaciada");
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      toast.error("Sin conexión a internet");
      return;
    }
    await triggerBackgroundSync();
    toast.info("Sincronizando mensajes pendientes...");
  };

  const pendingMessages = queue.filter(m => m.status === 'pending');
  const failedMessages = queue.filter(m => m.status === 'failed');
  const sendingMessages = queue.filter(m => m.status === 'sending');

  return (
    <div className="mb-10 animate-fade-up animate-delay-500">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            Cola de mensajes offline
          </h2>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
              {pendingCount}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* Connection Status */}
          <div className={`flex items-center gap-3 p-4 rounded-xl ${
            isOnline ? "bg-green-500/10" : "bg-yellow-500/10"
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5 text-green-500" />
                <span className="font-body text-sm text-foreground">Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-yellow-500" />
                <span className="font-body text-sm text-foreground">Sin conexión</span>
              </>
            )}
          </div>

          {/* Queue Summary */}
          <div className="p-4 bg-secondary/50 rounded-xl">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-500">{pendingMessages.length}</div>
                <div className="text-xs text-muted-foreground">Pendientes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{sendingMessages.length}</div>
                <div className="text-xs text-muted-foreground">Enviando</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">{failedMessages.length}</div>
                <div className="text-xs text-muted-foreground">Fallidos</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {queue.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncNow}
                disabled={!isOnline || isSyncing || pendingMessages.length === 0}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportQueue}
                title="Exportar como backup"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                title="Importar backup"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportQueue}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-destructive hover:text-destructive"
                title="Vaciar cola"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Message List */}
          {queue.length === 0 ? (
            <div className="p-6 bg-secondary/30 rounded-xl text-center">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-body text-sm text-muted-foreground">
                No hay mensajes pendientes
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {queue.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-xl border ${
                    message.status === 'failed' 
                      ? 'bg-destructive/5 border-destructive/20' 
                      : 'bg-secondary/50 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Type Icon */}
                    <div className="mt-1">
                      {message.type === 'spark' ? (
                        <MessageSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Calendar className="w-4 h-4 text-accent" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(message.status)}
                        <span className="text-xs text-muted-foreground">
                          {getStatusText(message.status)}
                        </span>
                        {message.retryCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            (intento {message.retryCount}/{MAX_RETRIES})
                          </span>
                        )}
                      </div>
                      <p className="font-body text-sm text-foreground line-clamp-2">
                        {message.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(message.timestamp), "d MMM, HH:mm", { locale: es })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      {message.status === 'failed' && canRetry(message.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRetry(message.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(message.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <p className="text-xs text-muted-foreground text-center">
            Los mensajes se sincronizarán automáticamente al recuperar la conexión,
            incluso si la app está cerrada.
          </p>
        </div>
      )}
    </div>
  );
};

export default OfflineQueueManager;
