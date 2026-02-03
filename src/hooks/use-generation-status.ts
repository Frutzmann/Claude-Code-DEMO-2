"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface Generation {
  id: string
  user_id: string
  portrait_id: string | null
  portrait_url: string
  keywords: string
  background_count: number
  status: string
  progress: number | null
  current_step: string | null
  thumbnail_count: number | null
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

interface UseGenerationStatusOptions {
  generationId: string
  onComplete?: (generation: Generation) => void
  onError?: (error: string) => void
}

export function useGenerationStatus({
  generationId,
  onComplete,
  onError,
}: UseGenerationStatusOptions) {
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Use refs to prevent stale closures in useEffect
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onErrorRef.current = onError
  }, [onComplete, onError])

  useEffect(() => {
    // Initial fetch
    const fetchGeneration = async () => {
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("id", generationId)
        .single()

      if (error) {
        console.error("Error fetching generation:", error)
        onErrorRef.current?.(error.message)
        setIsLoading(false)
        return
      }

      setGeneration(data)

      // Check if already completed/failed
      if (data.status === "completed" || data.status === "partial") {
        onCompleteRef.current?.(data)
      } else if (data.status === "failed") {
        onErrorRef.current?.(data.error_message || "Generation failed")
      }

      setIsLoading(false)
    }

    fetchGeneration()

    // Subscribe to Realtime updates
    const channel = supabase
      .channel(`generation-${generationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "generations",
          filter: `id=eq.${generationId}`,
        },
        (payload) => {
          const updated = payload.new as Generation
          setGeneration(updated)

          if (updated.status === "completed" || updated.status === "partial") {
            onCompleteRef.current?.(updated)
          } else if (updated.status === "failed") {
            onErrorRef.current?.(updated.error_message || "Generation failed")
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [generationId, supabase])

  return { generation, isLoading }
}
