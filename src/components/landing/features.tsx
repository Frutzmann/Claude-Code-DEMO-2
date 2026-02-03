import { AnimatedSection } from "./animated-section"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Sparkles, Zap, Image, Download, Shield, Clock } from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description:
      "Gemini creates compelling prompts, Kie.ai renders stunning visuals",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "From upload to download in under 5 minutes",
  },
  {
    icon: Image,
    title: "Professional Quality",
    description: "Thumbnails that stand out in the YouTube feed",
  },
  {
    icon: Download,
    title: "Easy Downloads",
    description: "Download individually or batch export as ZIP",
  },
  {
    icon: Shield,
    title: "Secure Storage",
    description: "Your portraits and thumbnails stored safely",
  },
  {
    icon: Clock,
    title: "Save Hours",
    description: "No design skills needed, no Photoshop required",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <AnimatedSection>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Professional thumbnails without the complexity
            </p>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <AnimatedSection key={feature.title} delay={index * 0.1}>
              <Card className="glass h-full">
                <CardHeader>
                  <feature.icon className="size-10 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
