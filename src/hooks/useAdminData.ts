import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "./useUserRole";
import { sendPushNotification } from "@/utils/pushNotifications";

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

interface IdentityVerification {
  id: string;
  profile_id: string;
  selfie_url: string;
  status: string;
  rejection_reason: string | null;
  ai_confidence: string | null;
  ai_reason: string | null;
  verified_at: string | null;
  created_at: string;
  profile?: Profile;
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

interface VerificationStats {
  total: number;
  pending: number;
  manualReview: number;
  approved: number;
  rejected: number;
  approvedLast7Days: number;
  rejectedLast7Days: number;
  pendingLast7Days: number;
}

export interface DailyVerificationData {
  date: string;
  approved: number;
  rejected: number;
}

// Fetch verification statistics
export const useVerificationStats = () => {
  return useQuery({
    queryKey: ['admin-verification-stats'],
    queryFn: async (): Promise<VerificationStats> => {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('status, created_at, verified_at');

      if (error) throw error;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: VerificationStats = {
        total: data?.length || 0,
        pending: data?.filter(v => v.status === 'pending').length || 0,
        manualReview: data?.filter(v => v.status === 'manual_review').length || 0,
        approved: data?.filter(v => v.status === 'approved').length || 0,
        rejected: data?.filter(v => v.status === 'rejected').length || 0,
        approvedLast7Days: data?.filter(v => 
          v.status === 'approved' && 
          v.verified_at && 
          new Date(v.verified_at) >= sevenDaysAgo
        ).length || 0,
        rejectedLast7Days: data?.filter(v => 
          v.status === 'rejected' && 
          new Date(v.created_at) >= sevenDaysAgo
        ).length || 0,
        pendingLast7Days: data?.filter(v => 
          (v.status === 'pending' || v.status === 'manual_review') && 
          new Date(v.created_at) >= sevenDaysAgo
        ).length || 0,
      };

      return stats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch daily verification data for chart (last 30 days)
export const useVerificationChartData = () => {
  return useQuery({
    queryKey: ['admin-verification-chart'],
    queryFn: async (): Promise<DailyVerificationData[]> => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('identity_verifications')
        .select('status, created_at, verified_at')
        .or(`status.eq.approved,status.eq.rejected`)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      // Create a map for each day in the last 30 days
      const dailyData: Map<string, { approved: number; rejected: number }> = new Map();
      
      // Initialize all days with 0
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData.set(dateStr, { approved: 0, rejected: 0 });
      }

      // Count verifications per day
      data?.forEach(v => {
        // For approved, use verified_at date; for rejected, use created_at
        const dateToUse = v.status === 'approved' && v.verified_at 
          ? new Date(v.verified_at)
          : new Date(v.created_at);
        const dateStr = dateToUse.toISOString().split('T')[0];
        
        const existing = dailyData.get(dateStr);
        if (existing) {
          if (v.status === 'approved') {
            existing.approved++;
          } else if (v.status === 'rejected') {
            existing.rejected++;
          }
        }
      });

      // Convert to array
      return Array.from(dailyData.entries()).map(([date, counts]) => ({
        date,
        approved: counts.approved,
        rejected: counts.rejected,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch identity verifications pending manual review
export const useAdminIdentityVerifications = () => {
  return useQuery({
    queryKey: ['admin-identity-verifications'],
    queryFn: async (): Promise<IdentityVerification[]> => {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select(`
          id,
          profile_id,
          selfie_url,
          status,
          rejection_reason,
          ai_confidence,
          ai_reason,
          verified_at,
          created_at
        `)
        .eq('status', 'manual_review')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get profile info
      const profileIds = data?.map(v => v.profile_id) || [];
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, name, avatar_url, city')
          .in('id', profileIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        
        return (data || []).map(verification => ({
          ...verification,
          profile: profileMap.get(verification.profile_id) as Profile | undefined,
        }));
      }

      return data || [];
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

// Update identity verification status (admin decision)
export const useUpdateIdentityVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      verificationId, 
      profileId,
      approved, 
      rejectionReason 
    }: { 
      verificationId: string; 
      profileId: string;
      approved: boolean; 
      rejectionReason?: string;
    }) => {
      // Update verification status
      const { error: verificationError } = await supabase
        .from('identity_verifications')
        .update({
          status: approved ? 'approved' : 'rejected',
          rejection_reason: approved ? null : (rejectionReason || 'Rechazado por administrador'),
          verified_at: approved ? new Date().toISOString() : null,
        })
        .eq('id', verificationId);

      if (verificationError) throw verificationError;

      // If approved, update profile
      if (approved) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ identity_verified: true })
          .eq('id', profileId);

        if (profileError) throw profileError;
      }

      // Create notification for the user
      const notificationTitle = approved ? "✅ Identidad verificada" : "❌ Verificación rechazada";
      const notificationDesc = approved
        ? "Tu verificación de identidad ha sido aprobada por nuestro equipo. Ahora tienes el badge de verificado."
        : (rejectionReason || "Tu verificación de identidad ha sido rechazada. Puedes intentarlo de nuevo.");

      const notificationData = {
        profile_id: profileId,
        type: approved ? "identity_verified" : "identity_rejected",
        title: notificationTitle,
        description: notificationDesc,
        link: "/profile",
      };

      await supabase.from('notifications').insert(notificationData);

      // Send push notification
      await sendPushNotification({
        profileId,
        title: notificationTitle,
        body: notificationDesc,
        url: "/profile",
        tag: approved ? "identity-verified" : "identity-rejected",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-identity-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-verification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-verification-chart'] });
    },
  });
};

// Force re-verification of a user (admin action)
export const useForceReverification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId }: { profileId: string }) => {
      // Reset identity_verified to false on the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ identity_verified: false })
        .eq('id', profileId);

      if (profileError) throw profileError;

      // Delete any existing verification records so user can start fresh
      const { error: deleteError } = await supabase
        .from('identity_verifications')
        .delete()
        .eq('profile_id', profileId);

      if (deleteError) throw deleteError;

      // Create notification for the user
      await supabase.from('notifications').insert({
        profile_id: profileId,
        type: 'identity_invalidated',
        title: '🔄 Re-verificación requerida',
        description: 'Un administrador ha solicitado que vuelvas a verificar tu identidad.',
        link: '/profile',
      });

      // Send push notification
      await sendPushNotification({
        profileId,
        title: '🔄 Re-verificación requerida',
        body: 'Un administrador ha solicitado que vuelvas a verificar tu identidad.',
        url: '/profile',
        tag: 'identity-reverification',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-identity-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-verification-stats'] });
    },
  });
};