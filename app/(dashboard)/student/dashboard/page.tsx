import { redirect } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";
import { titleCaseName } from "@/lib/validation";
import type { RecentRequest } from "@/lib/types";
import Link from "next/link";
import {
  Clock,
  CreditCard,
  FileText,
  PlusCircle,
  Sparkles,
} from "lucide-react";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function StudentDashboard() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const supabase = createClient();

  const { count: totalRequests } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id);

  const { count: openRequests } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .in("status", ["Pending", "Payment Verification", "Processing"]);

  const { count: readyPickup } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("status", "Ready for Pickup");

  const { data: recent } = await supabase
    .from("requests")
    .select("id, tracking_code, status, created_at, documents(name)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const typedRecent = (recent ?? []) as unknown as RecentRequest[];

  const quickActions = [
    { label: "New Request", href: "/student/new-request", Icon: PlusCircle, tint: "bg-brand-50 text-brand-600" },
    { label: "My History", href: "/student/history", Icon: Clock, tint: "bg-indigo-50 text-indigo-600" },
    { label: "My Payments", href: "/student/payments", Icon: CreditCard, tint: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {greeting()},
          </p>
          <h2 className="text-2xl font-bold text-brand-900">{titleCaseName(profile.full_name)}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {profile.course ? `${profile.course} · ` : ""}
            Student no. {profile.student_number ?? "—"}
          </p>
        </div>
        <Link href="/student/new-request" className="btn-primary flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          New Request
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">Total Requests</p>
          <p className="text-3xl font-bold text-brand-700">{totalRequests ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="text-3xl font-bold text-amber-600">{openRequests ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Ready for Pickup</p>
          <p className="text-3xl font-bold text-emerald-600">{readyPickup ?? 0}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href} className="card flex items-center gap-3 transition-shadow hover:shadow-md">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.tint}`}>
              <a.Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-brand-900">{a.label}</p>
              <p className="text-xs text-slate-500">Open the {a.label.toLowerCase()} page</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent requests */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-brand-900">Recent Requests</h3>
          {typedRecent.length > 0 && (
            <Link href="/student/history" className="text-sm font-medium text-brand-600 hover:underline">
              View All →
            </Link>
          )}
        </div>
        {!typedRecent || typedRecent.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Sparkles className="mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">
              No requests yet. Use &ldquo;New Request&rdquo; to get started.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {typedRecent.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                    <FileText className="h-4 w-4 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{r.documents?.name}</p>
                    <p className="text-xs text-slate-500">{r.tracking_code}</p>
                  </div>
                </div>
                <span className="badge bg-brand-50 text-brand-700">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}