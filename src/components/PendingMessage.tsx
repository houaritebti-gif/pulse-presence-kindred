import { Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingMessageProps {
  content: string;
  isPending: boolean;
  hasFailed?: boolean;
  className?: string;
}

const PendingMessage = ({ content, isPending, hasFailed, className }: PendingMessageProps) => {
  return (
    <div className={cn(
      "flex items-end gap-2 justify-end animate-message-right",
      className
    )}>
      <div className="max-w-[75%]">
        <div className={cn(
          "font-body text-sm leading-relaxed px-4 py-3 rounded-2xl rounded-br-md",
          isPending && !hasFailed && "bg-primary/50 text-primary-foreground",
          hasFailed && "bg-destructive/20 text-destructive-foreground border border-destructive/30"
        )}>
          {content}
        </div>
        <div className={cn(
          "flex items-center gap-1 mt-1 justify-end text-[10px]",
          hasFailed ? "text-destructive" : "text-muted-foreground"
        )}>
          {hasFailed ? (
            <>
              <AlertCircle className="w-3 h-3" />
              <span>Error al enviar</span>
            </>
          ) : (
            <>
              <Clock className="w-3 h-3" />
              <span>Pendiente...</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingMessage;
