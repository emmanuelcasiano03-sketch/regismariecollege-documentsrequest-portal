import { redirect } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";
import { titleCaseName } from "@/lib/validation";
import Link from "next/link";
import { ClipboardCheck, MessageSquare, ShieldCheck } from "lucide-react";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function GuidanceDashboard() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const supabase = createClient();

  const { count: pending } = await supabase
    .from("requests")
    .select("*, documents!inner(name)", { count: "exact", head: true })
    .eq("documents.name", "Good Moral Certificate")
    .eq("guidance_status", "Pending");

  const { count: approved } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("guidance_status", "Approved");

  const { count: rejected } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("guidance_status", "Rejected");

  const quickActions = [
    { label: "Good Moral Approvals", href: "/guidance/approvals", Icon: ClipboardCheck, tint: "bg-brand-50 text-brand-600" },
    { label: "Messages", href: "/guidance/messages", Icon: MessageSquare, tint: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{greeting()},</p>
          <h2 className="text-2xl font-bold text-brand-900">{titleCaseName(profile.full_name)}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Good Moral Certificate requests need your approval before release.
          </p>
        </div>
        <Link href="/guidance/approvals" className="btn-primary flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" />
          Review Requests
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">Awaiting Review</p>
          <p className="text-3xl font-bold text-amber-600">{pending ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Approved</p>
          <p className="text-3xl font-bold text-emerald-600">{approved ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{rejected ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href} className="card flex items-center gap-3 transition-shadow hover:shadow-md">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.tint}`}>
              <a.Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-brand-900">{a.label}</p>
              <p className="text-xs text-slate-500">Go to {a.label.toLowerCase()}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          <p>
            Approving here only unlocks the request — the registrar still handles the
            release and pickup once it&apos;s ready.
          </p>
        </div>
      </div>
    </div>
  );
}