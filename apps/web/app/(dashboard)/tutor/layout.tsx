import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TutorShell } from "@/components/tutor/tutor-shell";
import { Toaster } from "@/components/ui/sonner";

export default async function TutorLayout({
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

  if (!profile || profile.role !== "tutor") {
    redirect("/admin");
  }

  return (
    <TutorShell tutorName={profile.full_name}>
      {children}
      <Toaster />
    </TutorShell>
  );
}
