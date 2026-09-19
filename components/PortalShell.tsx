"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPageTitle } from "@/lib/page-titles";
import NotificationBell from "./NotificationBell";
import { titleCaseName } from "@/lib/validation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardCheck,
  Clock,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Upload,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";

type Role = "student" | "registrar" | "admin" | "guidance";

const NAV: Record<Role, { label: string; href: string; icon: LucideIcon }[]> = {
  student: [
    { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { label: "New Request", href: "/student/new-request", icon: PlusCircle },
    { label: "My History", href: "/student/history", icon: Clock },
    { label: "My Payments", href: "/student/payments", icon: CreditCard },
    { label: "Messages", href: "/student/messages", icon: MessageSquare },
    { label: "My Profile", href: "/student/profile", icon: User },
  ],
  registrar: [
    { label: "Dashboard", href: "/registrar/dashboard", icon: LayoutDashboard },
    { label: "Manage Requests", href: "/registrar/requests", icon: FileText },
    { label: "Verify Payments", href: "/registrar/payments", icon: CreditCard },
    { label: "Messages", href: "/registrar/messages", icon: MessageSquare },
    { label: "Reports", href: "/registrar/reports", icon: BarChart3 },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Pending Approvals", href: "/admin/approvals", icon: UserCheck },
    { label: "Manage Users", href: "/admin/users", icon: Users },
    { label: "Import Past Records", href: "/admin/import-records", icon: Upload },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Messages", href: "/admin/messages", icon: MessageSquare },
    { label: "Reports", href: "/admin/reports", icon: FileText },
  ],
  guidance: [
    { label: "Dashboard", href: "/guidance/dashboard", icon: LayoutDashboard },
    { label: "Good Moral Approvals", href: "/guidance/approvals", icon: ClipboardCheck },
    { label: "Messages", href: "/guidance/messages", icon: MessageSquare },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  student: "Student / Alumni",
  registrar: "Registrar Office",
  admin: "System Administrator",
  guidance: "Guidance Department",
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "R";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PortalShell({
  role,
  fullName,
  userId,
  children,
}: {
  role: Role;
  fullName: string;
  userId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const title = getPageTitle(pathname);
  const nav = NAV[role];

  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let mounted = true;
    async function fetchUnread() {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("is_read", false);
      if (mounted) setUnreadCount(count ?? 0);
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    const onRead = () => fetchUnread();
    window.addEventListener("messages-read", onRead);
    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("messages-read", onRead);
    };
  }, [userId, supabase]);

  function handleRefresh() {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    window.setTimeout(() => setRefreshing(false), 700);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function renderNavLinks(className: string, row: boolean) {
    return (
      <ul className={`${row ? "flex items-center gap-1" : "space-y-1"} ${className}`}>
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  row
                    ? active
                      ? "bg-brand-50 text-brand-900"
                      : "text-brand-100 hover:bg-white/10 hover:text-white"
                    : active
                      ? "bg-white/15 text-white shadow-inner"
                      : "text-brand-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.label === "Messages" && unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-950 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setDrawerOpen((o) => !o)}
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
              aria-label="Toggle menu"
            >
              {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <Image src="/rmclogo.jpg" alt="Regis Marie College" width={28} height={28} className="rounded-md" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold leading-tight text-white">Regis Marie College</p>
                <p className="text-[11px] text-brand-200">Document Request System</p>
              </div>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:block" aria-label="Main">
            {renderNavLinks("", true)}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-lg p-2 text-brand-200 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-wait"
              aria-label="Refresh this page"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <NotificationBell userId={userId} role={role} />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg p-1.5 pr-2 transition-colors hover:bg-white/10"
                aria-label="Account menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-bold text-brand-950">
                  {initialsOf(fullName)}
                </span>
                <span className="hidden text-left md:block">
                  <span className="block max-w-[140px] truncate text-sm font-semibold text-white">
                    {titleCaseName(fullName)}
                  </span>
                  <span className="block text-[10px] text-brand-300">{ROLE_LABEL[role]}</span>
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-brand-100 bg-white shadow-lg">
                  <div className="border-b border-brand-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-brand-900">
                      {titleCaseName(fullName)}
                    </p>
                    <p className="text-xs text-slate-500">{ROLE_LABEL[role]}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href={
                        role === "student"
                          ? "/student/profile"
                          : role === "admin"
                            ? "/admin/users"
                            : role === "registrar"
                              ? "/registrar/requests"
                              : "/guidance/approvals"
                      }
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-brand-50"
                    >
                      <User className="h-4 w-4 text-brand-500" />
                      {role === "student" ? "My Profile" : "Workspace"}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col
          bg-gradient-to-b from-brand-950 via-brand-900 to-brand-700 text-white shadow-sidebar
          transition-transform duration-300 ease-in-out lg:hidden
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <Image src="/rmclogo.jpg" alt="Regis Marie College" width={28} height={28} className="rounded-md" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Regis Marie College</p>
            <p className="text-[11px] text-brand-200">Document Request System</p>
          </div>
        </div>
        <nav className="mt-3 flex-1 overflow-y-auto px-3">
          {renderNavLinks("", false)}
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <p className="truncate text-sm font-semibold">{titleCaseName(fullName)}</p>
          <p className="mb-3 text-xs text-brand-200">{ROLE_LABEL[role]}</p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-brand-900">{title}</h1>
        </div>
        <main key={refreshKey}>{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t border-brand-100 bg-white py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 text-xs text-slate-400 sm:px-6">
          <p>&copy; {new Date().getFullYear()} Regis Marie College. All rights reserved.</p>
          <p>Document Request System</p>
        </div>
      </footer>
    </div>
  );
}