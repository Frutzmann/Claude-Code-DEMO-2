import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ImageIcon, User } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get profile for welcome message
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id)
    .single()

  const firstName = profile?.full_name?.split(" ")[0] || "there"

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground mt-1">
          Ready to create some stunning thumbnails?
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Generations
            </CardTitle>
            <Sparkles className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              thumbnails created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              This Month
            </CardTitle>
            <ImageIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              generations used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Portraits
            </CardTitle>
            <User className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              portraits uploaded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Sparkles className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl mb-2">No thumbnails yet</CardTitle>
          <CardDescription className="text-center max-w-sm mb-6">
            Generate your first thumbnails to see them here. Upload background images and add keywords to get started.
          </CardDescription>
          <Button asChild disabled>
            <Link href="/generate">
              <Sparkles className="size-4" />
              Generate Thumbnails
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
