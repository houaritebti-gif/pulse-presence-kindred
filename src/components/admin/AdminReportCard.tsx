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
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "reviewed":
        return (
          <Badge variant="secondary">
            <Check className="w-3 h-3 mr-1" />
            Revisado
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600">
            <Check className="w-3 h-3 mr-1" />
            Resuelto
          </Badge>
        );
      case "dismissed":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <X className="w-3 h-3 mr-1" />
            Descartado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-card rounded-xl border border-border hover:border-destructive/30 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-11 h-11 ring-2 ring-destructive/20">
              <AvatarImage src={report.reported?.avatar_url || undefined} />
              <AvatarFallback className="bg-destructive/10 text-destructive">
                {(report.reported?.name?.[0] || "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-destructive" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
              {report.reported?.name || "Usuario"}
            </p>
            <p className="text-xs text-muted-foreground">
              Reportado por {report.reporter?.name || "Usuario anónimo"}
            </p>
          </div>
        </div>
        {getStatusBadge(report.status)}
      </div>

      <div className="bg-muted/50 rounded-lg p-3 mb-4">
        <p className="text-sm font-medium text-foreground mb-1">
          Motivo: <span className="text-destructive">{report.reason}</span>
        </p>
        {report.details && (
          <p className="text-sm text-muted-foreground">{report.details}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {format(new Date(report.created_at), "d MMM yyyy, HH:mm", { locale: es })}
        </span>
        {report.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(report.id, "dismissed")}
              disabled={isUpdating}
              className="text-muted-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Descartar
            </Button>
            <Button
              size="sm"
              onClick={() => onUpdateStatus(report.id, "resolved")}
              disabled={isUpdating}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Resolver
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminReportCard;
