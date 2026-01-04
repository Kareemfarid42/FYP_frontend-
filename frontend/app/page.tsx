"use client"

import React, { useState, useEffect } from "react"
import { Send, Sparkles, Save, Loader2, Edit3 } from "lucide-react"
import { AutomataCanvas } from "@/src/components/automata/AutomataCanvas"
import { useAutomaton } from "@/src/hook/useAutomaton"
import { useAuth } from "@/src/contexts/AuthContext"
import { SaveAutomataModal } from "@/src/components/SaveAutomataModal"
import { Sidebar } from "@/src/components/Sidebar"
import { createAutomata, getAutomata, generateAutomata } from "@/src/lib/api"
import { sanitizeAIPrompt, validateAIPrompt } from "@/src/lib/validation"
import type { State, Transition } from "@/src/lib/types"
import { useRouter, useSearchParams } from "next/navigation"

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { automaton, states, transitions, setStates, setTransitions } = useAutomaton('DFA')
  const [inputText, setInputText] = useState("")
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentAutomataName, setCurrentAutomataName] = useState("Sample: Even number of 1s")
  const [currentAutomataDescription, setCurrentAutomataDescription] = useState("")
  const [isLoadedFromDatabase, setIsLoadedFromDatabase] = useState(false) // Track if loaded from DB
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if preview parameter exists
    const previewId = searchParams?.get('preview')
    if (previewId && isAuthenticated) {
      loadAutomaton(previewId)
    } else {
      loadSampleAutomaton()
    }
  }, [searchParams, isAuthenticated])

  const loadSampleAutomaton = () => {
    const sampleStates: State[] = [
      {
        id: "q0",
        label: "q0",
        position: { x: 200, y: 250 },
        isInitial: true,
        isFinal: true
      },
      {
        id: "q1",
        label: "q1",
        position: { x: 400, y: 250 },
        isInitial: false,
        isFinal: false
      }
    ]

    const sampleTransitions: Transition[] = [
      { id: "t1", from: "q0", to: "q1", symbol: "1" },
      { id: "t2", from: "q1", to: "q0", symbol: "1" },
      { id: "t3", from: "q0", to: "q0", symbol: "0" },
      { id: "t4", from: "q1", to: "q1", symbol: "0" }
    ]

    setStates(sampleStates)
    setTransitions(sampleTransitions)
    setCurrentAutomataName("Sample: Even number of 1s")
    setCurrentAutomataDescription("Accepts binary strings with even number of 1s")
    setIsLoadedFromDatabase(false) // Sample = not from DB
  }

  const loadAutomaton = async (id: string) => {
    try {
      const data = await getAutomata(id)
      
      const loadedStates: State[] = data.states.map((s: any) => ({
        id: s.state_id,
        label: s.label,
        position: { x: s.position_x, y: s.position_y },
        isInitial: s.is_initial,
        isFinal: s.is_final
      }))

      const loadedTransitions: Transition[] = data.transitions.map((t, index) => ({
        id: `t${index}`,
        from: t.from_state_id,
        to: t.to_state_id,
        symbol: t.symbol
      }))

      setStates(loadedStates)
      setTransitions(loadedTransitions)
      setCurrentAutomataName(data.name)
      setCurrentAutomataDescription(data.description || "")
      setIsLoadedFromDatabase(true) // Loaded from DB = true
    } catch (error) {
      console.error("Load error:", error)
      alert("Failed to load automaton")
    }
  }

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      alert("Please enter a description")
      return
    }

    const sanitized = sanitizeAIPrompt(inputText)
    
    // DEBUG: Check what's being sanitized
    console.log("🔍 Original input:", inputText)
    console.log("🧹 After sanitization:", sanitized)
    
    const validation = validateAIPrompt(sanitized)

    if (!validation.valid) {
      alert(validation.error)
      return
    }

    setIsGenerating(true)

    try {
      // DEBUG: Check what's being sent to API
      console.log("📤 Sending to generateAutomata:", sanitized)
      
      // Call the AI generation API
      const generatedAutomata = await generateAutomata(sanitized, 'DFA')
      
      // Check if the response indicates failure or out-of-scope
      if (!generatedAutomata || typeof generatedAutomata !== 'object') {
        throw new Error("Invalid response from server")
      }

      // Handle the "out of scope" case
      if (generatedAutomata.success === false) {
        alert(generatedAutomata.message || "This request is outside the scope of automata generation.")
        return
      }

      // Validate that we have the expected data structure
      if (!generatedAutomata.states || !Array.isArray(generatedAutomata.states)) {
        console.error("Unexpected response structure:", generatedAutomata)
        throw new Error("Invalid automata structure in response")
      }

      if (!generatedAutomata.transitions || !Array.isArray(generatedAutomata.transitions)) {
        console.error("Unexpected response structure:", generatedAutomata)
        throw new Error("Invalid automata structure in response")
      }

      // Convert the response to canvas format
      const generatedStates: State[] = generatedAutomata.states.map((s: any) => ({
        id: s.state_id,
        label: s.label,
        position: { x: s.position_x, y: s.position_y },
        isInitial: s.is_initial,
        isFinal: s.is_final
      }))

      const generatedTransitions: Transition[] = generatedAutomata.transitions.map((t: any, index: any) => ({
        id: `t${index}`,
        from: t.from_state_id,
        to: t.to_state_id,
        symbol: t.symbol
      }))

      // Update the canvas with generated automata
      setStates(generatedStates)
      setTransitions(generatedTransitions)
      setCurrentAutomataName(generatedAutomata.name || "Generated Automaton")
      setCurrentAutomataDescription(generatedAutomata.description || "")
      setIsLoadedFromDatabase(false) // AI generated = not from DB
      
      // Show success message
      alert("✨ Automaton generated! You can now view, edit, or save it.")
      
    } catch (error) {
      console.error("Generation error:", error)
      
      // More informative error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      alert(`⚠️ Failed to generate automaton: ${errorMessage}\n\nShowing sample automaton instead.`)
      
      // Fallback to sample if API fails
      loadSampleAutomaton()
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOpenInEditor = () => {
    // Store current automata data in sessionStorage
    const previewData = {
      name: currentAutomataName,
      description: currentAutomataDescription,
      type: automaton.type,
      states,
      transitions
    }
    
    sessionStorage.setItem('automata_preview', JSON.stringify(previewData))
    
    // Navigate to custom-draw page
    router.push('/custom-draw?mode=preview')
  }

  const handleSave = async (name: string, description: string) => {
    if (!isAuthenticated) {
      alert("Please login to save automata")
      return
    }

    try {
      await createAutomata({
        name,
        description,
        type: automaton.type,
        states: states.map(s => ({
          state_id: s.id,
          label: s.label,
          position_x: s.position.x,
          position_y: s.position.y,
          is_initial: s.isInitial,
          is_final: s.isFinal
        })),
        transitions: transitions.map(t => ({
          from_state_id: t.from,
          to_state_id: t.to,
          symbol: t.symbol
        }))
      })
      alert("Automaton saved successfully!")
      setIsSaveModalOpen(false)
    } catch (error) {
      console.error("Save error:", error)
      throw error
    }
  }

  const handlePreview = async (id: string) => {
    loadAutomaton(id)
  }

  const handleEdit = (id: string) => {
    router.push(`/custom-draw?id=${id}`)
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {isAuthenticated && (
        <Sidebar onPreview={handlePreview} onEdit={handleEdit} />
      )}

      <div className="flex-1 flex flex-col">
        <div className="container mx-auto px-4 py-6 flex-1 flex flex-col max-w-7xl overflow-hidden">
          <div className="flex-1 flex items-center justify-center min-h-0 mb-4">
            <div className="w-full h-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex flex-col">
              <div className="border-b border-white/20 p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-400" />
                    Automaton Preview
                  </h2>
                  <p className="text-white/60 text-sm mt-1">
                    {currentAutomataName}
                  </p>
                  {currentAutomataDescription && (
                    <p className="text-white/50 text-xs mt-1">
                      {currentAutomataDescription}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Open in Editor Button - Hide if loaded from database */}
                  {!isLoadedFromDatabase && (
                    <button
                      onClick={handleOpenInEditor}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all"
                    >
                      <Edit3 className="h-4 w-4" />
                      Open in Editor
                    </button>
                  )}
                  
                  {/* Save Button - Only for authenticated users */}
                  {isAuthenticated && !isLoadedFromDatabase && (
                    <button
                      onClick={() => setIsSaveModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg transition-all"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <AutomataCanvas
                  selectedTool={null}
                  states={states}
                  transitions={transitions}
                  onStatesChange={setStates}
                  onTransitionsChange={setTransitions}
                />
              </div>
            </div>
          </div>

          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-black/40 backdrop-blur-md border border-white/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Describe your automaton (e.g., 'DFA for strings ending in 01')..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                  className="flex-1 bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:bg-white/15 px-4 py-3 rounded-lg outline-none transition-all duration-300"
                  maxLength={1000}
                  disabled={isGenerating}
                />

                <button
                  onClick={handleSubmit}
                  disabled={isGenerating || !inputText.trim()}
                  className="bg-gradient-to-r from-blue-500 to-red-500 hover:from-blue-600 hover:to-red-600 text-white p-3 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  <span className="sr-only">Send</span>
                </button>
              </div>

              <div className="mt-2 text-center">
                <p className="text-white/70 text-xs">
                  {isGenerating 
                    ? "🤖 Generating your automaton..." 
                    : "💡 Tip: Be specific! e.g., 'DFA accepting binary strings divisible by 3'"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SaveAutomataModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}

export default HomePage