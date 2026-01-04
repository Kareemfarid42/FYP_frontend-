// src/components/automata/AutomataVisualizer.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, XCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { Automaton } from '../../lib/types';
import { simulateDFA, simulateNFA, sanitizeInput } from '../../lib/automataUtils';
import type { SimulationResult, SimulationStep } from '../../lib/types';

// Types
interface Position { x: number; y: number; }
interface State { id: string; label: string; position: Position; isInitial: boolean; isFinal: boolean; }
interface Transition { id: string; from: string; to: string; symbol: string; }
type Tool = 'select' | 'add-state' | 'delete-state' | 'add-transition' | 'delete-transition' | 'set-initial' | 'set-final';

interface AutomataVisualizerProps {
  selectedTool: Tool | null;
  onToolUsed?: () => void;
  states: State[];
  transitions: Transition[];
  onStatesChange: (states: State[]) => void;
  onTransitionsChange: (transitions: Transition[]) => void;
  automaton: Automaton;
}

const STATE_RADIUS = 30;
const ARROW_SIZE = 10;
const CURVE_OFFSET = 30;

interface GroupedTransition { from: string; to: string; symbols: string[]; transitionIds: string[]; isHighlighted: boolean; }
interface DeletionDialogData { visible: boolean; position: { x: number; y: number }; fromState: State; toState: State; transitions: Transition[]; }

