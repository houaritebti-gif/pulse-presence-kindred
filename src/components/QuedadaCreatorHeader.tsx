import { useNavigate } from "react-router-dom";
import { ShieldCheck, Award } from "lucide-react";
import PremiumBadge from "@/components/PremiumBadge";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useOrganizedQuedadasCount } from "@/hooks/useQuedadas";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import LazyImage from "@/components/LazyImage";

interface QuedadaCreatorHeaderProps {
  creator: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
  title: string;
}

type OrganizerLevel = 'none' | 'bronze' | 'silver' | 'gold';

const getOrganizerLevel = (count: number | undefined): OrganizerLevel => {
  if (!count || count < 1) return 'none';
  if (count >= 16) return 'gold';
  if (count >= 6) return 'silver';
  return 'bronze';
};

const levelConfig: Record<OrganizerLevel, { label: string; color: string; bgColor: string }> = {
  none: { label: '', color: '', bgColor: '' },
  bronze: { label: 'Bronce', color: 'text-amber-700', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  silver: { label: 'Plata', color: 'text-slate-500', bgColor: 'bg-slate-200 dark:bg-slate-700/50' },
  gold: { label: 'Oro', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
};

const QuedadaCreatorHeader = ({ creator, title }: QuedadaCreatorHeaderProps) => {
  const navigate = useNavigate();
  const { data: creatorTier } = useUserSubscription(creator?.id);
  const { data: organizedCount } = useOrganizedQuedadasCount(creator?.id);
  
  const organizerLevel = getOrganizerLevel(organizedCount);
  const isVerifiedOrganizer = organizedCount && organizedCount > 5;

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
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleViewProfile}
            className="font-body text-xs text-card-foreground/50 hover:text-accent transition-colors cursor-pointer"
          >
            por {creator?.name || "Anónima"}
          </button>
          {isVerifiedOrganizer && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center text-emerald-500">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Organizador verificado
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {organizerLevel !== 'none' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${levelConfig[organizerLevel].bgColor} ${levelConfig[organizerLevel].color}`}>
                    <Award className="w-3 h-3" />
                    {levelConfig[organizerLevel].label}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {organizedCount} {organizedCount === 1 ? 'quedada organizada' : 'quedadas organizadas'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {creatorTier === 'premium' && <PremiumBadge size="sm" />}
        </div>
      </div>
    </div>
  );
};

export default QuedadaCreatorHeader;