import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserNav } from "@/components/dashboard/user-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get profile for avatar_url
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen">
      <Sidebar />

      {/* Main content area */}
      <div className="md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 glass border-b">
          <div className="flex h-16 items-center justify-end px-4 md:px-6">
            <UserNav
              user={{
                email: user.email || "",
                fullName: profile?.full_name || undefined,
                avatarUrl: profile?.avatar_url || undefined,
              }}
            />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
