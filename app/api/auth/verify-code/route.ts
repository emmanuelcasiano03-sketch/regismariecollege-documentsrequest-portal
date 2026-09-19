import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = getAdminClient();
    const { email, code } = await req.json();
    if (!email || !code) return NextResponse.json({ error: "Email and code are required." }, { status: 400 });

    const { data: reset } = await supabase
      .from("password_resets")
      .select("id")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!reset) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }

    await supabase.from("password_resets").update({ used: true }).eq("id", reset.id);

    const token = crypto.randomUUID();
    await supabase.from("password_resets").update({ code: token }).eq("id", reset.id);

    return NextResponse.json({ token, email });
  } catch {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
  }
}
