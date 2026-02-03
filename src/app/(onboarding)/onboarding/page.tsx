import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PortraitUploadClient } from "./client"

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Upload Your Portrait</h2>
        <p className="text-muted-foreground">
          This image will be used in your generated thumbnails
        </p>
      </div>

      <PortraitUploadClient userId={user.id} />
    </div>
  )
}
