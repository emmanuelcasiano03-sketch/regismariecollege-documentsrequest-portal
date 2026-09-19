import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import PortalShell from "@/components/PortalShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  if (!profile) redirect("/login");

  return (
    <PortalShell role={profile.role} fullName={profile.full_name} userId={profile.id}>
      {children}
    </PortalShell>
  );
}
