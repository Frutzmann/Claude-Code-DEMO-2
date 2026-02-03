"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Sparkles,
  Image as ImageIcon,
  User,
  Settings,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    disabled: false,
  },
  {
    name: "Generate",
    href: "/generate",
    icon: Sparkles,
    disabled: false,
  },
  {
    name: "Gallery",
    href: "/gallery",
    icon: ImageIcon,
    disabled: false,
  },
  {
    name: "Portraits",
    href: "/portraits",
    icon: User,
    disabled: false,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    disabled: true,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 glass border-r flex flex-col z-40 transition-transform duration-200",
          "md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border/50">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Thumbnail Factory</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.disabled ? "#" : item.href}
                onClick={(e) => {
                  if (item.disabled) e.preventDefault()
                  setMobileOpen(false)
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon className="size-5" />
                {item.name}
                {item.disabled && (
                  <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            YouTube Thumbnail Factory
          </p>
        </div>
      </aside>
    </>
  )
}
