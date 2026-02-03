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
          className="glass rounded-2xl py-20 px-8 text-center relative overflow-hidden glow-border"
        >
          {/* Background gradient mesh */}
          <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />

          {/* Animated glow orbs */}
          <motion.div
            className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-purple-500/15 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative z-10">
            <h2 className="text-3xl font-display tracking-tight sm:text-4xl lg:text-5xl mb-4">
              Ready to Create{" "}
              <span className="text-gradient">Scroll-Stopping</span> Thumbnails?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 font-body">
              Start generating professional thumbnails in minutes. No credit
              card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-lg" />
                <Button asChild size="lg" className="relative purple-glow">
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
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
