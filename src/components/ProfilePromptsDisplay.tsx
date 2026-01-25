import { motion } from 'framer-motion';
import { getPromptByKey } from '@/constants/profilePrompts';
import { cn } from '@/lib/utils';

// Minimal prompt data needed for display
interface PromptDisplayData {
  id: string;
  prompt_key: string;
  answer: string;
  display_order?: number;
}

interface ProfilePromptsDisplayProps {
  prompts: PromptDisplayData[];
  variant?: 'card' | 'full' | 'compact';
  className?: string;
}

export function ProfilePromptsDisplay({ 
  prompts, 
  variant = 'full',
  className 
}: ProfilePromptsDisplayProps) {
  if (!prompts || prompts.length === 0) return null;

  if (variant === 'compact') {
    // Show only first prompt in a compact format (for presence cards)
    const firstPrompt = prompts[0];
    const promptDef = getPromptByKey(firstPrompt.prompt_key);
    if (!promptDef) return null;

    return (
      <div className={cn("flex items-start gap-2 text-sm", className)}>
        <span className="text-base flex-shrink-0">{promptDef.emoji}</span>
        <p className="text-foreground/80 line-clamp-2 italic">
          "{firstPrompt.answer}"
        </p>
      </div>
    );
  }

  if (variant === 'card') {
    // For swipeable cards - show up to 2 prompts
    const displayPrompts = prompts.slice(0, 2);

    return (
      <div className={cn("space-y-2", className)}>
        {displayPrompts.map((prompt, index) => {
          const promptDef = getPromptByKey(prompt.prompt_key);
          if (!promptDef) return null;

          return (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{promptDef.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/70 mb-1">{promptDef.question}</p>
                  <p className="text-sm text-white font-medium line-clamp-2">
                    {prompt.answer}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Full display for profile pages
  return (
    <div className={cn("space-y-3", className)}>
      {prompts.map((prompt, index) => {
        const promptDef = getPromptByKey(prompt.prompt_key);
        if (!promptDef) return null;

        return (
          <motion.div
            key={prompt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border border-foreground/10 bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{promptDef.emoji}</span>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  {promptDef.question}
                </p>
                <p className="text-foreground">
                  {prompt.answer}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
