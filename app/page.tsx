"use client"

import type React from "react"
import { useState } from "react"
import { Camera, Send, Sparkles } from "lucide-react"

const HomePage: React.FC = () => {
  const [inputText, setInputText] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      alert(`Image uploaded: ${file.name}`)
    }
  }

  const handleSubmit = async () => {
    if (!inputText.trim() && !selectedImage) {
      alert("Please enter text or upload an image")
      return
    }

    try {
      // Call your FastAPI backend
      const formData = new FormData()
      if (selectedImage) {
        formData.append("image", selectedImage)
      }
      formData.append("text", inputText)

      const response = await fetch("/api/process-automaton", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Backend response:", result)
        alert("Processing completed!")
      } else {
        alert("Error processing request")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error connecting to backend")
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col max-w-7xl">
        {/* Main content area - Fixed height to prevent overflow */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 text-center">
            <div className="mb-4">
              <Sparkles className="h-12 w-12 mx-auto mb-3 text-blue-400 animate-pulse drop-shadow-lg" />
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
                Welcome to Automata Visualizer
              </h2>
              <p className="text-white mb-4 text-base leading-relaxed">
                Create, visualize, and analyze finite state automata with the power of AI. Upload an image or describe
                your automaton to get started.
              </p>
            </div>

            {selectedImage && (
              <div className="mb-4 p-3 bg-black/30 backdrop-blur-sm rounded-lg border border-white/20">
                <p className="text-white font-medium text-sm">Selected image: {selectedImage.name}</p>
              </div>
            )}

            {/* AI Integration section - Compact */}
            <div className="bg-black/40 backdrop-blur-md border border-white/30 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                <h3 className="text-lg font-bold text-white drop-shadow-md">AI Integration Coming Soon</h3>
                <Sparkles className="h-4 w-4 text-red-400 animate-pulse" />
              </div>
              <p className="text-white/95 mb-3 text-sm drop-shadow-sm">
                Advanced machine learning capabilities will be available here
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-blue-500/20 px-2 py-2 rounded border border-blue-400/30">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3 text-blue-400" />
                    <span className="font-semibold text-white text-xs">Image Recognition</span>
                  </div>
                  <p className="text-blue-200 text-xs">Upload hand-drawn automata</p>
                </div>
                <div className="bg-purple-500/20 px-2 py-2 rounded border border-purple-400/30">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3 text-purple-400" />
                    <span className="font-semibold text-white text-xs">Natural Language</span>
                  </div>
                  <p className="text-purple-200 text-xs">Describe in plain English</p>
                </div>
                <div className="bg-red-500/20 px-2 py-2 rounded border border-red-400/30">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3 text-red-400" />
                    <span className="font-semibold text-white text-xs">Smart Analysis</span>
                  </div>
                  <p className="text-red-200 text-xs">AI-powered validation</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom input area - Always visible */}
        <div className="w-full max-w-4xl mx-auto mt-4">
          <div className="bg-black/40 backdrop-blur-md border border-white/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {/* Camera button for image upload */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="image-upload"
                />
                <button className="bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400/50 text-blue-300 p-3 rounded-lg transition-all duration-300 hover:scale-105">
                  <Camera className="h-5 w-5" />
                  <span className="sr-only">Upload image</span>
                </button>
              </div>

              {/* Text input */}
              <input
                type="text"
                placeholder="Describe your automaton or ask a question..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                className="flex-1 bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:bg-white/15 px-4 py-3 rounded-lg outline-none transition-all duration-300"
              />

              {/* Send button */}
              <button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-blue-500 to-red-500 hover:from-blue-600 hover:to-red-600 text-white p-3 rounded-lg transition-all duration-300 hover:scale-105"
              >
                <Send className="h-5 w-5" />
                <span className="sr-only">Send</span>
              </button>
            </div>

            {/* Input area description */}
            <div className="mt-2 text-center">
              <p className="text-white/70 text-xs">
                💡 Upload an image of your automaton or describe it in natural language
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
