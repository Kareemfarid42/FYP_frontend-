"use client"

import React, { useState, useEffect } from "react"
import { Plus, Minus, Circle, ArrowRight, Palette, Target, Flag, Save, Settings } from "lucide-react"
import { AutomataVisualizer } from "@/src/components/automata/AutomataVisualizer"
import { useAutomaton } from "@/src/hook/useAutomaton"
import { useAuth } from "@/src/contexts/AuthContext"
import { SaveAutomataModal } from "@/src/components/SaveAutomataModal"
import { Sidebar } from "@/src/components/Sidebar"
import type { Tool } from "@/src/lib/types"
import { createAutomata, updateAutomata, getAutomata } from "@/src/lib/api"
import { useRouter, useSearchParams } from "next/navigation"

const CustomDrawPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { automaton, states, transitions, type, setStates, setTransitions, changeType } = useAutomaton('DFA')
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [currentAutomataEncodedId, setCurrentAutomataEncodedId] = useState<string | null>(null)
  const [currentAutomataName, setCurrentAutomataName] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const mode = searchParams?.get('mode')
    const encodedId = searchParams?.get('id')
    
    if (mode === 'preview') {
      loadPreviewData()
    }
    else if (encodedId && isAuthenticated) {
      loadAutomaton(encodedId)
    }
  }, [searchParams, isAuthenticated])

  const loadPreviewData = () => {
    try {
      const previewJson = sessionStorage.getItem('automata_preview')
      if (previewJson) {
        const previewData = JSON.parse(previewJson)
        setStates(previewData.states)
        setTransitions(previewData.transitions)
        setCurrentAutomataName(previewData.name || "")
        if (previewData.type && (previewData.type === 'DFA' || previewData.type === 'NFA')) {
          changeType(previewData.type as 'DFA' | 'NFA')
        }
        sessionStorage.removeItem('automata_preview')
      }
    } catch (error) {
      console.error('Failed to load preview data:', error)
    }
  }

  const loadAutomaton = async (encodedId: string) => {
    try {
      const data = await getAutomata(encodedId)
      const loadedStates = data.states.map(s => ({
        id: s.state_id,
        label: s.label,
        position: { x: s.position_x, y: s.position_y },
        isInitial: s.is_initial,
        isFinal: s.is_final
      }))
      const loadedTransitions = data.transitions.map((t, index) => ({
        id: `t${index}`,
        from: t.from_state_id,
        to: t.to_state_id,
        symbol: t.symbol
      }))
      setStates(loadedStates)
      setTransitions(loadedTransitions)
      setCurrentAutomataEncodedId(data.encoded_id)  // Store ONLY encoded_id
      setCurrentAutomataName(data.name)
      if (data.type && (data.type === 'DFA' || data.type === 'NFA')) {
        changeType(data.type as 'DFA' | 'NFA')
      }
    } catch (error) {
      console.error("Load error:", error)
      alert("Failed to load automaton")
    }
  }

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool === selectedTool ? null : tool)
  }

  const handleQuickSave = async () => {
    if (!isAuthenticated) {
      alert("Please login to save automata")
      return
    }

    if (currentAutomataEncodedId && currentAutomataName) {
      setIsSaving(true)
      try {
        await updateAutomata(currentAutomataEncodedId, {
          name: currentAutomataName,
          type: type,
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
        alert("Automaton updated successfully!")
      } catch (error) {
        console.error("Save error:", error)
        alert("Failed to update automaton")
      } finally {
        setIsSaving(false)
      }
    } else {
      setIsSaveModalOpen(true)
    }
  }

  const handleSave = async (name: string, description: string) => {
    if (!isAuthenticated) {
      alert("Please login to save automata")
      return
    }

    try {
      const automataData = {
        name,
        description,
        type: type,
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
      }

      if (currentAutomataEncodedId) {
        await updateAutomata(currentAutomataEncodedId, automataData)
        setCurrentAutomataName(name)
        alert("Automaton updated successfully!")
      } else {
        const created = await createAutomata(automataData)
        setCurrentAutomataEncodedId(created.encoded_id)
        setCurrentAutomataName(name)
        alert("Automaton saved successfully!")
      }
    } catch (error) {
      console.error("Save error:", error)
      throw error
    }
  }

  const handlePreview = async (id: string) => {
    router.push(`/?preview=${id}`)
  }

  const handleEdit = async (id: string) => {
    loadAutomaton(id)
  }

  return (
    // Changed h-[calc(100vh-4rem)] to min-h-[calc(100vh-4rem)] and removed overflow-hidden
    <div className="flex min-h-[calc(100vh-4rem)]">
      {isAuthenticated && (
        <Sidebar onPreview={handlePreview} onEdit={handleEdit} />
      )}

      {/* Removed overflow-hidden */}
      <div className="flex-1 flex flex-col">
        {isAuthenticated ? (
          <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-blue-400" />
                <h2 className="text-base font-semibold text-white">Tools</h2>
                {currentAutomataName && (
                  <span className="ml-4 text-sm text-white/60">
                    Editing: <span className="text-white font-medium">{currentAutomataName}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white/10 border border-white/30 rounded-md px-3 py-1.5">
                  <Settings className="h-3.5 w-3.5 text-white/60" />
                  <select
                    value={type}
                    onChange={(e) => changeType(e.target.value as 'DFA' | 'NFA')}
                    className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="DFA" className="bg-gray-800">DFA</option>
                    <option value="NFA" className="bg-gray-800">NFA</option>
                  </select>
                </div>

                <div className="w-px h-6 bg-white/20"></div>

                <button onClick={() => handleToolSelect("add-state")} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${selectedTool === "add-state" ? "bg-gradient-to-r from-blue-500 to-red-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/30"}`}>
                  <Plus className="h-3.5 w-3.5" />Add State
                </button>
                <button onClick={() => handleToolSelect("delete-state")} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${selectedTool === "delete-state" ? "bg-gradient-to-r from-red-500 to-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/30"}`}>
                  <Minus className="h-3.5 w-3.5" />Delete
                </button>
                <button onClick={() => handleToolSelect("set-initial")} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${selectedTool === "set-initial" ? "bg-gradient-to-r from-green-500 to-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/30"}`}>
                  <Target className="h-3.5 w-3.5" />Initial
                </button>
                <button onClick={() => handleToolSelect("set-final")} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${selectedTool === "set-final" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/30"}`}>
                  <Flag className="h-3.5 w-3.5" />Final
                </button>

                <div className="w-px h-6 bg-white/20 mx-2"></div>

                <button onClick={() => handleToolSelect("add-transition")} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${selectedTool === "add-transition" ? "bg-gradient-to-r from-blue-500 to-red-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/30"}`}>
                  <ArrowRight className="h-3.5 w-3.5" />Add Transition
                </button>
                <button onClick={() => handleToolSelect("delete-transition")} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${selectedTool === "delete-transition" ? "bg-gradient-to-r from-red-500 to-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/30"}`}>
                  <Minus className="h-3.5 w-3.5" />Delete
                </button>

                <div className="w-px h-6 bg-white/20 mx-2"></div>

                <button 
                  onClick={handleQuickSave} 
                  disabled={isSaving} 
                  className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-md text-sm transition-all disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? 'Saving...' : (currentAutomataEncodedId ? 'Update' : 'Save')}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Removed overflow-hidden */}
        <div className="flex-1 flex">
          {!isAuthenticated && (
            <div className="w-64 bg-white/10 backdrop-blur-md border-r border-white/20 p-4">
              <div className="flex items-center gap-2 mb-6">
                <Palette className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Drawing Tools</h2>
              </div>

              <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/70 leading-relaxed">
                  <strong className="text-white">Tips:</strong><br/>
                  • Click canvas to add states<br/>
                  • Click two states to connect<br/>
                  • Drag states to move them<br/>
                  • First state is initial by default
                </p>
              </div>

              <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <label className="text-xs text-white/60 block mb-2">Automaton Type</label>
                <select value={type} onChange={(e) => changeType(e.target.value as 'DFA' | 'NFA')} className="w-full bg-white/10 border border-white/30 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="DFA" className="bg-gray-800">DFA (Deterministic)</option>
                  <option value="NFA" className="bg-gray-800">NFA (Nondeterministic)</option>
                </select>
              </div>

              <div className="mb-4">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                  <h3 className="text-base flex items-center gap-2 text-white mb-3">
                    <Circle className="h-4 w-4 text-blue-400" />States
                  </h3>
                  <div className="space-y-2">
                    <button onClick={() => handleToolSelect("add-state")} className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md transition-colors ${selectedTool === "add-state" ? "bg-gradient-to-r from-blue-500 to-red-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/30"}`}>
                      <Plus className="h-4 w-4" />Add State
                    </button>
                    <button onClick={() => handleToolSelect("delete-state")} className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md transition-colors ${selectedTool === "delete-state" ? "bg-gradient-to-r from-red-500 to-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/30"}`}>
                      <Minus className="h-4 w-4" />Delete State
                    </button>
                    <button onClick={() => handleToolSelect("set-initial")} className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md transition-colors ${selectedTool === "set-initial" ? "bg-gradient-to-r from-green-500 to-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/30"}`}>
                      <Target className="h-4 w-4" />Set Initial
                    </button>
                    <button onClick={() => handleToolSelect("set-final")} className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md transition-colors ${selectedTool === "set-final" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/30"}`}>
                      <Flag className="h-4 w-4" />Toggle Final
                    </button>
                  </div>
                </div>
              </div>

              <div className="my-4 h-px bg-white/30"></div>

              <div className="mb-4">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                  <h3 className="text-base flex items-center gap-2 text-white mb-3">
                    <ArrowRight className="h-4 w-4 text-red-400" />Transitions
                  </h3>
                  <div className="space-y-2">
                    <button onClick={() => handleToolSelect("add-transition")} className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md transition-colors ${selectedTool === "add-transition" ? "bg-gradient-to-r from-blue-500 to-red-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/30"}`}>
                      <Plus className="h-4 w-4" />Add Transition
                    </button>
                    <button onClick={() => handleToolSelect("delete-transition")} className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md transition-colors ${selectedTool === "delete-transition" ? "bg-gradient-to-r from-red-500 to-blue-500 text-white" : "bg-white/10 hover:bg-white/20 text-white border border-white/30"}`}>
                      <Minus className="h-4 w-4" />Delete Transition
                    </button>
                  </div>
                </div>
              </div>

              {selectedTool && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-red-500/20 rounded-lg border border-white/20">
                  <p className="text-sm text-white font-medium mb-2"><strong>Active Tool:</strong></p>
                  <p className="text-blue-200 text-sm mb-3">{selectedTool.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
                  <button onClick={() => setSelectedTool(null)} className="w-full text-white hover:bg-white/20 border border-white/30 px-3 py-1 rounded-md transition-colors text-sm">
                    Clear Selection
                  </button>
                </div>
              )}
              
            </div>
          )}

          <div className="flex-1 p-4">
            <AutomataVisualizer
              selectedTool={selectedTool}
              onToolUsed={() => {}}
              states={states}
              transitions={transitions}
              onStatesChange={setStates}
              onTransitionsChange={setTransitions}
              automaton={automaton}
            />
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

export default CustomDrawPage