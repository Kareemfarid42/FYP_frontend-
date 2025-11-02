import type React from "react"
import { Target, Lightbulb, Sparkles, Zap, Heart } from "lucide-react"

const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Sparkles className="h-16 w-16 text-blue-400 animate-pulse" />
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
          About Automata Visualizer
        </h1>
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <p className="text-xl text-white font-medium">
            Empowering students and researchers to understand finite state automata through interactive visualization
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 mb-8">
        <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-white text-lg font-semibold mb-4">
            <Target className="h-5 w-5 text-blue-400" />
            Our Mission
          </h3>
          <p className="text-white/95">
            We believe that complex theoretical concepts in computer science should be accessible and engaging. Our
            mission is to bridge the gap between abstract automata theory and practical understanding through
            cutting-edge visualization tools and AI-powered assistance.
          </p>
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-white text-lg font-semibold mb-4">
            <Lightbulb className="h-5 w-5 text-red-400" />
            Why We Built This
          </h3>
          <p className="text-white/95">
            Traditional textbooks and static diagrams often fail to convey the dynamic nature of automata. We created
            this platform to provide an interactive, intuitive way to create, modify, and analyze finite state machines,
            making learning more effective and enjoyable.
          </p>
        </div>
      </div>

      <div className="text-center mt-12 p-8 bg-black/40 backdrop-blur-md rounded-lg border border-white/20">
        <div className="flex justify-center mb-4">
          <Heart className="h-8 w-8 text-red-400 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
          Ready to Get Started?
        </h2>
        <p className="text-white/95 mb-6 text-lg">
          Join thousands of students and educators who are already using Automata Visualizer to make learning more
          interactive and effective.
        </p>
        <div className="flex gap-6 justify-center text-sm text-white/95">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span>Free to use</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-red-400" />
            <span>No installation required</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-purple-400" />
            <span>Works on all devices</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
