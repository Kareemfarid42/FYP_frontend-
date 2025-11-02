"use client"

import type React from "react"
import { useState } from "react"
import { Plus, Minus, Circle, ArrowRight, Palette } from "lucide-react"

const CustomDrawPage: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  const handleToolSelect = (tool: string) => {
    if (selectedTool === tool) {
      setSelectedTool(null)
      alert("Tool deselected")
    } else {
      setSelectedTool(tool)
      alert(`${tool.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())} mode activated`)
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (selectedTool) {
      // Send to FastAPI backend
      const canvasAction = {
        tool: selectedTool,
        position: { x: Math.round(x), y: Math.round(y) },
        timestamp: new Date().toISOString(),
      }

      // TODO: Send to your FastAPI backend
      fetch("/api/canvas-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(canvasAction),
      }).catch((error) => console.error("Error:", error))

      alert(`${selectedTool} action at (${Math.round(x)}, ${Math.round(y)})`)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-white/10 backdrop-blur-md border-r border-white/20 p-4">
        <div className="flex items-center gap-2 mb-6">
          <Palette className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Drawing Tools</h2>
        </div>

        {/* States Section */}
        <div className="mb-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <h3 className="text-base flex items-center gap-2 text-white mb-3">
              <Circle className="h-4 w-4 text-blue-400" />
              States
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleToolSelect("add-state")}
                className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md transition-colors ${
                  selectedTool === "add-state"
                    ? "bg-gradient-to-r from-blue-500 to-red-500 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/30"
                }`}
              >
                <Plus className="h-4 w-4" />
                Add State
              </button>
              <button
                onClick={() => handleToolSelect("delete-state")}
                className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md transition-colors ${
                  selectedTool === "delete-state"
                    ? "bg-gradient-to-r from-red-500 to-blue-500 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/30"
                }`}
              >
                <Minus className="h-4 w-4" />
                Delete State
              </button>
            </div>
          </div>
        </div>

        <div className="my-4 h-px bg-white/30"></div>

        {/* Transitions Section */}
        <div className="mb-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <h3 className="text-base flex items-center gap-2 text-white mb-3">
              <ArrowRight className="h-4 w-4 text-red-400" />
              Transitions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleToolSelect("add-transition")}
                className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md transition-colors ${
                  selectedTool === "add-transition"
                    ? "bg-gradient-to-r from-blue-500 to-red-500 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/30"
                }`}
              >
                <Plus className="h-4 w-4" />
                Add Transition
              </button>
              <button
                onClick={() => handleToolSelect("delete-transition")}
                className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md transition-colors ${
                  selectedTool === "delete-transition"
                    ? "bg-gradient-to-r from-red-500 to-blue-500 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/30"
                }`}
              >
                <Minus className="h-4 w-4" />
                Delete Transition
              </button>
            </div>
          </div>
        </div>

        {selectedTool && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-red-500/20 rounded-lg border border-white/20">
            <p className="text-sm text-white font-medium mb-2">
              <strong>Active Tool:</strong>
            </p>
            <p className="text-blue-200 text-sm mb-3">
              {selectedTool.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </p>
            <button
              onClick={() => setSelectedTool(null)}
              className="w-full text-white hover:bg-white/20 border border-white/30 px-3 py-1 rounded-md transition-colors"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-4">
        <div className="h-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
          <div className="border-b border-white/20 p-4">
            <h2 className="text-white flex items-center gap-2">
              <Circle className="h-5 w-5 text-blue-400" />
              Automaton Canvas
            </h2>
          </div>
          <div
            className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 border-2 border-dashed border-white/30 cursor-crosshair relative overflow-hidden rounded-b-lg"
            onClick={handleCanvasClick}
          >
            {/* Canvas content will be rendered here */}
            <div className="absolute inset-0 flex items-center justify-center text-white/60">
              <div className="text-center">
                <div className="relative mb-6">
                  <Circle className="h-16 w-16 mx-auto text-blue-400 animate-pulse" />
                  <ArrowRight className="h-8 w-8 absolute -right-4 top-4 text-red-400 animate-bounce" />
                </div>
                <p className="text-2xl font-bold mb-2 bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                  Interactive Canvas
                </p>
                <p className="text-lg mb-4">
                  {selectedTool
                    ? `${selectedTool.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())} mode active`
                    : "Select a tool from the sidebar to start drawing"}
                </p>
                <div className="flex justify-center gap-4 text-sm">
                  <span className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">States</span>
                  <span className="bg-red-500/20 px-3 py-1 rounded-full border border-red-400/30">Transitions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomDrawPage
