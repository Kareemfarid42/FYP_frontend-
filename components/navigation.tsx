"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, Users, Package, Mail, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// This is similar to a Master Page or Site.Master in ASP.NET
export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/users", label: "Users", icon: Users },
    { href: "/products", label: "Products", icon: Package },
    { href: "/contact", label: "Contact", icon: Mail },
  ]

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link key={item.href} href={item.href}>
            <Button variant={isActive ? "default" : "ghost"} className="w-full justify-start">
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-muted/20 border-r min-h-screen p-4">
        <div className="mb-8">
          <h2 className="text-lg font-semibold">React Web App</h2>
          <p className="text-sm text-muted-foreground">ASP.NET Developer Friendly</p>
        </div>
        <div className="space-y-2">
          <NavLinks />
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="mb-8">
                <h2 className="text-lg font-semibold">React Web App</h2>
                <p className="text-sm text-muted-foreground">ASP.NET Developer Friendly</p>
              </div>
              <div className="space-y-2">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="ml-4 text-lg font-semibold">React Web App</h1>
        </div>
      </div>
    </>
  )
}
