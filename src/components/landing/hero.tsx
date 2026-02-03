"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center pt-20">
      <div className="container mx-auto px-4 text-center">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
        >
          Scroll-Stopping Thumbnails
          <span className="block text-muted-foreground mt-2">
            In Seconds, Not Hours
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Upload your portrait, add backgrounds, enter keywords. Our AI creates
          professional thumbnails while you focus on content.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="lg" asChild>
            <Link href="/signup">
              Start Free
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="#pricing">View Pricing</a>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
