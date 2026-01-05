import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ThumbsUp, ThumbsDown, Users, MapPin, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Verification {
  id: string;
  profile_id: string;
  selfie_url: string;
  status: string;
  ai_confidence: string | null;
  ai_reason: string | null;
  created_at: string;
  profile?: {
    name: string | null;
    avatar_url: string | null;
    city: string | null;
  } | null;
}

interface AdminVerificationCardProps {
  verification: Verification;
  onApprove: () => void;
  onReject: () => void;
  onViewImage: (url: string) => void;
  isUpdating?: boolean;
}

const AdminVerificationCard = ({
  verification,
  onApprove,
  onReject,
  onViewImage,
  isUpdating,
}: AdminVerificationCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-5 bg-card rounded-xl border border-border hover:border-amber-500/30 transition-all duration-200"
    >
      <div className="flex items-start gap-4 mb-4">
        {/* Profile Photo */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground text-center font-medium">Perfil</p>
          <div
            className="w-24 h-24 rounded-xl overflow-hidden border-2 border-border cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
            onClick={() => verification.profile?.avatar_url && onViewImage(verification.profile.avatar_url)}
          >
            {verification.profile?.avatar_url ? (
              <img
                src={verification.profile.avatar_url}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Selfie */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground text-center font-medium">Selfie</p>
          <div
            className="w-24 h-24 rounded-xl overflow-hidden border-2 border-amber-500/30 cursor-pointer hover:border-amber-500 transition-colors shadow-sm"
            onClick={() => onViewImage(verification.selfie_url)}
          >
            <img
              src={verification.selfie_url}
              alt="Selfie"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-foreground truncate" style={{ fontFamily: 'Arial, sans-serif' }}>
              {verification.profile?.name || "Sin nombre"}
            </span>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
              <Clock className="w-3 h-3 mr-1" />
              Revisión manual
            </Badge>
          </div>
          
          {verification.profile?.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
              <MapPin className="w-3.5 h-3.5" />
              {verification.profile.city}
            </p>
          )}

          {/* AI Analysis */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Análisis IA:</span>
              <Badge
                variant={verification.ai_confidence === "high" ? "default" : "secondary"}
                className="text-xs"
              >
                {verification.ai_confidence || "N/A"}
              </Badge>
            </div>
            {verification.ai_reason && (
              <p className="text-xs text-muted-foreground italic pl-6">
                "{verification.ai_reason}"
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Solicitado {format(new Date(verification.created_at), "d MMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-10 text-emerald-600 border-emerald-500/50 hover:bg-emerald-500/10 hover:border-emerald-500"
          onClick={onApprove}
          disabled={isUpdating}
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          Aprobar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-10 text-destructive border-destructive/50 hover:bg-destructive/10 hover:border-destructive"
          onClick={onReject}
          disabled={isUpdating}
        >
          <ThumbsDown className="w-4 h-4 mr-2" />
          Rechazar
        </Button>
      </div>
    </motion.div>
  );
};

export default AdminVerificationCard;
