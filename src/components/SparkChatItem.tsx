import { useNavigate } from "react-router-dom";
import { Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import PremiumBadge from "@/components/PremiumBadge";
import SharedAvatar from "@/components/SharedAvatar";

interface SparkChatItemProps {
  chat: {
    id: string;
    other_profile?: {
      id?: string;
      name?: string | null;
      avatar_url?: string | null;
      vibe?: string | null;
    } | null;
    last_message_at?: string | null;
    last_message_content?: string | null;
    unread_count?: number | null;
  };
  animationDelay?: number;
  animationStyle?: React.CSSProperties;
}

const SparkChatItem = ({ chat, animationDelay = 0, animationStyle }: SparkChatItemProps) => {
  const navigate = useNavigate();
  const { data: subscriptionTier } = useUserSubscription(chat.other_profile?.id);

  const computedStyle = animationStyle || { animationDelay: `${animationDelay}ms` };

  return (
    <button
      onClick={() => navigate(`/profile/${chat.other_profile?.id}`)}
      className="w-full bg-card rounded-2xl p-5 sm:p-6 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary/20 opacity-0 animate-stagger-fade-up flex items-center gap-4 sm:gap-5 group border border-transparent hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={computedStyle}
      aria-label={`Chat con ${chat.other_profile?.name || "Anónima"}${chat.unread_count && chat.unread_count > 0 ? `, ${chat.unread_count} mensajes sin leer` : ""}`}
    >
      {/* Avatar with spark indicator */}
      <div className="relative">
        <SharedAvatar
          profileId={chat.other_profile?.id || chat.id}
          avatarUrl={chat.other_profile?.avatar_url}
          name={chat.other_profile?.name}
          size="lg"
          useLazyLoading
          ringClassName="ring-2 ring-primary/20 ring-offset-2 ring-offset-card transition-all duration-300 group-hover:ring-primary/40"
        />
        {/* Flame badge */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card flex items-center justify-center shadow-md">
          <Flame className="w-3.5 h-3.5 text-primary animate-spark-flame" />
        </div>
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-display font-semibold text-card-foreground text-lg">
            {chat.other_profile?.name || "Anónima"}
          </h3>
          {subscriptionTier === 'premium' && <PremiumBadge size="sm" />}
          {chat.last_message_at && (
            <span className="font-body text-xs text-card-foreground/60">
              · {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: false, locale: es })}
            </span>
          )}
        </div>
        {chat.last_message_content ? (
          <p className="font-body text-sm text-card-foreground/80 truncate">
            {chat.last_message_content}
          </p>
        ) : (
          <p className="font-body text-sm text-card-foreground/70">
            Vibra {chat.other_profile?.vibe?.toLowerCase() || "misteriosa"}
          </p>
        )}
      </div>

      {/* Unread indicator or active dot */}
      <div className="flex items-center gap-2">
        {chat.unread_count && chat.unread_count > 0 ? (
          <div className="min-w-6 h-6 px-2 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/50 animate-pulse-soft">
            <span className="text-xs font-bold text-primary-foreground">
              {chat.unread_count > 9 ? "9+" : chat.unread_count}
            </span>
          </div>
        ) : (
          <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
        )}
      </div>
    </button>
  );
};

export default SparkChatItem;
