"use client"

import { motion } from "motion/react"
import { ReactNode } from "react"

interface AnimatedSectionProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function AnimatedSection({
  children,
  delay = 0,
  className,
}: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
