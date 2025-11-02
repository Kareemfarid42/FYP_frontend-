"use client"

import type React from "react"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu } from "lucide-react"

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

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
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        {/* Left side - Menu button */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white hover:bg-white/20 p-2 rounded-md transition-colors"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </button>

          {isMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-black/80 backdrop-blur-md border border-white/20 rounded-md shadow-lg">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 text-white hover:bg-white/20 transition-colors ${
                    location.pathname === item.href ? "bg-white/30 font-medium" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Center - Title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
            Automata Visualizer
          </h1>
        </div>

        {/* Right side - Google login button */}
        <button
          onClick={handleGoogleLogin}
          className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm px-4 py-2 rounded-md transition-colors flex items-center gap-2"
        >
          <img src="/api/placeholder/20/20" alt="Google" className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>
      </div>
    </header>
  )
}

export default Header
