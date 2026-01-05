import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MoreVertical, UserPlus, History, RefreshCw, ShieldCheck, Mail, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  city: string | null;
  created_at: string;
  identity_verified?: boolean | null;
  email_verified?: boolean | null;
}

interface AdminUserCardProps {
  profile: Profile;
  onAssignRole: (userId: string) => void;
  onViewHistory: (profileId: string, name: string | null) => void;
  onForceReverify: (profileId: string, name: string | null) => void;
}

const AdminUserCard = ({
  profile,
  onAssignRole,
  onViewHistory,
  onForceReverify,
}: AdminUserCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200 group"
    >
      <div className="relative">
        <Avatar className="w-12 h-12 ring-2 ring-background shadow-sm">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {(profile.name?.[0] || "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {profile.identity_verified && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-background">
            <ShieldCheck className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-foreground truncate" style={{ fontFamily: 'Arial, sans-serif' }}>
            {profile.name || "Sin nombre"}
          </p>
          {profile.email_verified && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-blue-500/10 text-blue-600 border-blue-500/30">
              <Mail className="w-2.5 h-2.5 mr-1" />
              Email
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {profile.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {profile.city}
            </span>
          )}
          <span>
            {format(new Date(profile.created_at), "d MMM yyyy", { locale: es })}
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onAssignRole(profile.user_id)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Asignar rol
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onViewHistory(profile.id, profile.name)}>
            <History className="w-4 h-4 mr-2" />
            Historial verificaciones
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onForceReverify(profile.id, profile.name)}
            className="text-orange-600 focus:text-orange-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Forzar re-verificación
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};

export default AdminUserCard;
