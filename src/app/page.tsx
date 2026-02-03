import type { Metadata } from "next"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Pricing } from "@/components/landing/pricing"
import { Testimonials } from "@/components/landing/testimonials"
import { CTA } from "@/components/landing/cta"

export const metadata: Metadata = {
  title: "YouTube Thumbnail Factory - AI-Powered Thumbnails in Seconds",
  description:
    "Generate professional YouTube thumbnails without design skills. Upload your portrait, add backgrounds, and let AI create scroll-stopping thumbnails.",
  openGraph: {
    title: "YouTube Thumbnail Factory - AI-Powered Thumbnails in Seconds",
    description:
      "Generate professional YouTube thumbnails without design skills. Upload your portrait, add backgrounds, and let AI create scroll-stopping thumbnails.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <CTA />
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <p>
          &copy; {new Date().getFullYear()} YouTube Thumbnail Factory. All
          rights reserved.
        </p>
      </footer>
    </main>
  )
}
