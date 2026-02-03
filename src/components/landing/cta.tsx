"use client"

import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTA() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl py-20 px-8 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Ready to Create Scroll-Stopping Thumbnails?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Start generating professional thumbnails in minutes. No credit
              card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="#pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