export const AutomataVisualizer: React.FC<AutomataVisualizerProps> = ({ 
  selectedTool, onToolUsed, states, transitions, onStatesChange, onTransitionsChange, automaton,
}) => {
  const setStates = onStatesChange;
  const setTransitions = onTransitionsChange;
  
  // Canvas states
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [transitionStart, setTransitionStart] = useState<string | null>(null);
  const [draggingState, setDraggingState] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [transitionDialogPos, setTransitionDialogPos] = useState({ x: 0, y: 0 });
  const [transitionInput, setTransitionInput] = useState('');
  const [deletionDialog, setDeletionDialog] = useState<DeletionDialogData | null>(null);
  const [selectedTransitionsToDelete, setSelectedTransitionsToDelete] = useState<Set<string>>(new Set());
  
  // Simulation states
  const [inputString, setInputString] = useState('');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTransitionHighlight, setShowTransitionHighlight] = useState(false);
  const playbackSpeed = 1250;
  
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (isPlaying && simulationResult && currentStepIndex < simulationResult.steps.length - 1) {
      // Phase 1: Show state highlight immediately
      setShowTransitionHighlight(false);
      
      // Phase 2: Show transition highlight after 500ms
      const transitionTimer = setTimeout(() => {
        setShowTransitionHighlight(true);
      }, 750);
      
      // Phase 3: Move to next step after total delay (1000ms)
      const stepTimer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, playbackSpeed);
      
      return () => {
        clearTimeout(transitionTimer);
        clearTimeout(stepTimer);
      };
    } else if (isPlaying && currentStepIndex >= (simulationResult?.steps.length || 0) - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStepIndex, simulationResult, playbackSpeed]);

  const currentStep = simulationResult?.steps[currentStepIndex];
  const hasCrashed = simulationResult?.crashed || false;
  const currentSimulationState = currentStep?.currentState || null;
  const highlightedTransition = showTransitionHighlight && currentStep?.symbol && currentStep?.nextState 
  ? { from: currentStep.currentState, to: currentStep.nextState, symbol: currentStep.symbol } 
  : null;

  const getNextStateLabel = useCallback(() => {
    const usedLabels = new Set(states.map(s => s.label));
    let label = 'q0', index = 0;
    while (usedLabels.has(label)) { index++; label = `q${index}`; }
    return label;
  }, [states]);

  const hasBidirectionalTransition = useCallback((from: string, to: string) => transitions.some(t => t.from === to && t.to === from), [transitions]);

  const groupTransitions = useCallback((): GroupedTransition[] => {
    const grouped = new Map<string, GroupedTransition>();
    const currentStates = currentSimulationState ? currentSimulationState.split(',').map(s => s.trim()) : [];
    const nextStates = highlightedTransition?.to ? highlightedTransition.to.split(',').map(s => s.trim()) : [];
    const highlightedSymbol = highlightedTransition?.symbol;

    transitions.forEach(transition => {
      const key = `${transition.from}->${transition.to}`;
      const shouldHighlight = currentStates.includes(transition.from) && nextStates.includes(transition.to) && highlightedSymbol === transition.symbol;
      
      if (grouped.has(key)) {
        const group = grouped.get(key)!;
        group.symbols.push(transition.symbol);
        group.transitionIds.push(transition.id);
        if (shouldHighlight) group.isHighlighted = true;
      } else {
        grouped.set(key, { from: transition.from, to: transition.to, symbols: [transition.symbol], transitionIds: [transition.id], isHighlighted: shouldHighlight });
      }
    });
    return Array.from(grouped.values());
  }, [transitions, highlightedTransition, currentSimulationState]);

  const handleTransitionSubmit = () => {
    if (!transitionStart || !transitionInput.trim()) {
      setShowTransitionDialog(false);
      setTransitionInput('');
      return;
    }

    const symbols = transitionInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (symbols.length === 0) { alert('Please enter at least one symbol'); return; }

    const targetStateId = selectedState;
    if (!targetStateId) { setShowTransitionDialog(false); return; }

    const duplicates: string[] = [], validSymbols: string[] = [];
    symbols.forEach(symbol => {
      const exists = transitions.some(t => t.from === transitionStart && t.to === targetStateId && t.symbol === symbol);
      if (exists) duplicates.push(symbol); else validSymbols.push(symbol);
    });

    if (duplicates.length > 0) {
      const fromState = states.find(s => s.id === transitionStart);
      const toState = states.find(s => s.id === targetStateId);
      alert(`⚠ Duplicate transition(s) detected!\n\nTransition(s) for symbol(s) "${duplicates.join(', ')}" already exist from ${fromState?.label} to ${toState?.label}.\n\nPlease use different symbols.`);
      if (validSymbols.length === 0) {
        setShowTransitionDialog(false);
        setTransitionInput('');
        setTransitionStart(null);
        return;
      }
    }

    const newTransitions = validSymbols.map(symbol => ({ id: `transition-${Date.now()}-${Math.random()}`, from: transitionStart, to: targetStateId, symbol }));
    if (newTransitions.length > 0) setTransitions([...transitions, ...newTransitions]);
    
    setShowTransitionDialog(false);
    setTransitionInput('');
    setTransitionStart(null);
    onToolUsed?.();
  };

  const findTransitionsNearPoint = (point: Position): Transition[] => {
    const foundTransitions: Transition[] = [];
    for (const transition of transitions) {
      const fromState = states.find(s => s.id === transition.from);
      const toState = states.find(s => s.id === transition.to);
      if (!fromState || !toState) continue;

      if (transition.from === transition.to) {
        const distance = Math.sqrt(Math.pow(fromState.position.x - point.x, 2) + Math.pow(fromState.position.y - STATE_RADIUS - 20 - point.y, 2));
        if (distance < 30) foundTransitions.push(transition);
      } else {
        const isBidirectional = hasBidirectionalTransition(transition.from, transition.to);
        const curveOffset = isBidirectional ? CURVE_OFFSET : 0;
        const dx = toState.position.x - fromState.position.x;
        const dy = toState.position.y - fromState.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / distance, perpY = dx / distance;
        const angle = Math.atan2(dy, dx);
        const angleOffset = isBidirectional ? 0.2 : 0;
        const startAngle = angle + angleOffset, endAngle = angle + Math.PI + angleOffset;
        const startPoint = { x: fromState.position.x + STATE_RADIUS * Math.cos(startAngle), y: fromState.position.y + STATE_RADIUS * Math.sin(startAngle) };
        const endPoint = { x: toState.position.x + STATE_RADIUS * Math.cos(endAngle), y: toState.position.y + STATE_RADIUS * Math.sin(endAngle) };
        const midX = (startPoint.x + endPoint.x) / 2, midY = (startPoint.y + endPoint.y) / 2;
        const controlX = midX + perpX * curveOffset, controlY = midY + perpY * curveOffset;

        let minDistance = Infinity;
        for (let t = 0; t <= 1; t += 0.05) {
          const curveX = (1-t)*(1-t)*startPoint.x + 2*(1-t)*t*controlX + t*t*endPoint.x;
          const curveY = (1-t)*(1-t)*startPoint.y + 2*(1-t)*t*controlY + t*t*endPoint.y;
          minDistance = Math.min(minDistance, Math.sqrt(Math.pow(curveX - point.x, 2) + Math.pow(curveY - point.y, 2)));
        }
        if (minDistance < 20) foundTransitions.push(transition);
      }
    }
    return foundTransitions;
  };

  const handleDeleteSelected = () => {
    if (selectedTransitionsToDelete.size === 0) { setDeletionDialog(null); setSelectedTransitionsToDelete(new Set()); return; }
    setTransitions(transitions.filter(t => !selectedTransitionsToDelete.has(t.id)));
    setDeletionDialog(null);
    setSelectedTransitionsToDelete(new Set());
    onToolUsed?.();
  };

  const toggleTransitionSelection = (transitionId: string) => {
    const newSelection = new Set(selectedTransitionsToDelete);
    if (newSelection.has(transitionId)) newSelection.delete(transitionId); else newSelection.add(transitionId);
    setSelectedTransitionsToDelete(newSelection);
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !selectedTool || simulationResult !== null) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const clickedState = states.find(s => Math.sqrt(Math.pow(s.position.x - x, 2) + Math.pow(s.position.y - y, 2)) <= STATE_RADIUS);

    if (selectedTool === 'add-state' && !clickedState) {
      setStates([...states, { id: `state-${Date.now()}`, label: getNextStateLabel(), position: { x, y }, isInitial: states.length === 0, isFinal: false }]);
      onToolUsed?.();
    } else if (selectedTool === 'delete-state' && clickedState) {
      setStates(states.filter(s => s.id !== clickedState.id));
      setTransitions(transitions.filter(t => t.from !== clickedState.id && t.to !== clickedState.id));
      onToolUsed?.();
    } else if (selectedTool === 'add-transition' && clickedState) {
      if (!transitionStart) setTransitionStart(clickedState.id);
      else { setSelectedState(clickedState.id); setTransitionDialogPos({ x: e.clientX, y: e.clientY }); setShowTransitionDialog(true); }
    } else if (selectedTool === 'delete-transition') {
      const clickedTransitions = findTransitionsNearPoint({ x, y });
      if (clickedTransitions.length > 0) {
        const firstTransition = clickedTransitions[0];
        const fromState = states.find(s => s.id === firstTransition.from);
        const toState = states.find(s => s.id === firstTransition.to);
        if (fromState && toState) {
          const allTransitionsBetween = transitions.filter(t => t.from === firstTransition.from && t.to === firstTransition.to);
          if (allTransitionsBetween.length === 1) { setTransitions(transitions.filter(t => t.id !== allTransitionsBetween[0].id)); onToolUsed?.(); }
          else { setDeletionDialog({ visible: true, position: { x: e.clientX, y: e.clientY }, fromState, toState, transitions: allTransitionsBetween }); setSelectedTransitionsToDelete(new Set(allTransitionsBetween.map(t => t.id))); }
        }
      }
    } else if (selectedTool === 'set-initial' && clickedState) {
      setStates(states.map(s => ({ ...s, isInitial: s.id === clickedState.id })));
      onToolUsed?.();
    } else if (selectedTool === 'set-final' && clickedState) {
      setStates(states.map(s => s.id === clickedState.id ? { ...s, isFinal: !s.isFinal } : s));
      onToolUsed?.();
    }
  };

  const handleStateMouseDown = (e: React.MouseEvent, stateId: string) => {
    if ((selectedTool === 'select' || !selectedTool) && simulationResult === null) {
      e.stopPropagation();
      const state = states.find(s => s.id === stateId);
      if (state && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDraggingState(stateId);
        setDragOffset({ x: e.clientX - rect.left - state.position.x, y: e.clientY - rect.top - state.position.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingState && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setStates(states.map(s => s.id === draggingState ? { ...s, position: { x: e.clientX - rect.left - dragOffset.x, y: e.clientY - rect.top - dragOffset.y } } : s));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInputString(sanitizeInput(e.target.value));

  const startSimulation = () => {
    if (!inputString.trim()) { alert('Please enter a string to test'); return; }
    const simResult = automaton.type === 'DFA' ? simulateDFA(automaton, inputString) : simulateNFA(automaton, inputString);
    if (simResult.errorMessage && simResult.steps.length === 0) { alert(simResult.errorMessage); return; }
    setSimulationResult(simResult);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const resetSimulation = () => { setSimulationResult(null); setCurrentStepIndex(-1); setIsPlaying(false); };
  const togglePlayPause = () => setIsPlaying(!isPlaying);
  const nextStep = () => { if (simulationResult && currentStepIndex < simulationResult.steps.length - 1) setCurrentStepIndex(prev => prev + 1); };
  const previousStep = () => { if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1); };

  const groupedTransitions = groupTransitions();
  const currentSimulationStates = currentSimulationState ? currentSimulationState.split(',').map(s => s.trim()) : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Canvas - Fixed height instead of percentage */}
      <div className="h-[450px] bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex flex-col relative">
        <div className="border-b border-white/20 p-3">
          <h2 className="text-white flex items-center gap-2 text-lg font-semibold">
            Automaton Canvas
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${automaton.type === 'DFA' ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50' : 'bg-purple-500/30 text-purple-200 border border-purple-400/50'}`}>{automaton.type}</span>
          </h2>
        </div>

        {simulationResult && (
          <div className="absolute top-14 right-4 z-10 flex flex-col gap-2">
            <div className={`p-3 rounded-lg border-2 backdrop-blur-md ${hasCrashed ? 'bg-orange-500/20 border-orange-500/50' : simulationResult.accepted ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'}`} style={currentStepIndex === simulationResult.steps.length - 1 && !hasCrashed ? { animation: 'blink 1.5s ease-in-out infinite' } : {}}>
              <div className="flex items-center gap-2">
                {hasCrashed ? <><AlertTriangle className="h-5 w-5 text-orange-400" /><div className="text-white font-semibold text-sm">Crashed! 💥</div></> : simulationResult.accepted ? <><CheckCircle2 className="h-5 w-5 text-green-400" /><span className="text-white font-semibold text-sm">Accepted ✓</span></> : <><XCircle className="h-5 w-5 text-red-400" /><span className="text-white font-semibold text-sm">Rejected ✗</span></>}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-2">
              <button onClick={previousStep} disabled={currentStepIndex <= 0} className="px-2 py-1 bg-white/10 border border-white/30 rounded text-white hover:bg-white/20 disabled:opacity-50 text-sm">←</button>
              <button onClick={togglePlayPause} className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded hover:from-blue-600 hover:to-purple-600 flex items-center gap-1 text-sm">
                {isPlaying ? <><Pause className="h-3 w-3" />Pause</> : <><Play className="h-3 w-3" />Play</>}
              </button>
              <button onClick={nextStep} disabled={currentStepIndex >= simulationResult.steps.length - 1} className="px-2 py-1 bg-white/10 border border-white/30 rounded text-white hover:bg-white/20 disabled:opacity-50 text-sm">→</button>
              <div className="text-xs text-white/80 ml-1">{currentStepIndex + 1}/{simulationResult.steps.length}</div>
            </div>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          <svg ref={svgRef} className="w-full h-full" onClick={handleCanvasClick} onMouseMove={handleMouseMove} onMouseUp={() => setDraggingState(null)} onMouseLeave={() => setDraggingState(null)}>
            <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

            {groupedTransitions.map((group, index) => {
              const fromState = states.find(s => s.id === group.from);
              const toState = states.find(s => s.id === group.to);
              if (!fromState || !toState) return null;

              const isSelfLoop = group.from === group.to;
              const isBidirectional = hasBidirectionalTransition(group.from, group.to);
              const curveOffset = isBidirectional ? CURVE_OFFSET : 0;
              const symbolLabel = group.symbols.join(', ');
              const highlightedSymbol = group.isHighlighted && highlightedTransition?.symbol ? highlightedTransition.symbol : null;

              if (isSelfLoop) {
                const loopOffset = 40;
                return (
                  <g key={`group-${index}`}>
                    <circle cx={fromState.position.x} cy={fromState.position.y - STATE_RADIUS - loopOffset / 2} r={loopOffset / 2} fill="none" stroke={group.isHighlighted ? "#22c55e" : "black"} strokeWidth={group.isHighlighted ? "3" : "2"} />
                    <text x={fromState.position.x} y={fromState.position.y - STATE_RADIUS - loopOffset - 5} textAnchor="middle" fill="black" fontSize="14" fontWeight="bold">
                      {highlightedSymbol ? group.symbols.map((sym, idx) => <tspan key={idx} fill={sym === highlightedSymbol ? "#22c55e" : "black"} fontWeight={sym === highlightedSymbol ? "900" : "bold"} fontSize={sym === highlightedSymbol ? "16" : "14"}>{sym}{idx < group.symbols.length - 1 ? ', ' : ''}</tspan>) : symbolLabel}
                    </text>
                  </g>
                );
              }

              const dx = toState.position.x - fromState.position.x, dy = toState.position.y - fromState.position.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const perpX = -dy / distance, perpY = dx / distance;
              const angle = Math.atan2(dy, dx);
              const angleOffset = isBidirectional ? 0.2 : 0;
              const startAngle = angle + angleOffset, endAngle = angle + Math.PI + angleOffset;
              const startPoint = { x: fromState.position.x + STATE_RADIUS * Math.cos(startAngle), y: fromState.position.y + STATE_RADIUS * Math.sin(startAngle) };
              const endPoint = { x: toState.position.x + STATE_RADIUS * Math.cos(endAngle), y: toState.position.y + STATE_RADIUS * Math.sin(endAngle) };
              const midX = (startPoint.x + endPoint.x) / 2, midY = (startPoint.y + endPoint.y) / 2;
              const controlX = midX + perpX * curveOffset, controlY = midY + perpY * curveOffset;
              const textX = 0.25 * startPoint.x + 0.5 * controlX + 0.25 * endPoint.x, textY = 0.25 * startPoint.y + 0.5 * controlY + 0.25 * endPoint.y;
              const t = 0.95;
              const curveEndX = (1-t)*(1-t)*startPoint.x + 2*(1-t)*t*controlX + t*t*endPoint.x;
              const curveEndY = (1-t)*(1-t)*startPoint.y + 2*(1-t)*t*controlY + t*t*endPoint.y;
              const arrowAngle = Math.atan2(endPoint.y - curveEndY, endPoint.x - curveEndX);
              const arrowPoint = endPoint;
              const arrowLeft = { x: arrowPoint.x - ARROW_SIZE * Math.cos(arrowAngle - Math.PI / 6), y: arrowPoint.y - ARROW_SIZE * Math.sin(arrowAngle - Math.PI / 6) };
              const arrowRight = { x: arrowPoint.x - ARROW_SIZE * Math.cos(arrowAngle + Math.PI / 6), y: arrowPoint.y - ARROW_SIZE * Math.sin(arrowAngle + Math.PI / 6) };

              return (
                <g key={`group-${index}`}>
                  <path d={`M ${startPoint.x} ${startPoint.y} Q ${controlX} ${controlY} ${endPoint.x} ${endPoint.y}`} fill="none" stroke={group.isHighlighted ? "#22c55e" : "black"} strokeWidth={group.isHighlighted ? "3" : "2"} />
                  <polygon points={`${arrowPoint.x},${arrowPoint.y} ${arrowLeft.x},${arrowLeft.y} ${arrowRight.x},${arrowRight.y}`} fill={group.isHighlighted ? "#22c55e" : "black"} />
                  <text x={textX} y={textY - 5} textAnchor="middle" fill="black" fontSize="14" fontWeight="bold">
                    {highlightedSymbol ? group.symbols.map((sym, idx) => <tspan key={idx} fill={sym === highlightedSymbol ? "#22c55e" : "black"} fontWeight={sym === highlightedSymbol ? "900" : "bold"} fontSize={sym === highlightedSymbol ? "16" : "14"}>{sym}{idx < group.symbols.length - 1 ? ', ' : ''}</tspan>) : symbolLabel}
                  </text>
                </g>
              );
            })}

            {transitionStart && selectedTool === 'add-transition' && !showTransitionDialog && <line x1={states.find(s => s.id === transitionStart)?.position.x} y1={states.find(s => s.id === transitionStart)?.position.y} x2={hoveredState ? states.find(s => s.id === hoveredState)?.position.x : states.find(s => s.id === transitionStart)?.position.x} y2={hoveredState ? states.find(s => s.id === hoveredState)?.position.y : states.find(s => s.id === transitionStart)?.position.y} stroke="black" strokeWidth="2" strokeDasharray="5,5" opacity="0.5" />}

            {states.map(state => {
              const isCurrentState = currentSimulationStates.includes(state.id);
              const stateColor = simulationResult ? (isCurrentState ? (state.isFinal ? '#22c55e' : '#ef4444') : 'rgba(255, 255, 255, 0.3)') : (hoveredState === state.id ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)');
              
              return (
                <g key={state.id}>
                  {state.isInitial && (
                    <>
                      <line x1={state.position.x - STATE_RADIUS - 30} y1={state.position.y} x2={state.position.x - STATE_RADIUS} y2={state.position.y} stroke="black" strokeWidth="2" />
                      <polygon points={`${state.position.x - STATE_RADIUS},${state.position.y} ${state.position.x - STATE_RADIUS - 10},${state.position.y - 5} ${state.position.x - STATE_RADIUS - 10},${state.position.y + 5}`} fill="black" />
                    </>
                  )}
                  <circle cx={state.position.x} cy={state.position.y} r={STATE_RADIUS} fill={stateColor} stroke={isCurrentState ? (state.isFinal ? '#22c55e' : '#ef4444') : 'black'} strokeWidth={isCurrentState ? "4" : "2"} style={isCurrentState ? { animation: 'blink 1.5s ease-in-out infinite' } : {}} cursor={selectedTool === 'select' || !selectedTool ? 'move' : 'pointer'} onMouseDown={(e) => handleStateMouseDown(e, state.id)} onMouseEnter={() => setHoveredState(state.id)} onMouseLeave={() => setHoveredState(null)} />
                  {state.isFinal && <circle cx={state.position.x} cy={state.position.y} r={STATE_RADIUS - 5} fill="none" stroke="black" strokeWidth="2" />}
                  <text x={state.position.x} y={state.position.y + 5} textAnchor="middle" fill="black" fontSize="16" fontWeight="bold" pointerEvents="none">{state.label}</text>
                </g>
              );
            })}
            {states.length === 0 && <text x="50%" y="50%" textAnchor="middle" fill="black" fontSize="20" opacity="0.5">Click to add your first state</text>}
          </svg>
        </div>
      </div>

      {/* Simulation Panel - Auto height, no internal scroll */}
      <div className="h-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Play className="h-5 w-5 text-green-400" />
          String Simulation
          {automaton.type === 'NFA' && <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded border border-purple-400/50">NFA Mode</span>}
        </h3>

        <div className="mb-3">
          <div className="flex gap-2">
            <input type="text" value={inputString} onChange={handleInputChange} placeholder="Enter string to test..." disabled={simulationResult !== null} className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded-md text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" maxLength={1000} />
            {!simulationResult ? (
              <button onClick={startSimulation} className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md hover:from-green-600 hover:to-blue-600 transition-all flex items-center gap-2 whitespace-nowrap">
                <Play className="h-4 w-4" />Start
              </button>
            ) : (
              <button onClick={resetSimulation} className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-md hover:from-red-600 hover:to-orange-600 transition-all flex items-center gap-2 whitespace-nowrap">
                <RotateCcw className="h-4 w-4" />Reset
              </button>
            )}
          </div>
          {inputString && <p className="text-xs text-white/60 mt-1">Sanitized: {sanitizeInput(inputString)} ({inputString.length} chars)</p>}
        </div>

        {simulationResult && (
          <div className="space-y-3">
            {currentStep && (
              <div className={`p-3 rounded-lg border ${currentStep.isCrashed ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/20'}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className={`h-5 w-5 mt-0.5 ${currentStep.isCrashed ? 'text-orange-400' : currentStep.isValid ? 'text-blue-400' : 'text-red-400'}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium mb-1 ${currentStep.isCrashed ? 'text-orange-200' : 'text-white'}`}>{currentStep.message}</p>
                    {currentStep.symbol && <p className="text-white/60 text-xs">Reading: <span className="font-mono font-bold text-white">'{currentStep.symbol}'</span></p>}
                    {currentStep.isCrashed && <p className="text-orange-300 text-xs mt-2 font-medium">💡 Tip: Add missing transitions to make this a complete {automaton.type}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Steps List - Removed max-height and overflow */}
            <div className="bg-white/5 rounded-lg p-2 border border-white/10">
              <p className="text-xs text-white/60 mb-2 font-semibold">All Steps:</p>
              {simulationResult.steps.map((step, index) => (
                <div key={index} onClick={() => setCurrentStepIndex(index)} className={`p-2 rounded text-xs cursor-pointer transition-colors mb-1 ${step.isCrashed ? 'bg-orange-500/20 border border-orange-500/40' : index === currentStepIndex ? 'bg-blue-500/30 border border-blue-400/50' : 'bg-white/5 hover:bg-white/10'}`}>
                  <span className="text-white/60">Step {index + 1}:</span> <span className={step.isCrashed ? 'text-orange-200' : 'text-white'}>{step.message}</span>
                </div>
              ))}
            </div>

            {automaton.type === 'NFA' && !hasCrashed && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-xs text-purple-200 leading-relaxed"><strong className="text-purple-100">NFA Mode:</strong> Exploring multiple paths simultaneously. String is accepted if <strong>any</strong> path leads to a final state.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transition Input Dialog */}
      {showTransitionDialog && (
        <div className="fixed bg-white border-2 border-blue-500 rounded-lg shadow-xl p-4 z-50" style={{ left: `${transitionDialogPos.x}px`, top: `${transitionDialogPos.y}px`, transform: 'translate(-50%, -100%) translateY(-10px)' }}>
          <div className="text-sm font-semibold text-gray-700 mb-2">Enter Transition Symbol(s)</div>
          <input 
  type="text" 
  value={transitionInput} 
  onChange={(e) => {
    const value = e.target.value;
    // Remove any non-alphanumeric characters except commas and spaces
    const cleaned = value.replace(/[^a-zA-Z0-9,\s]/g, '');
    
    // Auto-insert commas between consecutive alphanumeric characters
    let formatted = '';
    let prevWasAlnum = false;
    const seenSymbols = new Set<string>();
    
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      const isAlnum = /[a-zA-Z0-9]/.test(char);
      
      if (isAlnum) {
        // Only add if we haven't seen this symbol before
        if (!seenSymbols.has(char)) {
          // Insert comma if previous was also alphanumeric
          if (prevWasAlnum) {
            formatted += ',';
          }
          formatted += char;
          seenSymbols.add(char);
          prevWasAlnum = true;
        }
      } else if (char === ',' || char === ' ') {
        // Allow commas and spaces but don't set prevWasAlnum
        if (formatted.length > 0 && formatted[formatted.length - 1] !== ',') {
          formatted += char;
        }
        prevWasAlnum = false;
      }
    }
    
    setTransitionInput(formatted);
  }} 
  onKeyPress={(e) => { 
    if (e.key === 'Enter') handleTransitionSubmit(); 
    if (e.key === 'Escape') { 
      setShowTransitionDialog(false); 
      setTransitionInput(''); 
      setTransitionStart(null); 
    }
  }} 
  placeholder="e.g., 0 or 0,1,2" 
  className="w-48 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
  autoFocus 
/>
          <div className="text-xs text-gray-500 mt-1 mb-3">Separate multiple symbols with commas</div>
          <div className="flex gap-2">
            <button onClick={handleTransitionSubmit} className="flex-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium">Add</button>
            <button onClick={() => { setShowTransitionDialog(false); setTransitionInput(''); setTransitionStart(null); }} className="flex-1 px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}

      {/* Transition Deletion Dialog */}
      {deletionDialog && (
        <div className="fixed bg-white border-2 border-red-500 rounded-lg shadow-xl p-4 z-50 min-w-[280px]" style={{ left: `${deletionDialog.position.x}px`, top: `${deletionDialog.position.y}px`, transform: 'translate(-50%, -100%) translateY(-10px)' }}>
          <div className="text-sm font-semibold text-gray-700 mb-2">Delete Transitions from {deletionDialog.fromState.label} → {deletionDialog.toState.label}</div>
          <div className="text-xs text-gray-600 mb-3">Select which transitions to delete:</div>
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {deletionDialog.transitions.map((transition) => (
              <label key={transition.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input type="checkbox" checked={selectedTransitionsToDelete.has(transition.id)} onChange={() => toggleTransitionSelection(transition.id)} className="w-4 h-4 text-red-500 focus:ring-red-500 cursor-pointer" />
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{transition.symbol}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleDeleteSelected} disabled={selectedTransitionsToDelete.size === 0} className={`flex-1 px-3 py-1.5 rounded text-sm font-medium ${selectedTransitionsToDelete.size === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}>Delete Selected ({selectedTransitionsToDelete.size})</button>
            <button onClick={() => { setDeletionDialog(null); setSelectedTransitionsToDelete(new Set()); }} className="flex-1 px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};