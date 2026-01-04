// src/components/Header.tsx

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react" // Removed Menu import
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "../contexts/AuthContext"
import { LoginModal } from "./LoginModal"
import { RegisterModal } from "./RegisterModal"

export default function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/custom-draw", label: "Custom Draw" },
    { href: "/about", label: "About Us" },
  ]

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const switchToRegister = () => {
    setIsLoginModalOpen(false)
    setIsRegisterModalOpen(true)
  }

  const switchToLogin = () => {
    setIsRegisterModalOpen(false)
    setIsLoginModalOpen(true)
  }

  return (
    <>
      <header className="glass-effect sticky top-0 z-50 border-b border-white/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Left side - Direct Navigation Buttons */}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className={`text-white hover:bg-white/20 transition-colors ${
                  pathname === item.href 
                    ? "bg-white/20 font-medium" 
                    : "text-white/80"
                }`}
              >
                <Link href={item.href}>
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>

          {/* Center - Title */}
          <div className="flex-1 flex justify-center">
            <h1 className="text-xl font-bold text-white gradient-text hidden md:block">
              Automata Visualizer
            </h1>
            {/* Show smaller text on mobile if needed, or keep hidden/adjusted */}
            <h1 className="text-lg font-bold text-white gradient-text md:hidden">
              AV
            </h1>
          </div>

          {/* Right side - Auth button */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  variant="outline"
                >
                  <User className="w-5 h-5 mr-2" />
                  <span className="max-w-[100px] truncate hidden sm:inline">{user?.email}</span>
                  <span className="sm:hidden">Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 glass-effect border-white/20 bg-black/80">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-white hover:bg-white/20 hover:text-white cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              variant="outline"
            >
              <User className="w-5 h-5 mr-2" />
              <span>Login</span>
            </Button>
          )}
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={switchToRegister}
      />

      {/* Register Modal */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={switchToLogin}
      />
    </>
  )
}