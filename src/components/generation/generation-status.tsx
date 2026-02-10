"use client"

import { useRouter } from "next/navigation"
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useGenerationStatus } from "@/hooks/use-generation-status"

interface GenerationStatusProps {
  generationId: string
  onNewGeneration: () => void
}

export function GenerationStatus({
  generationId,
  onNewGeneration,
}: GenerationStatusProps) {
  const router = useRouter()

  const { generation, isLoading } = useGenerationStatus({
    generationId,
    onComplete: (gen) => {
      const count = gen.thumbnail_count || 0
      if (gen.status === "partial") {
        toast.warning(`Generated ${count} thumbnails with some failures`)
      } else {
        toast.success(`Generated ${count} thumbnails!`)
      }
      // Redirect to gallery view for this generation
      router.push(`/gallery/${generationId}`)
    },
    onError: (error) => {
      toast.error(error)
    },
  })

  if (isLoading || !generation) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const statusConfig: Record<
    string,
    { icon: typeof Clock; label: string; color: string; animate?: boolean }
  > = {
    pending: {
      icon: Clock,
      label: "Queued",
      color: "text-muted-foreground",
    },
    processing: {
      icon: Loader2,
      label: "Generating",
      color: "text-primary",
      animate: true,
    },
    completed: {
      icon: CheckCircle,
      label: "Complete",
      color: "text-green-500",
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      color: "text-destructive",
    },
    partial: {
      icon: AlertTriangle,
      label: "Partial Success",
      color: "text-yellow-500",
    },
  }

  const config = statusConfig[generation.status] || statusConfig.pending
  const Icon = config.icon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon
            className={`size-5 ${config.color} ${config.animate ? "animate-spin" : ""}`}
          />
          {config.label}
        </CardTitle>
        <CardDescription>
          {generation.status === "processing" &&
            "Your thumbnails are being generated. This usually takes 3-7 minutes."}
          {generation.status === "pending" &&
            "Your request is queued and will start processing shortly."}
          {generation.status === "completed" &&
            "Redirecting to your gallery..."}
          {generation.status === "failed" &&
            "Something went wrong during generation."}
          {generation.status === "partial" &&
            "Some thumbnails were generated successfully."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar for processing */}
        {generation.status === "processing" && (
          <div className="space-y-2">
            <Progress value={generation.progress || 0} />
            <p className="text-sm text-muted-foreground text-center">
              {generation.current_step || "Processing..."}
            </p>
          </div>
        )}

        {/* Error message for failed */}
        {generation.status === "failed" && generation.error_message && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              {generation.error_message}
            </p>
          </div>
        )}

        {/* Generation details */}
        <div className="space-y-2 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Keywords</span>
            <span className="font-medium truncate max-w-[200px]">
              {generation.keywords}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Background images</span>
            <span className="font-medium">{generation.background_count || "None"}</span>
          </div>
          {generation.thumbnail_count !== null && generation.thumbnail_count > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Thumbnails generated</span>
              <span className="font-medium text-green-500">
                {generation.thumbnail_count}
              </span>
            </div>
          )}
        </div>

        {/* Actions for failed state */}
        {generation.status === "failed" && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onNewGeneration}
              className="flex-1"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Actions for partial success */}
        {generation.status === "partial" && (
          <div className="flex gap-3">
            <Button
              onClick={() => router.push(`/gallery/${generationId}`)}
              className="flex-1"
            >
              View Thumbnails
            </Button>
            <Button
              variant="outline"
              onClick={onNewGeneration}
            >
              New Generation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
