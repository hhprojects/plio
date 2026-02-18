import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profile?.role === 'super_admin') {
      redirect('/admin/platform')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Welcome to Plio. Select a section from the sidebar to get started.
      </p>
    </div>
  )
}
