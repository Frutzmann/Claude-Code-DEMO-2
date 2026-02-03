import { AnimatedSection } from "./animated-section"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Get started with 5 thumbnails",
    features: [
      "5 generations per month",
      "All AI models included",
      "HD downloads",
      "Basic support",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    description: "Perfect for active creators",
    features: [
      "50 generations per month",
      "All AI models included",
      "HD downloads",
      "Priority support",
      "Batch ZIP download",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$49",
    description: "For teams and power users",
    features: [
      "200 generations per month",
      "All AI models included",
      "HD downloads",
      "Priority support",
      "Batch ZIP download",
      "API access (coming soon)",
    ],
    cta: "Go Agency",
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <AnimatedSection>
            <h2 className="text-3xl font-display tracking-tight sm:text-4xl lg:text-5xl mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">
              Start free, upgrade when you&apos;re ready
            </p>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <AnimatedSection key={tier.name} delay={index * 0.15}>
              <Card
                className={cn(
                  "glass h-full relative flex flex-col",
                  tier.highlighted && "glow-border purple-glow"
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-purple-500 text-cream-50 text-xs font-medium px-3 py-1 rounded-full shadow-lg shadow-purple-500/30">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-xl font-display">
                    {tier.name}
                  </CardTitle>
                  <CardDescription className="font-body">
                    {tier.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold font-display">
                      {tier.price}
                    </span>
                    <span className="text-muted-foreground font-body">
                      /month
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="size-5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="size-3 text-purple-400" />
                        </div>
                        <span className="text-sm font-body">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    variant={tier.highlighted ? "default" : "outline"}
                    className="w-full"
                  >
                    <Link href="/signup">{tier.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
