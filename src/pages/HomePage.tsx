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
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)] flex flex-col max-w-7xl">
      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 text-center">
          <div className="mb-6">
            <Sparkles className="h-16 w-16 mx-auto mb-4 text-blue-400 animate-pulse" />
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
              Welcome to Automata Visualizer
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Create, visualize, and analyze finite state automata with the power of AI. Upload an image or describe
              your automaton to get started.
            </p>
          </div>

          {selectedImage && (
            <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
              <p className="text-sm text-white/70">Selected image: {selectedImage.name}</p>
            </div>
          )}

          <div className="text-white/60 bg-gradient-to-r from-blue-500/20 to-red-500/20 p-6 rounded-lg border border-white/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-blue-400" />
              <p className="font-semibold">FastAPI Backend Integration</p>
              <Sparkles className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-sm">Connect this to your Python FastAPI backend</p>
          </div>
        </div>
      </div>

      {/* Bottom input area */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4">
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
              <button className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 text-blue-300 p-2 rounded-md transition-colors">
                <Camera className="h-4 w-4" />
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
              className="flex-1 bg-white/10 border border-white/30 text-white placeholder:text-white/50 focus:border-blue-400 px-3 py-2 rounded-md outline-none transition-colors"
            />

            {/* Send button */}
            <button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-blue-500 to-red-500 hover:from-blue-600 hover:to-red-600 text-white p-2 rounded-md transition-colors"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
