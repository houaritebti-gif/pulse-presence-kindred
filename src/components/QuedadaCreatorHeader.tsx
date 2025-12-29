import PremiumBadge from "@/components/PremiumBadge";
import { useUserSubscription } from "@/hooks/useUserSubscription";

interface QuedadaCreatorHeaderProps {
  creator: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
  title: string;
}

const QuedadaCreatorHeader = ({ creator, title }: QuedadaCreatorHeaderProps) => {
  const { data: creatorTier } = useUserSubscription(creator?.id);

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-accent/20">
        {creator?.avatar_url ? (
          <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
            <span className="font-display text-sm text-card-foreground">
              {(creator?.name?.[0] || "?").toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-card-foreground text-lg leading-tight">
          {title}
        </h3>
        <div className="flex items-center gap-1.5">
          <p className="font-body text-xs text-card-foreground/50">
            por {creator?.name || "Anónima"}
          </p>
          {creatorTier === 'premium' && <PremiumBadge size="sm" />}
        </div>
      </div>
    </div>
  );
};

export default QuedadaCreatorHeader;
