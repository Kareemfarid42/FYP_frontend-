"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function Header() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/custom-draw", label: "Custom Draw" },
    { href: "/about", label: "About Us" },
  ]

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth login
    alert("Google login will be implemented here")
  }

  return (
    <header className="glass-effect sticky top-0 z-50 border-b border-white/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left side - Menu button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 glass-effect border-white/20 bg-black/80">
            {navItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className={`w-full text-white hover:bg-white/20 hover:text-white ${
                    pathname === item.href ? "bg-white/30 font-medium text-white" : "text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Center - Title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-xl font-bold text-white gradient-text">Automata Visualizer</h1>
        </div>

        {/* Right side - Google login button */}
        <Button
          onClick={handleGoogleLogin}
          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
          variant="outline"
        >
          <img src="/google.png?height=20&width=20" alt="Google" className="w-5 h-5 mr-2" />
          <span>Continue with Google</span>
        </Button>
      </div>
    </header>
  )
}
