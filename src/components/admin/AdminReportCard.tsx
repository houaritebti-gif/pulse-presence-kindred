import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Check, X, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reported?: {
    name: string | null;
    avatar_url: string | null;
  } | null;
  reporter?: {
    name: string | null;
  } | null;
}

interface AdminReportCardProps {
  report: Report;
  onUpdateStatus: (reportId: string, status: string) => void;
  isUpdating?: boolean;
}

const AdminReportCard = ({ report, onUpdateStatus, isUpdating }: AdminReportCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 font-semibold px-2.5 py-1">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Pendiente
          </Badge>
        );
      case "reviewed":
        return (
          <Badge variant="secondary" className="font-semibold px-2.5 py-1">
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Revisado
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 font-semibold px-2.5 py-1">
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Resuelto
          </Badge>
        );
      case "dismissed":
        return (
          <Badge variant="outline" className="text-muted-foreground font-semibold px-2.5 py-1">
            <X className="w-3.5 h-3.5 mr-1.5" />
            Descartado
          </Badge>
        );
      default:
        return <Badge variant="outline" className="font-semibold">{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-card rounded-xl border-2 border-border hover:border-destructive/40 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <Avatar className="w-12 h-12 ring-2 ring-destructive/30">
              <AvatarImage src={report.reported?.avatar_url || undefined} />
              <AvatarFallback className="bg-destructive/15 text-destructive font-bold">
                {(report.reported?.name?.[0] || "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-destructive/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-destructive" />
            </div>
          </div>
          <div>
            <p className="font-bold text-base text-foreground">
              {report.reported?.name || "Usuario"}
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              Reportado por <span className="text-foreground/80">{report.reporter?.name || "Usuario anónimo"}</span>
            </p>
          </div>
        </div>
        {getStatusBadge(report.status)}
      </div>

      <div className="bg-muted/60 rounded-lg p-4 mb-4 border border-border">
        <p className="text-sm font-semibold text-foreground mb-1">
          Motivo: <span className="text-destructive">{report.reason}</span>
        </p>
        {report.details && (
          <p className="text-sm text-muted-foreground font-medium">{report.details}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t-2 border-border">
        <span className="text-sm font-medium text-muted-foreground">
          {format(new Date(report.created_at), "d MMM yyyy, HH:mm", { locale: es })}
        </span>
        {report.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(report.id, "dismissed")}
              disabled={isUpdating}
              className="text-muted-foreground border-2 font-semibold h-9"
            >
              <X className="w-4 h-4 mr-1.5" />
              Descartar
            </Button>
            <Button
              size="sm"
              onClick={() => onUpdateStatus(report.id, "resolved")}
              disabled={isUpdating}
              className="bg-emerald-600 hover:bg-emerald-700 font-semibold h-9"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Resolver
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminReportCard;
