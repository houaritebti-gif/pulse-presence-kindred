import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Sparkles, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfilePrompts } from '@/hooks/useProfilePrompts';
import { AVAILABLE_PROMPTS, getPromptByKey, MAX_PROMPTS_PER_PROFILE } from '@/constants/profilePrompts';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

export function ProfilePromptsEditor() {
  const { prompts, isLoading, isSaving, savePrompt, deletePrompt, canAddMore } = useProfilePrompts();
  const [selectedPromptKey, setSelectedPromptKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [showSelector, setShowSelector] = useState(false);

  const usedPromptKeys = prompts.map(p => p.prompt_key);
  const availablePrompts = AVAILABLE_PROMPTS.filter(p => !usedPromptKeys.includes(p.key));

  const handleSelectPrompt = (key: string) => {
    triggerHaptic('light');
    setSelectedPromptKey(key);
    setAnswerText('');
    setShowSelector(false);
  };

  const handleEditPrompt = (promptKey: string, currentAnswer: string) => {
    triggerHaptic('light');
    setEditingKey(promptKey);
    setAnswerText(currentAnswer);
  };

  const handleSave = async () => {
    const keyToSave = editingKey || selectedPromptKey;
    if (!keyToSave) return;

    triggerHaptic('medium');
    const success = await savePrompt(keyToSave, answerText);
    if (success) {
      setSelectedPromptKey(null);
      setEditingKey(null);
      setAnswerText('');
    }
  };

  const handleCancel = () => {
    triggerHaptic('light');
    setSelectedPromptKey(null);
    setEditingKey(null);
    setAnswerText('');
    setShowSelector(false);
  };

  const handleDelete = async (key: string) => {
    triggerHaptic('medium');
    await deletePrompt(key);
  };

  const currentPrompt = selectedPromptKey 
    ? getPromptByKey(selectedPromptKey) 
    : editingKey 
    ? getPromptByKey(editingKey) 
    : null;

  if (isLoading) {
    return (
      <Card className="border-foreground/5 shadow-md">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-foreground/5 shadow-md shadow-foreground/10 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Profile Prompts
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {prompts.length}/{MAX_PROMPTS_PER_PROFILE}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing prompts */}
        <AnimatePresence mode="popLayout">
          {prompts.map((prompt) => {
            const promptDef = getPromptByKey(prompt.prompt_key);
            if (!promptDef) return null;

            const isEditing = editingKey === prompt.prompt_key;

            return (
              <motion.div
                key={prompt.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group"
              >
                <div className={cn(
                  "rounded-xl border p-4 transition-all",
                  isEditing 
                    ? "border-primary bg-primary/5" 
                    : "border-foreground/10 bg-background hover:border-foreground/20"
                )}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xl">{promptDef.emoji}</span>
                    <span className="font-medium text-sm flex-1">{promptDef.question}</span>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(prompt.prompt_key)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder={promptDef.placeholder}
                        maxLength={promptDef.maxLength}
                        className="min-h-[80px] resize-none"
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {answerText.length}/{promptDef.maxLength}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving || !answerText.trim()}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Guardar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p 
                      className="text-sm text-foreground/80 cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleEditPrompt(prompt.prompt_key, prompt.answer)}
                    >
                      {prompt.answer}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add new prompt */}
        <AnimatePresence mode="wait">
          {selectedPromptKey && currentPrompt ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border border-primary bg-primary/5 p-4"
            >
              <div className="flex items-start gap-2 mb-3">
                <span className="text-xl">{currentPrompt.emoji}</span>
                <span className="font-medium text-sm">{currentPrompt.question}</span>
              </div>
              <Textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder={currentPrompt.placeholder}
                maxLength={currentPrompt.maxLength}
                className="min-h-[80px] resize-none mb-3"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {answerText.length}/{currentPrompt.maxLength}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !answerText.trim()}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Guardar
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : showSelector ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Elige una pregunta</span>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                {availablePrompts.map((prompt) => (
                  <motion.button
                    key={prompt.key}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectPrompt(prompt.key)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-foreground/10 bg-background hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <span className="text-xl">{prompt.emoji}</span>
                    <span className="text-sm font-medium">{prompt.question}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : canAddMore ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                variant="outline"
                className="w-full border-dashed border-foreground/20 hover:border-primary hover:bg-primary/5"
                onClick={() => {
                  triggerHaptic('light');
                  setShowSelector(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir prompt
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {prompts.length === 0 && !showSelector && !selectedPromptKey && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Los prompts ayudan a mostrar tu personalidad 💫
          </p>
        )}
      </CardContent>
    </Card>
  );
}
