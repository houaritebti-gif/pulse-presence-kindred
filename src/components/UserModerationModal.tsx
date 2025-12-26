import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Flag, X, AlertTriangle } from "lucide-react";
import { useBlockUser, useReportUser, REPORT_REASONS, ReportReason } from "@/hooks/useUserModeration";

interface UserModerationModalProps {
  profileId: string;
  profileName: string;
  onClose: () => void;
  initialMode?: "block" | "report";
}

const UserModerationModal = ({ 
  profileId, 
  profileName, 
  onClose,
  initialMode = "report"
}: UserModerationModalProps) => {
  const [mode, setMode] = useState<"block" | "report">(initialMode);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [confirmBlock, setConfirmBlock] = useState(false);
  
  const blockUser = useBlockUser();
  const reportUser = useReportUser();

  const handleBlock = async () => {
    if (!confirmBlock) {
      setConfirmBlock(true);
      return;
    }
    
    await blockUser.mutateAsync(profileId);
    onClose();
  };

  const handleReport = async () => {
    if (!selectedReason) return;
    
    await reportUser.mutateAsync({
      reportedProfileId: profileId,
      reason: selectedReason,
      details: details.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center p-6 z-50">
      <div className="bg-card rounded-3xl p-6 max-w-sm w-full animate-fade-up shadow-2xl border border-border/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => { setMode("report"); setConfirmBlock(false); }}
              className={`px-3 py-1.5 rounded-full font-body text-sm transition-all ${
                mode === "report" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Flag className="w-3.5 h-3.5 inline mr-1.5" />
              Reportar
            </button>
            <button
              onClick={() => { setMode("block"); setConfirmBlock(false); }}
              className={`px-3 py-1.5 rounded-full font-body text-sm transition-all ${
                mode === "block" 
                  ? "bg-destructive text-destructive-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Shield className="w-3.5 h-3.5 inline mr-1.5" />
              Bloquear
            </button>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === "report" ? (
          <>
            <h3 className="font-display text-lg font-semibold text-card-foreground mb-2">
              Reportar a {profileName}
            </h3>
            <p className="font-body text-sm text-card-foreground/60 mb-4">
              Selecciona el motivo del reporte:
            </p>

            {/* Reason options */}
            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  className={`w-full p-3 rounded-xl font-body text-sm text-left transition-all ${
                    selectedReason === reason.value
                      ? "bg-primary/20 text-card-foreground border border-primary/30"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>

            {/* Additional details */}
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Detalles adicionales (opcional)"
              className="mb-4 resize-none"
              rows={3}
              maxLength={500}
            />

            <Button
              variant="kiki"
              className="w-full"
              onClick={handleReport}
              disabled={!selectedReason || reportUser.isPending}
            >
              {reportUser.isPending ? "Enviando..." : "Enviar reporte"}
            </Button>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-destructive/60" />
              </div>
            </div>

            <h3 className="font-display text-lg font-semibold text-card-foreground mb-2 text-center">
              Bloquear a {profileName}
            </h3>
            
            {!confirmBlock ? (
              <>
                <p className="font-body text-sm text-card-foreground/60 mb-6 text-center">
                  Al bloquear a esta persona:
                </p>
                <ul className="font-body text-sm text-card-foreground/80 mb-6 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    No verás su perfil en presencia
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    No podrá enviarte mensajes fantasma
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    Las chispas activas se cerrarán
                  </li>
                </ul>
              </>
            ) : (
              <div className="bg-destructive/10 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="font-body text-sm text-card-foreground">
                  ¿Seguro que quieres bloquear a {profileName}? Puedes desbloquear en cualquier momento desde tu perfil.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="kiki-soft"
                className="flex-1"
                onClick={() => confirmBlock ? setConfirmBlock(false) : onClose()}
              >
                Cancelar
              </Button>
              <Button
                variant="kiki"
                className="flex-1 bg-destructive hover:bg-destructive/90"
                onClick={handleBlock}
                disabled={blockUser.isPending}
              >
                {blockUser.isPending ? "..." : confirmBlock ? "Confirmar" : "Bloquear"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserModerationModal;
