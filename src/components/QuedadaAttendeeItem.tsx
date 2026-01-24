import LazyAvatar from "@/components/LazyAvatar";
import PremiumBadge from "@/components/PremiumBadge";
import { useUserSubscription } from "@/hooks/useUserSubscription";

interface QuedadaAttendeeItemProps {
  profile: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
  onNavigate: () => void;
  expelButton?: React.ReactNode;
}

const QuedadaAttendeeItem = ({ profile, onNavigate, expelButton }: QuedadaAttendeeItemProps) => {
  const { data: tier } = useUserSubscription(profile?.id);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
      <button
        onClick={onNavigate}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <LazyAvatar
          src={profile?.avatar_url}
          fallback={profile?.name}
          className="w-10 h-10"
          fallbackClassName="bg-card text-card-foreground"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-body text-sm text-card-foreground truncate">
              {profile?.name || "Anónima"}
            </p>
            {tier === 'premium' && <PremiumBadge size="sm" />}
          </div>
        </div>
      </button>
      {expelButton}
    </div>
  );
};

export default QuedadaAttendeeItem;
