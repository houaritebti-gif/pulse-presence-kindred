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
      className="p-5 bg-card rounded-xl border-2 border-border hover:border-amber-500/40 transition-all duration-200"
    >
      <div className="flex items-start gap-4 mb-4">
        {/* Profile Photo */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center font-semibold uppercase tracking-wide">Perfil</p>
          <div
            className="w-24 h-24 rounded-xl overflow-hidden border-2 border-border cursor-pointer hover:border-primary/50 transition-colors shadow-md"
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
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center font-semibold uppercase tracking-wide">Selfie</p>
          <div
            className="w-24 h-24 rounded-xl overflow-hidden border-2 border-amber-500/40 cursor-pointer hover:border-amber-500 transition-colors shadow-md"
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
            <span className="font-bold text-base text-foreground truncate">
              {verification.profile?.name || "Sin nombre"}
            </span>
            <Badge variant="outline" className="bg-[hsl(45,90%,55%,0.12)] dark:bg-[hsl(45,90%,55%,0.08)] text-[hsl(45,90%,35%)] dark:text-[hsl(45,90%,65%)] border-[hsl(45,90%,55%,0.35)] dark:border-[hsl(45,90%,55%,0.25)] font-semibold">
              <Clock className="w-3 h-3 mr-1" />
              Revisión manual
            </Badge>
          </div>
          
          {verification.profile?.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3 font-medium">
              <MapPin className="w-4 h-4" />
              {verification.profile.city}
            </p>
          )}

          {/* AI Analysis */}
          <div className="p-3 bg-muted/60 rounded-lg space-y-2 border border-border">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Análisis IA:</span>
              <Badge
                variant={verification.ai_confidence === "high" ? "default" : "secondary"}
                className="text-xs font-semibold"
              >
                {verification.ai_confidence || "N/A"}
              </Badge>
            </div>
            {verification.ai_reason && (
              <p className="text-sm text-muted-foreground italic pl-6 font-medium">
                "{verification.ai_reason}"
              </p>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-3 font-medium">
            Solicitado {format(new Date(verification.created_at), "d MMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t-2 border-border">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-11 text-[hsl(160,60%,40%)] dark:text-[hsl(160,70%,55%)] border-2 border-[hsl(160,60%,45%,0.45)] dark:border-[hsl(160,70%,55%,0.35)] hover:bg-[hsl(160,60%,45%,0.12)] dark:hover:bg-[hsl(160,70%,55%,0.1)] hover:border-[hsl(160,60%,45%)] dark:hover:border-[hsl(160,70%,55%)] font-semibold"
          onClick={onApprove}
          disabled={isUpdating}
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          Aprobar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-11 text-destructive border-2 border-destructive/50 hover:bg-destructive/15 hover:border-destructive font-semibold"
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
