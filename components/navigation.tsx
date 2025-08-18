"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/", label: "Random Picker" },
  { href: "/add", label: "Add Question" },
  { href: "/problems", label: "All Problems" },
  { href: "/dashboard", label: "Dashboard" },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-primary/20 bg-card/80 backdrop-blur-sm glow-primary">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-primary bg-clip-text">
            DSA Question Picker
          </Link>

          <div className="flex gap-2">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "default" : "ghost"}
                asChild
                className={pathname === item.href ? "glow-accent" : ""}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
