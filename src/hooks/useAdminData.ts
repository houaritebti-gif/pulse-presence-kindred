import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "./useUserRole";

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  city: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface UserReport {
  id: string;
  reporter_profile_id: string;
  reported_profile_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter?: Profile;
  reported?: Profile;
}

// Fetch all profiles for admin view
export const useAdminProfiles = () => {
  return useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, name, avatar_url, city, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

// Fetch all user reports for admin view
export const useAdminReports = () => {
  return useQuery({
    queryKey: ['admin-reports'],
    queryFn: async (): Promise<UserReport[]> => {
      const { data, error } = await supabase
        .from('user_reports')
        .select(`
          id,
          reporter_profile_id,
          reported_profile_id,
          reason,
          details,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profile info for reporters and reported users
      const profileIds = new Set<string>();
      data?.forEach(r => {
        profileIds.add(r.reporter_profile_id);
        profileIds.add(r.reported_profile_id);
      });

      if (profileIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', Array.from(profileIds));

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        
        return (data || []).map(report => ({
          ...report,
          reporter: profileMap.get(report.reporter_profile_id) as Profile | undefined,
          reported: profileMap.get(report.reported_profile_id) as Profile | undefined,
        }));
      }

      return data || [];
    },
  });
};

// Fetch all user roles
export const useAdminUserRoles = () => {
  return useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async (): Promise<(UserRole & { profile?: Profile })[]> => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get profile info
      const userIds = data?.map(r => r.user_id) || [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        
        return (data || []).map(role => ({
          ...role,
          profile: profileMap.get(role.user_id) as Profile | undefined,
        })) as (UserRole & { profile?: Profile })[];
      }

      return (data || []) as (UserRole & { profile?: Profile })[];
    },
  });
};

// Add role to user
export const useAddUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
    },
  });
};

// Remove role from user
export const useRemoveUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
    },
  });
};

// Update report status
export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      const { error } = await supabase
        .from('user_reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });
};