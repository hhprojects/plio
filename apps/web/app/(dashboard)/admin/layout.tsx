import { AdminShell } from "@/components/admin/admin-shell";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";
import type { BusinessType, UserRole } from "@plio/db";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: UserRole = "admin";
  let businessType: BusinessType = "education";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, tenant_id")
      .eq("user_id", user.id)
      .single();
    if (profile?.role) {
      userRole = profile.role as UserRole;
    }
    if (profile?.tenant_id) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("business_type")
        .eq("id", profile.tenant_id)
        .single();
      if (tenant?.business_type) {
        businessType = tenant.business_type as BusinessType;
      }
    }
  }

  return (
    <AdminShell userRole={userRole} businessType={businessType}>
      {children}
      <Toaster />
    </AdminShell>
  );
}
