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
      className="flex items-center gap-4 p-4 bg-card rounded-xl border-2 border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
    >
      <div className="relative flex-shrink-0">
        <Avatar className="w-14 h-14 ring-2 ring-background shadow-md">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/15 text-primary font-bold text-lg">
            {(profile.name?.[0] || "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {profile.identity_verified && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-background">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-bold text-base text-foreground truncate">
            {profile.name || "Sin nombre"}
          </p>
          {profile.email_verified && (
            <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40 font-semibold">
              <Mail className="w-3 h-3 mr-1" />
              Email
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
          {profile.city && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {profile.city}
            </span>
          )}
          <span className="text-muted-foreground/70">
            {format(new Date(profile.created_at), "d MMM yyyy", { locale: es })}
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-2 opacity-70 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 border-2">
          <DropdownMenuItem onClick={() => onAssignRole(profile.user_id)} className="py-2.5 font-medium">
            <UserPlus className="w-4 h-4 mr-2.5" />
            Asignar rol
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onViewHistory(profile.id, profile.name)} className="py-2.5 font-medium">
            <History className="w-4 h-4 mr-2.5" />
            Historial verificaciones
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onForceReverify(profile.id, profile.name)}
            className="py-2.5 font-medium text-amber-600 focus:text-amber-600 dark:text-amber-400"
          >
            <RefreshCw className="w-4 h-4 mr-2.5" />
            Forzar re-verificación
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};

export default AdminUserCard;
