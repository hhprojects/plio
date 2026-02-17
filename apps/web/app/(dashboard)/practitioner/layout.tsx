import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PractitionerShell } from "@/components/practitioner/practitioner-shell";
import { Toaster } from "@/components/ui/sonner";

export default async function PractitionerLayout({
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
    .select("id, role, full_name")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "practitioner") {
    redirect("/admin");
  }

  return (
    <PractitionerShell practitionerName={profile.full_name}>
      {children}
      <Toaster />
    </PractitionerShell>
  );
}
