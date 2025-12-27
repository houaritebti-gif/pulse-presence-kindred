import { Clock, AlertCircle, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingMessageProps {
  content: string;
  status: 'pending' | 'sending' | 'failed';
  retryCount?: number;
  maxRetries?: number;
  onRetry?: () => void;
  onDelete?: () => void;
  className?: string;
}

const PendingMessage = ({ 
  content, 
  status, 
  retryCount = 0,
  maxRetries = 3,
  onRetry,
  onDelete,
  className 
}: PendingMessageProps) => {
  const canRetry = retryCount < maxRetries;
  const isFailed = status === 'failed';
  const isSending = status === 'sending';

  return (
    <div className={cn(
      "flex items-end gap-2 justify-end animate-message-right",
      className
    )}>
      <div className="max-w-[75%]">
        <div className={cn(
          "font-body text-sm leading-relaxed px-4 py-3 rounded-2xl rounded-br-md",
          isFailed && "bg-destructive/20 text-foreground border border-destructive/30",
          isSending && "bg-primary/50 text-primary-foreground",
          status === 'pending' && "bg-primary/40 text-primary-foreground"
        )}>
          {content}
        </div>
        <div className={cn(
          "flex items-center gap-2 mt-1 justify-end",
          isFailed ? "text-destructive" : "text-muted-foreground"
        )}>
          {isSending ? (
            <div className="flex items-center gap-1 text-[10px]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Enviando...</span>
            </div>
          ) : isFailed ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px]">
                <AlertCircle className="w-3 h-3" />
                <span>Error al enviar</span>
                {retryCount > 0 && (
                  <span className="text-muted-foreground">
                    ({retryCount}/{maxRetries})
                  </span>
                )}
              </div>
              {canRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reintentar</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80 transition-colors px-2 py-0.5 rounded-full bg-destructive/10 hover:bg-destructive/20"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px]">
              <Clock className="w-3 h-3" />
              <span>Pendiente...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingMessage;
