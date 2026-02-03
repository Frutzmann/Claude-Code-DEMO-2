"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { completeOnboarding } from "@/actions/onboarding"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Check, Upload, ImageIcon, Sparkles, Loader2, ArrowRight } from "lucide-react"

const steps = [
  {
    title: "Upload your portrait",
    description: "Your portrait will be used as the base for AI-generated thumbnails",
    icon: Upload,
    completed: true,
  },
  {
    title: "Add background images and keywords",
    description: "Provide visual context and descriptions for your thumbnails",
    icon: ImageIcon,
    completed: false,
  },
  {
    title: "Get AI-generated thumbnails",
    description: "Our AI combines your portrait with your ideas to create stunning thumbnails",
    icon: Sparkles,
    completed: false,
  },
]

export function WelcomeTutorial() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGetStarted = async () => {
    setLoading(true)

    try {
      const result = await completeOnboarding()

      if (result.error) {
        throw new Error(result.error)
      }

      toast.success("Welcome aboard! Let's create some thumbnails!")
      router.push("/dashboard")
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {steps.map((step, index) => {
          const Icon = step.icon

          return (
            <div
              key={index}
              className={`
                flex gap-4 p-4 rounded-lg transition-colors
                ${step.completed ? "bg-primary/10" : "bg-muted/30"}
              `}
            >
              <div
                className={`
                  flex-shrink-0 size-12 rounded-full flex items-center justify-center
                  ${step.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                `}
              >
                {step.completed ? (
                  <Check className="size-6" />
                ) : (
                  <Icon className="size-6" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="font-medium flex items-center gap-2">
                  {step.title}
                  {step.completed && (
                    <span className="text-xs text-primary font-normal">
                      Done
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-4">
        <Button
          onClick={handleGetStarted}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Getting started...
            </>
          ) : (
            <>
              Get Started
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
