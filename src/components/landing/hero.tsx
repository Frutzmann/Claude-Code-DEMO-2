"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="min-h-[90vh] flex items-center justify-center pt-20 bg-mesh relative overflow-hidden">
      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl lg:text-7xl font-display tracking-tight"
        >
          <span className="text-gradient">Scroll-Stopping Thumbnails</span>
          <span className="block text-muted-foreground mt-2 text-3xl md:text-4xl lg:text-5xl font-body font-light">
            In Seconds, Not Hours
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-body"
        >
          Upload your portrait, add backgrounds, enter keywords. Our AI creates
          professional thumbnails while you focus on content.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <div className="relative">
            {/* Glow effect behind primary CTA */}
            <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-lg" />
            <Button size="lg" className="relative purple-glow" asChild>
              <Link href="/signup">
                Start Free
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
          <Button variant="outline" size="lg" asChild>
            <a href="#pricing">View Pricing</a>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
