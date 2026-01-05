import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "./useProfile";
import { toast } from "sonner";

export interface IdentityVerification {
  id: string;
  profile_id: string;
  selfie_url: string;
  status: "pending" | "manual_review" | "approved" | "rejected";
  rejection_reason: string | null;
  ai_confidence: string | null;
  ai_reason: string | null;
  verified_at: string | null;
  created_at: string;
}

export const useIdentityVerification = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["identity-verification", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from("identity_verifications")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as IdentityVerification | null;
    },
    enabled: !!user && !!profile?.id,
  });
};

export const useSubmitIdentityVerification = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (selfieFile: File) => {
      if (!profile?.id) throw new Error("No profile");

      // Get user id for storage path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload selfie
      const fileExt = selfieFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("identity-selfies")
        .upload(fileName, selfieFile);

      if (uploadError) throw uploadError;

      // Get signed URL for the selfie (private bucket) - 1 hour expiration for security
      const { data: signedUrlData } = await supabase.storage
        .from("identity-selfies")
        .createSignedUrl(fileName, 60 * 60); // 1 hour - short-lived for security

      if (!signedUrlData?.signedUrl) throw new Error("Failed to get selfie URL");

      // Create verification request
      const { data: verification, error: insertError } = await supabase
        .from("identity_verifications")
        .insert({
          profile_id: profile.id,
          selfie_url: signedUrlData.signedUrl,
        })
        .select()
        .single();

      if (insertError) {
        // Check if it's a unique constraint error (already has pending/approved)
        if (insertError.code === "23505") {
          throw new Error("Ya tienes una verificación pendiente o aprobada");
        }
        throw insertError;
      }

      // Trigger AI verification
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("verify-identity", {
        body: { verification_id: verification.id },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["identity-verification"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      if (data.success) {
        toast.success("¡Identidad verificada!", {
          description: "Tu perfil ahora muestra el badge de identidad verificada.",
        });
      } else {
        toast.error("Verificación no aprobada", {
          description: data.reason || "Intenta con otra foto.",
        });
      }
    },
    onError: (error: Error) => {
      toast.error("Error al verificar", {
        description: error.message,
      });
    },
  });
};
