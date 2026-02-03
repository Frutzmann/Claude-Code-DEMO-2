"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Testimonials", href: "#testimonials" },
]

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight hover:text-foreground/80 transition-colors"
        >
          Thumbnail Factory
        </Link>

        {/* Nav Links - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
