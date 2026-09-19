import { redirect } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";
import { titleCaseName } from "@/lib/validation";
import Link from "next/link";
import {
  BarChart3,
  CreditCard,
  FileText,
  ListChecks,
  MessageSquare,
  Sparkles,
} from "lucide-react";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function RegistrarDashboard() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const supabase = createClient();

  const statuses = [
    "Pending",
    "Payment Verification",
    "Processing",
    "Ready for Pickup",
    "Completed",
  ] as const;
  const counts = await Promise.all(
    statuses.map((s) =>
      supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", s)
    )
  );

  const { count: pendingPayments } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pending");

  const quickActions = [
    { label: "Manage Requests", href: "/registrar/requests", Icon: ListChecks, tint: "bg-brand-50 text-brand-600" },
    { label: "Verify Payments", href: "/registrar/payments", Icon: CreditCard, tint: "bg-emerald-50 text-emerald-600" },
    { label: "Reports", href: "/registrar/reports", Icon: BarChart3, tint: "bg-indigo-50 text-indigo-600" },
    { label: "Messages", href: "/registrar/messages", Icon: MessageSquare, tint: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{greeting()},</p>
          <h2 className="text-2xl font-bold text-brand-900">{titleCaseName(profile.full_name)}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {pendingPayments ?? 0} payment{pendingPayments === 1 ? "" : "s"} waiting to be verified.
          </p>
        </div>
        <Link href="/registrar/payments" className="btn-primary flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Verify Payments
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {statuses.map((s, i) => (
          <Link key={s} href="/registrar/requests" className="card transition-shadow hover:shadow-md">
            <p className="text-sm text-slate-500">{s}</p>
            <p className="text-3xl font-bold text-brand-700">{counts[i].count ?? 0}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-brand-900">Tip</h3>
        </div>
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          <p>
            Good Moral and Diploma requests stay blocked in &ldquo;Processing&rdquo; until the
            guidance / admin approval comes in — the release buttons unlock themselves
            automatically.
          </p>
        </div>
      </div>
    </div>
  );
}