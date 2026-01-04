import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = 'admin' | 'moderator' | 'user';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<UserRole[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []) as UserRole[];
    },
    enabled: !!user?.id,
  });
};

export const useIsAdmin = () => {
  const { data: roles, isLoading } = useUserRole();
  const isAdmin = roles?.some(r => r.role === 'admin') ?? false;
  return { isAdmin, isLoading };
};

export const useIsModerator = () => {
  const { data: roles, isLoading } = useUserRole();
  const isModerator = roles?.some(r => r.role === 'moderator' || r.role === 'admin') ?? false;
  return { isModerator, isLoading };
};

export const useHasRole = (role: AppRole) => {
  const { data: roles, isLoading } = useUserRole();
  const hasRole = roles?.some(r => r.role === role) ?? false;
  return { hasRole, isLoading };
};