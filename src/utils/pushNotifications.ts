import { supabase } from "@/integrations/supabase/client";

interface SendPushParams {
  profileId: string;
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  quedadaId?: string;
}

export async function sendPushNotification({
  profileId,
  title,
  body,
  url,
  tag,
  quedadaId,
}: SendPushParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        profile_id: profileId,
        title,
        body,
        url,
        tag,
        quedada_id: quedadaId,
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
