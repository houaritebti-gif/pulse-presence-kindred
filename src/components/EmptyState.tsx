import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  fullScreen?: boolean;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  fullScreen = false,
}: EmptyStateProps) => {
  const content = (
    <div className="text-center py-16 animate-fade-up">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="w-full h-full rounded-full bg-card/50 flex items-center justify-center">
          <Icon className="w-8 h-8 text-muted-foreground/30" />
        </div>
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="font-body text-sm text-muted-foreground/60 max-w-[240px] mx-auto leading-relaxed mb-6">
        {description}
      </p>
      {action}
    </div>
  );

  if (fullScreen) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        {content}
      </main>
    );
  }

  return content;
};

export default EmptyState;
