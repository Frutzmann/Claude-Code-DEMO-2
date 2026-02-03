import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { GenerationDetailClient } from "./client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function GenerationDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch generation by ID (RLS ensures user can only see their own)
  const { data: generation, error: generationError } = await supabase
    .from("generations")
    .select("*")
    .eq("id", id)
    .single()

  if (generationError || !generation) {
    notFound()
  }

  // Fetch all thumbnails for this generation
  const { data: thumbnails, error: thumbnailsError } = await supabase
    .from("thumbnails")
    .select("*")
    .eq("generation_id", id)
    .order("background_index", { ascending: true })
    .order("prompt_index", { ascending: true })

  if (thumbnailsError) {
    console.error("Error fetching thumbnails:", thumbnailsError)
  }

  return (
    <GenerationDetailClient
      generation={generation}
      thumbnails={thumbnails || []}
    />
  )
}
