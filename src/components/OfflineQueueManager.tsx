import { useState, useRef } from "react";
import { ChevronDown, ChevronUp, Clock, Send, Trash2, RefreshCw, Wifi, WifiOff, MessageSquare, Calendar, AlertCircle, CheckCircle2, Download, Upload, Eye, Filter, ArrowUpDown, ArrowDown, ArrowUp, BarChart3, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { useOfflineQueue, QueuedMessage } from "@/hooks/useOfflineQueue";
import { resetQueueStats } from "@/utils/offlineQueueDB";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

type TypeFilter = 'all' | 'spark' | 'quedada';
type StatusFilter = 'all' | 'pending' | 'failed';
type SortBy = 'date' | 'retries';
type SortOrder = 'asc' | 'desc';

const OfflineQueueManager = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showResetStatsConfirm, setShowResetStatsConfirm] = useState(false);
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
    getQueueStats,
    MAX_RETRIES,
  } = useOfflineQueue();
  
  const stats = getQueueStats();
  const successRate = stats.totalQueued > 0 
    ? Math.round((stats.totalSent / stats.totalQueued) * 100) 
    : 0;

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: BackupData = JSON.parse(content);

        // Validate structure
        if (!data.messages || !Array.isArray(data.messages)) {
          toast.error("Archivo de backup inválido");
          return;
        }

        // Store data and show confirmation
        setPendingImport(data);
        setShowImportConfirm(true);
      } catch (error) {
        console.error("Error reading backup file:", error);
        toast.error("Error al leer el archivo de backup");
      }
    };

    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!pendingImport) return;

    try {
      let importedCount = 0;
      const existingIds = new Set(queue.map(m => m.id));

      for (const msg of pendingImport.messages) {
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
      toast.error("Error al importar mensajes");
    } finally {
      setPendingImport(null);
      setShowImportConfirm(false);
    }
  };

  const cancelImport = () => {
    setPendingImport(null);
    setShowImportConfirm(false);
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

  // Filtered and sorted messages
  const filteredQueue = queue
    .filter(m => {
      const matchesType = typeFilter === 'all' || m.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = a.timestamp - b.timestamp;
      } else if (sortBy === 'retries') {
        comparison = a.retryCount - b.retryCount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

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

          {/* Historical Stats */}
          {stats.totalQueued > 0 && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Estadísticas históricas</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetStatsConfirm(true)}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  title="Resetear estadísticas"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Resetear
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-foreground">{stats.totalQueued}</div>
                  <div className="text-[10px] text-muted-foreground">Total encolados</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-500">{stats.totalSent}</div>
                  <div className="text-[10px] text-muted-foreground">Enviados</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-destructive">{stats.totalFailed}</div>
                  <div className="text-[10px] text-muted-foreground">Fallidos</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className={`w-4 h-4 ${successRate >= 80 ? 'text-green-500' : successRate >= 50 ? 'text-yellow-500' : 'text-destructive'}`} />
                    <span className={`text-lg font-bold ${successRate >= 80 ? 'text-green-500' : successRate >= 50 ? 'text-yellow-500' : 'text-destructive'}`}>
                      {successRate}%
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">Tasa éxito</div>
                </div>
              </div>
              {stats.lastSyncAt && (
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Última sync: {format(new Date(stats.lastSyncAt), "d MMM, HH:mm", { locale: es })}
                </p>
              )}
            </div>
          )}

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
                onChange={handleFileSelect}
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

          {/* Filters and Sort */}
          {queue.length > 0 && (
            <div className="space-y-3 p-3 bg-secondary/30 rounded-xl">
              {/* Filters Row */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tipo:</span>
                  <ToggleGroup 
                    type="single" 
                    value={typeFilter} 
                    onValueChange={(value) => value && setTypeFilter(value as TypeFilter)}
                    size="sm"
                  >
                    <ToggleGroupItem value="all" className="text-xs px-2 h-7">
                      Todos
                    </ToggleGroupItem>
                    <ToggleGroupItem value="spark" className="text-xs px-2 h-7">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Spark
                    </ToggleGroupItem>
                    <ToggleGroupItem value="quedada" className="text-xs px-2 h-7">
                      <Calendar className="w-3 h-3 mr-1" />
                      Quedada
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Estado:</span>
                  <ToggleGroup 
                    type="single" 
                    value={statusFilter} 
                    onValueChange={(value) => value && setStatusFilter(value as StatusFilter)}
                    size="sm"
                  >
                    <ToggleGroupItem value="all" className="text-xs px-2 h-7">
                      Todos
                    </ToggleGroupItem>
                    <ToggleGroupItem value="pending" className="text-xs px-2 h-7">
                      <Clock className="w-3 h-3 mr-1" />
                      Pendientes
                    </ToggleGroupItem>
                    <ToggleGroupItem value="failed" className="text-xs px-2 h-7">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Fallidos
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              {/* Sort Row */}
              <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Ordenar:</span>
                  <ToggleGroup 
                    type="single" 
                    value={sortBy} 
                    onValueChange={(value) => value && setSortBy(value as SortBy)}
                    size="sm"
                  >
                    <ToggleGroupItem value="date" className="text-xs px-2 h-7">
                      <Clock className="w-3 h-3 mr-1" />
                      Fecha
                    </ToggleGroupItem>
                    <ToggleGroupItem value="retries" className="text-xs px-2 h-7">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Reintentos
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSortOrder}
                  className="h-7 px-2"
                  title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                  <span className="text-xs ml-1">
                    {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                  </span>
                </Button>
              </div>
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
          ) : filteredQueue.length === 0 ? (
            <div className="p-6 bg-secondary/30 rounded-xl text-center">
              <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-body text-sm text-muted-foreground">
                No hay mensajes con los filtros seleccionados
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredQueue.map((message) => (
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

      {/* Import Confirmation Dialog */}
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar importación</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {pendingImport && (
                  <>
                    <p className="mb-3">
                      Backup del{" "}
                      <strong>
                        {format(new Date(pendingImport.exportedAt), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                      </strong>{" "}
                      con <strong>{pendingImport.totalMessages} mensaje(s)</strong>.
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Los mensajes que ya existan en la cola serán ignorados.
                    </p>

                    {/* Preview Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-2 text-sm text-primary hover:underline mb-2"
                    >
                      <Eye className="w-4 h-4" />
                      {showPreview ? "Ocultar vista previa" : "Ver mensajes"}
                    </button>

                    {/* Message Preview List */}
                    {showPreview && (
                      <ScrollArea className="h-48 rounded-lg border border-border bg-secondary/30 p-2">
                        <div className="space-y-2">
                          {pendingImport.messages.map((msg, index) => {
                            const isDuplicate = queue.some(q => q.id === msg.id);
                            return (
                              <div
                                key={msg.id || index}
                                className={`p-2 rounded-lg text-xs ${
                                  isDuplicate 
                                    ? "bg-muted/50 opacity-60" 
                                    : "bg-background"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {msg.type === 'spark' ? (
                                    <MessageSquare className="w-3 h-3 text-primary" />
                                  ) : (
                                    <Calendar className="w-3 h-3 text-accent" />
                                  )}
                                  <span className="text-muted-foreground">
                                    {format(new Date(msg.timestamp), "d MMM, HH:mm", { locale: es })}
                                  </span>
                                  {isDuplicate && (
                                    <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 rounded text-[10px]">
                                      Duplicado
                                    </span>
                                  )}
                                </div>
                                <p className="text-foreground line-clamp-2">{msg.content}</p>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}

                    {showPreview && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {pendingImport.messages.filter(m => !queue.some(q => q.id === m.id)).length} mensaje(s) nuevos se importarán
                      </p>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelImport}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Importar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Stats Confirmation Dialog */}
      <AlertDialog open={showResetStatsConfirm} onOpenChange={setShowResetStatsConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Resetear estadísticas?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente todas las estadísticas históricas de la cola offline.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetQueueStats();
                toast.success("Estadísticas reseteadas");
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Resetear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OfflineQueueManager;
