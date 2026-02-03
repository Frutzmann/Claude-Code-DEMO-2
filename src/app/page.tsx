import type { Metadata } from "next"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"

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
      <div id="features" className="py-24" />
      <div id="pricing" className="py-24" />
      <div id="testimonials" className="py-24" />
    </main>
  )
}
