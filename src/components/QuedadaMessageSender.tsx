import PremiumBadge from "@/components/PremiumBadge";
import { useUserSubscription } from "@/hooks/useUserSubscription";

interface QuedadaMessageSenderProps {
  sender: {
    id: string;
    name: string | null;
  } | null;
  onNavigate: () => void;
}

const QuedadaMessageSender = ({ sender, onNavigate }: QuedadaMessageSenderProps) => {
  const { data: tier } = useUserSubscription(sender?.id);

  return (
    <button 
      onClick={onNavigate}
      className="flex items-center gap-1 font-body text-[10px] text-muted-foreground mb-1 ml-1 hover:text-accent transition-colors"
    >
      <span>{sender?.name || "Anónima"}</span>
      {tier === 'premium' && <PremiumBadge size="sm" showTooltip={false} />}
    </button>
  );
};

export default QuedadaMessageSender;
