import { redirect } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";
import { titleCaseName } from "@/lib/validation";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function AdminDashboard() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const supabase = createClient();

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  const { count: requestCount } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true });
  const { count: pendingPayments } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pending");
  const { count: pendingApprovals } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_active", false);

  const quickActions = [
    { label: "Pending Approvals", href: "/admin/approvals", Icon: UserCheck, tint: "bg-amber-50 text-amber-600" },
    { label: "Manage Users", href: "/admin/users", Icon: Users, tint: "bg-brand-50 text-brand-600" },
    { label: "Analytics", href: "/admin/analytics", Icon: TrendingUp, tint: "bg-indigo-50 text-indigo-600" },
    { label: "Import Past Records", href: "/admin/import-records", Icon: Upload, tint: "bg-emerald-50 text-emerald-600" },
    { label: "Reports", href: "/admin/reports", Icon: BarChart3, tint: "bg-sky-50 text-sky-600" },
    { label: "Messages", href: "/admin/messages", Icon: FileText, tint: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{greeting()},</p>
          <h2 className="text-2xl font-bold text-brand-900">{titleCaseName(profile.full_name)}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Institution-wide snapshot at a glance.
          </p>
        </div>
        <Link href="/admin/approvals" className="btn-primary flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Review Approvals
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Link href="/admin/users" className="card transition-shadow hover:shadow-md">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="text-3xl font-bold text-brand-700">{userCount ?? 0}</p>
        </Link>
        <Link href="/admin/approvals" className="card transition-shadow hover:shadow-md">
          <p className="text-sm text-slate-500">Pending Approvals</p>
          <p className="text-3xl font-bold text-amber-600">{pendingApprovals ?? 0}</p>
        </Link>
        <Link href="/admin/analytics" className="card transition-shadow hover:shadow-md">
          <p className="text-sm text-slate-500">Total Requests</p>
          <p className="text-3xl font-bold text-brand-700">{requestCount ?? 0}</p>
        </Link>
        <Link href="/registrar/payments" className="card transition-shadow hover:shadow-md">
          <p className="text-sm text-slate-500">Pending Payments</p>
          <p className="text-3xl font-bold text-brand-700">{pendingPayments ?? 0}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}