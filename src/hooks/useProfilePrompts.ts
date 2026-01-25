import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';
import { MAX_PROMPTS_PER_PROFILE } from '@/constants/profilePrompts';

export interface ProfilePromptData {
  id: string;
  profile_id: string;
  prompt_key: string;
  answer: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useProfilePrompts(profileId?: string) {
  const { data: profile } = useProfile();
  const [prompts, setPrompts] = useState<ProfilePromptData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const targetProfileId = profileId || profile?.id;

  const fetchPrompts = useCallback(async () => {
    if (!targetProfileId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profile_prompts')
        .select('*')
        .eq('profile_id', targetProfileId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [targetProfileId]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const savePrompt = async (promptKey: string, answer: string): Promise<boolean> => {
    if (!profile?.id) return false;
    
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      toast({
        title: "Respuesta vacía",
        description: "Por favor escribe una respuesta",
        variant: "destructive"
      });
      return false;
    }

    setIsSaving(true);
    try {
      const existingPrompt = prompts.find(p => p.prompt_key === promptKey);
      
      if (existingPrompt) {
        // Update existing
        const { error } = await supabase
          .from('profile_prompts')
          .update({ answer: trimmedAnswer, updated_at: new Date().toISOString() })
          .eq('id', existingPrompt.id);

        if (error) throw error;
      } else {
        // Check limit
        if (prompts.length >= MAX_PROMPTS_PER_PROFILE) {
          toast({
            title: "Límite alcanzado",
            description: `Solo puedes tener ${MAX_PROMPTS_PER_PROFILE} prompts activos`,
            variant: "destructive"
          });
          return false;
        }

        // Insert new
        const { error } = await supabase
          .from('profile_prompts')
          .insert({
            profile_id: profile.id,
            prompt_key: promptKey,
            answer: trimmedAnswer,
            display_order: prompts.length
          });

        if (error) throw error;
      }

      await fetchPrompts();
      toast({
        title: "Guardado ✨",
        description: "Tu prompt se ha guardado correctamente"
      });
      return true;
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el prompt",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deletePrompt = async (promptKey: string): Promise<boolean> => {
    if (!profile?.id) return false;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profile_prompts')
        .delete()
        .eq('profile_id', profile.id)
        .eq('prompt_key', promptKey);

      if (error) throw error;

      await fetchPrompts();
      toast({
        title: "Eliminado",
        description: "El prompt se ha eliminado"
      });
      return true;
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el prompt",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const reorderPrompts = async (orderedKeys: string[]): Promise<boolean> => {
    if (!profile?.id) return false;

    try {
      const updates = orderedKeys.map((key, index) => {
        const prompt = prompts.find(p => p.prompt_key === key);
        if (prompt) {
          return supabase
            .from('profile_prompts')
            .update({ display_order: index })
            .eq('id', prompt.id);
        }
        return null;
      }).filter(Boolean);

      await Promise.all(updates);
      await fetchPrompts();
      return true;
    } catch (error) {
      console.error('Error reordering prompts:', error);
      return false;
    }
  };

  return {
    prompts,
    isLoading,
    isSaving,
    savePrompt,
    deletePrompt,
    reorderPrompts,
    refetch: fetchPrompts,
    canAddMore: prompts.length < MAX_PROMPTS_PER_PROFILE
  };
}
