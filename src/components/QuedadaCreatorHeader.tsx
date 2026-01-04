import { useNavigate } from "react-router-dom";
import PremiumBadge from "@/components/PremiumBadge";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import LazyImage from "@/components/LazyImage";

interface QuedadaCreatorHeaderProps {
  creator: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
  title: string;
}

const QuedadaCreatorHeader = ({ creator, title }: QuedadaCreatorHeaderProps) => {
  const navigate = useNavigate();
  const { data: creatorTier } = useUserSubscription(creator?.id);

  const handleViewProfile = () => {
    if (creator?.id) {
      navigate(`/profile/${creator.id}`);
    }
  };

  return (
    <div className="flex items-start gap-3 mb-4">
      <button
        onClick={handleViewProfile}
        className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-accent/20 hover:ring-accent/40 transition-all cursor-pointer"
      >
        {creator?.avatar_url ? (
          <LazyImage src={creator.avatar_url} alt="" className="w-full h-full object-cover" placeholderClassName="w-full h-full" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
            <span className="font-display text-sm text-card-foreground">
              {(creator?.name?.[0] || "?").toUpperCase()}
            </span>
          </div>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-card-foreground text-lg leading-tight">
          {title}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleViewProfile}
            className="font-body text-xs text-card-foreground/50 hover:text-accent transition-colors cursor-pointer"
          >
            por {creator?.name || "Anónima"}
          </button>
          {creatorTier === 'premium' && <PremiumBadge size="sm" />}
        </div>
      </div>
    </div>
  );
};

export default QuedadaCreatorHeader;
