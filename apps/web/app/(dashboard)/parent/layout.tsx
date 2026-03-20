import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParentShell } from "@/components/parent/parent-shell";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id, full_name")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "client") {
    redirect("/admin");
  }

  // Fetch tenant name for the header
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", profile.tenant_id)
    .single();

  return (
    <ParentShell
      tenantName={tenant?.name ?? "Plio"}
    >
      {children}
    </ParentShell>
  );
}
