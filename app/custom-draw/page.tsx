"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, Circle, ArrowRight, Palette } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CustomDrawPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const { toast } = useToast()

  const handleAddState = () => {
    if (selectedTool === "add-state") {
      setSelectedTool(null)
      toast({
        title: "Tool Deselected",
        description: "No tool is currently active",
      })
    } else {
      setSelectedTool("add-state")
      toast({
        title: "Add State Mode",
        description: "Click on the canvas to add a new state",
      })
    }
  }

  const handleDeleteState = () => {
    if (selectedTool === "delete-state") {
      setSelectedTool(null)
      toast({
        title: "Tool Deselected",
        description: "No tool is currently active",
      })
    } else {
      setSelectedTool("delete-state")
      toast({
        title: "Delete State Mode",
        description: "Click on a state to delete it",
      })
    }
  }

  const handleAddTransition = () => {
    if (selectedTool === "add-transition") {
      setSelectedTool(null)
      toast({
        title: "Tool Deselected",
        description: "No tool is currently active",
      })
    } else {
      setSelectedTool("add-transition")
      toast({
        title: "Add Transition Mode",
        description: "Click on two states to create a transition",
      })
    }
  }

  const handleDeleteTransition = () => {
    if (selectedTool === "delete-transition") {
      setSelectedTool(null)
      toast({
        title: "Tool Deselected",
        description: "No tool is currently active",
      })
    } else {
      setSelectedTool("delete-transition")
      toast({
        title: "Delete Transition Mode",
        description: "Click on a transition to delete it",
      })
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (selectedTool) {
      toast({
        title: `${selectedTool} action`,
        description: `Clicked at position (${Math.round(x)}, ${Math.round(y)})`,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-red-900">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-64 bg-white/10 backdrop-blur-md border-r border-white/20 p-4 animate-slide-in">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Drawing Tools</h2>
          </div>

          {/* States Section */}
          <div className="mb-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Circle className="h-4 w-4 text-blue-400" />
                  States
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedTool === "add-state" ? "default" : "outline"}
                  size="sm"
                  className={`w-full justify-start ${
                    selectedTool === "add-state"
                      ? "bg-gradient-to-r from-blue-500 to-red-500 text-white border-0"
                      : "bg-white/10 hover:bg-white/20 text-white border-white/30"
                  }`}
                  onClick={handleAddState}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add State
                </Button>
                <Button
                  variant={selectedTool === "delete-state" ? "default" : "outline"}
                  size="sm"
                  className={`w-full justify-start ${
                    selectedTool === "delete-state"
                      ? "bg-gradient-to-r from-red-500 to-blue-500 text-white border-0"
                      : "bg-white/10 hover:bg-white/20 text-white border-white/30"
                  }`}
                  onClick={handleDeleteState}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Delete State
                </Button>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-4 bg-white/30" />

          {/* Transitions Section */}
          <div className="mb-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <ArrowRight className="h-4 w-4 text-red-400" />
                  Transitions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedTool === "add-transition" ? "default" : "outline"}
                  size="sm"
                  className={`w-full justify-start ${
                    selectedTool === "add-transition"
                      ? "bg-gradient-to-r from-blue-500 to-red-500 text-white border-0"
                      : "bg-white/10 hover:bg-white/20 text-white border-white/30"
                  }`}
                  onClick={handleAddTransition}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transition
                </Button>
                <Button
                  variant={selectedTool === "delete-transition" ? "default" : "outline"}
                  size="sm"
                  className={`w-full justify-start ${
                    selectedTool === "delete-transition"
                      ? "bg-gradient-to-r from-red-500 to-blue-500 text-white border-0"
                      : "bg-white/10 hover:bg-white/20 text-white border-white/30"
                  }`}
                  onClick={handleDeleteTransition}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Delete Transition
                </Button>
              </CardContent>
            </Card>
          </div>

          {selectedTool && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-red-500/20 rounded-lg border border-white/20 animate-fade-in">
              <p className="text-sm text-white font-medium mb-2">
                <strong>Active Tool:</strong>
              </p>
              <p className="text-blue-200 text-sm mb-3">
                {selectedTool.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-white hover:bg-white/20 border border-white/30"
                onClick={() => setSelectedTool(null)}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-4">
          <Card className="h-full glass-effect border-white/20 glow-effect">
            <CardHeader className="border-b border-white/20">
              <CardTitle className="text-white flex items-center gap-2">
                <Circle className="h-5 w-5 text-blue-400" />
                Automaton Canvas
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full p-0">
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
                    <p className="text-2xl font-bold mb-2 gradient-text">Interactive Canvas</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
