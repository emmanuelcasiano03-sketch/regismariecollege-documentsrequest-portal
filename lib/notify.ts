import { createClient } from "@/lib/supabase/client";
import { sendEmail } from "@/lib/email";

export async function sendNotification({
  senderId,
  receiverId,
  message,
  subject,
  html,
  link = "",
}: {
  senderId: string;
  receiverId: string;
  message: string;
  subject: string;
  html: string;
  link?: string;
}) {
  const supabase = createClient();

  await supabase.from("messages").insert({
    sender_id: senderId,
    receiver_id: receiverId,
    message,
  });

  try {
    await supabase.from("notifications").insert({
      user_id: receiverId,
      message,
      link,
    });
  } catch (err) {
    console.error("In-app notification insert error:", err);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", receiverId)
    .single();

  if (profile?.email) {
    try {
      await sendEmail({
        to: profile.email,
        subject,
        html,
      });
    } catch (err) {
      console.error("Email notification error:", err);
    }
  }
}