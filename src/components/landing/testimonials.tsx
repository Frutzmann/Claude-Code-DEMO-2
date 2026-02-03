import { AnimatedSection } from "./animated-section"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Quote } from "lucide-react"

const testimonials = [
  {
    quote:
      "Finally, thumbnails that actually get clicks. This tool paid for itself in the first week.",
    name: "Alex R.",
    role: "Gaming Channel",
    initials: "AR",
  },
  {
    quote:
      "I used to spend 2 hours per thumbnail. Now it's 5 minutes. Game changer.",
    name: "Sarah M.",
    role: "Tech Reviewer",
    initials: "SM",
  },
  {
    quote:
      "The AI understands what YouTube thumbnails need to look like. Impressive results every time.",
    name: "Mike T.",
    role: "Lifestyle Creator",
    initials: "MT",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-mesh">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <AnimatedSection>
            <h2 className="text-3xl font-display tracking-tight sm:text-4xl lg:text-5xl mb-4">
              What Creators Are Saying
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">
              Join thousands of YouTubers saving time
            </p>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <AnimatedSection key={testimonial.name} delay={index * 0.1}>
              <Card className="glass h-full card-hover">
                <CardContent className="pt-6">
                  <div className="size-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                    <Quote className="size-5 text-purple-400" />
                  </div>
                  <p className="text-sm leading-relaxed mb-6 font-body italic text-cream-50/90">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="border-2 border-purple-500/30">
                      <AvatarFallback className="bg-purple-500/20 text-purple-300 font-medium">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm font-display">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
