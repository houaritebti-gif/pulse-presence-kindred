import { supabase } from "@/integrations/supabase/client";

interface SendPushParams {
  profileId: string;
  title: string;
  body?: string;
  url?: string;
  tag?: string;
}

export async function sendPushNotification({
  profileId,
  title,
  body,
  url,
  tag,
}: SendPushParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        profile_id: profileId,
        title,
        body,
        url,
        tag,
      },
    });

    if (error) {
      console.error("Error sending push notification:", error);
      return false;
    }

    console.log("Push notification result:", data);
    return data?.sent > 0;
  } catch (error) {
    console.error("Error invoking push function:", error);
    return false;
  }
}
