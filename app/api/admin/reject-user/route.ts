import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { userId, fullName, email, reason } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing user id." }, { status: 400 });

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const adminClient = getAdminClient();

    // Persist the rejection reason first: the account (and its profile row)
    // is deleted on the line below, so this log keeps an audit trail.
    const { error: logError } = await adminClient.from("account_rejections").insert({
      profile_id: userId,
      full_name: fullName ?? null,
      email: email ?? null,
      reason: reason ?? null,
      rejected_by: user.id,
    });
    if (logError) {
      console.error("Failed to log account rejection:", logError.message);
    }

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reject user error:", err);
    return NextResponse.json({ error: "Failed to reject user." }, { status: 500 });
  }
}