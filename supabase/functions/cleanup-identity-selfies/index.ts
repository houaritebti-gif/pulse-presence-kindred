import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting identity selfies cleanup...");

    let deletedFromCompletedVerifications = 0;
    let deletedOrphanedFiles = 0;
    let deletedOldVerifications = 0;

    // 1. Get all completed verifications (approved/rejected) older than 1 day
    // These should have had their selfies deleted, but we double-check
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: completedVerifications, error: completedError } = await supabase
      .from("identity_verifications")
      .select("id, selfie_url, profile_id, status")
      .in("status", ["approved", "rejected"])
      .lt("updated_at", oneDayAgo);

    if (completedError) {
      console.error("Error fetching completed verifications:", completedError);
    } else if (completedVerifications && completedVerifications.length > 0) {
      console.log(`Found ${completedVerifications.length} completed verifications to check`);

      for (const verification of completedVerifications) {
        if (verification.selfie_url) {
          try {
            // Extract file path from URL
            const selfieUrlParts = verification.selfie_url.split("/identity-selfies/");
            if (selfieUrlParts.length > 1) {
              const filePath = selfieUrlParts[1].split("?")[0];
              
              const { error: deleteError } = await supabase.storage
                .from("identity-selfies")
                .remove([filePath]);

              if (!deleteError) {
                deletedFromCompletedVerifications++;
                console.log(`Deleted selfie from completed verification: ${filePath}`);
              }
            }
          } catch (e) {
            console.error(`Error deleting selfie for verification ${verification.id}:`, e);
          }
        }
      }
    }

    // 2. List all files in storage and find orphaned ones
    // (files without corresponding verification records)
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from("identity-selfies")
      .list("", { limit: 1000 });

    if (storageError) {
      console.error("Error listing storage files:", storageError);
    } else if (storageFiles && storageFiles.length > 0) {
      console.log(`Found ${storageFiles.length} user folders in storage`);

      for (const folder of storageFiles) {
        // Each folder is a user ID
        const { data: userFiles, error: userFilesError } = await supabase.storage
          .from("identity-selfies")
          .list(folder.name, { limit: 100 });

        if (userFilesError) {
          console.error(`Error listing files for user ${folder.name}:`, userFilesError);
          continue;
        }

        if (!userFiles || userFiles.length === 0) continue;

        // Get profile_id for this user
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", folder.name)
          .maybeSingle();

        if (!profile) {
          // User doesn't exist - delete all their files
          console.log(`Deleting files for non-existent user: ${folder.name}`);
          const filesToDelete = userFiles.map(f => `${folder.name}/${f.name}`);
          
          const { error: deleteError } = await supabase.storage
            .from("identity-selfies")
            .remove(filesToDelete);

          if (!deleteError) {
            deletedOrphanedFiles += filesToDelete.length;
          }
          continue;
        }

        // Check each file against verifications
        for (const file of userFiles) {
          const filePath = `${folder.name}/${file.name}`;
          
          // Check if this file is referenced in any verification
          const { data: referencedVerification } = await supabase
            .from("identity_verifications")
            .select("id, status")
            .eq("profile_id", profile.id)
            .like("selfie_url", `%${file.name}%`)
            .maybeSingle();

          // Delete if:
          // - Not referenced by any verification (orphaned)
          // - Or referenced by completed verification (should have been deleted)
          // - Or file is older than 7 days (stale)
          const fileAgeMs = file.created_at 
            ? Date.now() - new Date(file.created_at).getTime() 
            : Infinity;
          const isOlderThan7Days = fileAgeMs > 7 * 24 * 60 * 60 * 1000;

          if (!referencedVerification || 
              referencedVerification.status === "approved" || 
              referencedVerification.status === "rejected" ||
              isOlderThan7Days) {
            
            const { error: deleteError } = await supabase.storage
              .from("identity-selfies")
              .remove([filePath]);

            if (!deleteError) {
              deletedOrphanedFiles++;
              console.log(`Deleted orphaned/old selfie: ${filePath}`);
            }
          }
        }
      }
    }

    // 3. Delete old rejected verification records (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: deletedRecords, error: deleteRecordsError } = await supabase
      .from("identity_verifications")
      .delete()
      .eq("status", "rejected")
      .lt("updated_at", thirtyDaysAgo)
      .select("id");

    if (deleteRecordsError) {
      console.error("Error deleting old verification records:", deleteRecordsError);
    } else if (deletedRecords) {
      deletedOldVerifications = deletedRecords.length;
      console.log(`Deleted ${deletedOldVerifications} old rejected verification records`);
    }

    const summary = {
      success: true,
      deletedFromCompletedVerifications,
      deletedOrphanedFiles,
      deletedOldVerifications,
      totalDeleted: deletedFromCompletedVerifications + deletedOrphanedFiles,
      timestamp: new Date().toISOString(),
    };

    console.log("Cleanup completed:", summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Cleanup error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
