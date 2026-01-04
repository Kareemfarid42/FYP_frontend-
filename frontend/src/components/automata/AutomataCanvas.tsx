import React, { useState, useRef, useCallback } from 'react';

// Types
interface Position {
  x: number;
  y: number;
}

interface State {
  id: string;
  label: string;
  position: Position;
  isInitial: boolean;
  isFinal: boolean;
}

interface Transition {
  id: string;
  from: string;
  to: string;
  symbol: string;
}

type Tool = 'select' | 'add-state' | 'delete-state' | 'add-transition' | 'delete-transition' | 'set-initial' | 'set-final';

interface AutomataCanvasProps {
  selectedTool: Tool | null;
  onToolUsed?: () => void;
  currentSimulationState?: string | null;  // For NFA: comma-separated state IDs
  highlightedTransition?: { from: string; to: string; symbol: string } | null;
  isSimulating?: boolean;
  states: State[];
  transitions: Transition[];
  onStatesChange: (states: State[]) => void;
  onTransitionsChange: (transitions: Transition[]) => void;
}

const STATE_RADIUS = 30;
const ARROW_SIZE = 10;
const CURVE_OFFSET = 30;

interface GroupedTransition {
  from: string;
  to: string;
  symbols: string[];
  transitionIds: string[];
  isHighlighted: boolean;
}

// NEW: Interface for deletion dialog
interface DeletionDialogData {
  visible: boolean;
  position: { x: number; y: number };
  fromState: State;
  toState: State;
  transitions: Transition[];
}

export const AutomataCanvas: React.FC<AutomataCanvasProps> = ({ 
  selectedTool, 
  onToolUsed,
  currentSimulationState,
  highlightedTransition,
  isSimulating = false,
  states,
  transitions,
  onStatesChange,
  onTransitionsChange,
}) => {
  const setStates = onStatesChange;
  const setTransitions = onTransitionsChange;
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [transitionStart, setTransitionStart] = useState<string | null>(null);
  const [draggingState, setDraggingState] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [transitionDialogPos, setTransitionDialogPos] = useState({ x: 0, y: 0 });
  const [transitionInput, setTransitionInput] = useState('');
  
  // NEW: State for deletion dialog
  const [deletionDialog, setDeletionDialog] = useState<DeletionDialogData | null>(null);
  const [selectedTransitionsToDelete, setSelectedTransitionsToDelete] = useState<Set<string>>(new Set());
  
  const svgRef = useRef<SVGSVGElement>(null);

  const getNextStateLabel = useCallback(() => {
    const usedLabels = new Set(states.map(s => s.label));
    let label = 'q0';
    let index = 0;
    while (usedLabels.has(label)) {
      index++;
      label = `q${index}`;
    }
    return label;
  }, [states]);

  const hasBidirectionalTransition = useCallback((from: string, to: string) => {
    return transitions.some(t => t.from === to && t.to === from);
  }, [transitions]);

  const groupTransitions = useCallback((): GroupedTransition[] => {
    const grouped = new Map<string, GroupedTransition>();

    // Parse current simulation states for NFA highlighting
    const currentStates = currentSimulationState 
      ? currentSimulationState.split(',').map(s => s.trim())
      : [];
    
    // Parse next states from highlightedTransition
    const nextStates = highlightedTransition?.to
      ? highlightedTransition.to.split(',').map(s => s.trim())
      : [];
    
    const highlightedSymbol = highlightedTransition?.symbol;

    transitions.forEach(transition => {
      const key = `${transition.from}->${transition.to}`;
      
      // Check if this specific transition should be highlighted
      // For NFA: transition is highlighted if its from state is in currentStates
      // AND its to state is in nextStates AND symbol matches
      const isFromCurrent = currentStates.length > 0 && currentStates.includes(transition.from);
      const isToNext = nextStates.length > 0 && nextStates.includes(transition.to);
      const isSymbolMatch = highlightedSymbol === transition.symbol;
      const shouldHighlight = isFromCurrent && isToNext && isSymbolMatch;
      
      if (grouped.has(key)) {
        const group = grouped.get(key)!;
        group.symbols.push(transition.symbol);
        group.transitionIds.push(transition.id);
        
        // If ANY transition in this group should be highlighted, highlight the whole group
        if (shouldHighlight) {
          group.isHighlighted = true;
        }
      } else {
        grouped.set(key, {
          from: transition.from,
          to: transition.to,
          symbols: [transition.symbol],
          transitionIds: [transition.id],
          isHighlighted: shouldHighlight
        });
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

  const symbols = transitionInput
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (symbols.length === 0) {
    alert('Please enter at least one symbol');
    return;
  }

  const targetStateId = selectedState;
  if (!targetStateId) {
    setShowTransitionDialog(false);
    return;
  }

  // NEW: Check for duplicates
  const duplicates: string[] = [];
  const validSymbols: string[] = [];
  
  symbols.forEach(symbol => {
    // Check if transition already exists
    const exists = transitions.some(
      t => t.from === transitionStart && t.to === targetStateId && t.symbol === symbol
    );
    
    if (exists) {
      duplicates.push(symbol);
    } else {
      validSymbols.push(symbol);
    }
  });

  // Show error if duplicates found
  if (duplicates.length > 0) {
    const fromState = states.find(s => s.id === transitionStart);
    const toState = states.find(s => s.id === targetStateId);
    alert(
      `❌ Duplicate transition(s) detected!\n\n` +
      `Transition(s) for symbol(s) "${duplicates.join(', ')}" already exist from ${fromState?.label} to ${toState?.label}.\n\n` +
      `Please use different symbols.`
    );
    
    // If ALL symbols were duplicates, close dialog
    if (validSymbols.length === 0) {
      setShowTransitionDialog(false);
      setTransitionInput('');
      setTransitionStart(null);
      return;
    }
  }

  // Only create transitions for valid (non-duplicate) symbols
  const newTransitions = validSymbols.map(symbol => ({
    id: `transition-${Date.now()}-${Math.random()}`,
    from: transitionStart,
    to: targetStateId,
    symbol: symbol,
  }));

  if (newTransitions.length > 0) {
    setTransitions([...transitions, ...newTransitions]);
  }
  
  setShowTransitionDialog(false);
  setTransitionInput('');
  setTransitionStart(null);
  onToolUsed?.();
};

  // NEW: Function to find all transitions near a point
  const findTransitionsNearPoint = (point: Position): Transition[] => {
    const foundTransitions: Transition[] = [];
    
    for (const transition of transitions) {
      const fromState = states.find(s => s.id === transition.from);
      const toState = states.find(s => s.id === transition.to);
      if (!fromState || !toState) continue;

      if (transition.from === transition.to) {
        const loopCenterX = fromState.position.x;
        const loopCenterY = fromState.position.y - STATE_RADIUS - 20;
        const distance = Math.sqrt(
          Math.pow(loopCenterX - point.x, 2) + Math.pow(loopCenterY - point.y, 2)
        );
        
        if (distance < 30) {
          foundTransitions.push(transition);
        }
      } else {
        const isBidirectional = hasBidirectionalTransition(transition.from, transition.to);
        const curveOffset = isBidirectional ? CURVE_OFFSET : 0;

        const dx = toState.position.x - fromState.position.x;
        const dy = toState.position.y - fromState.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const perpX = -dy / distance;
        const perpY = dx / distance;

        const angle = Math.atan2(dy, dx);
        const angleOffset = isBidirectional ? 0.2 : 0;
        const startAngle = angle + angleOffset;
        const endAngle = angle + Math.PI + angleOffset;

        const startPoint = {
          x: fromState.position.x + STATE_RADIUS * Math.cos(startAngle),
          y: fromState.position.y + STATE_RADIUS * Math.sin(startAngle),
        };

        const endPoint = {
          x: toState.position.x + STATE_RADIUS * Math.cos(endAngle),
          y: toState.position.y + STATE_RADIUS * Math.sin(endAngle),
        };

        const midX = (startPoint.x + endPoint.x) / 2;
        const midY = (startPoint.y + endPoint.y) / 2;
        const controlX = midX + perpX * curveOffset;
        const controlY = midY + perpY * curveOffset;

        let minDistance = Infinity;
        for (let t = 0; t <= 1; t += 0.05) {
          const curveX = (1-t)*(1-t)*startPoint.x + 2*(1-t)*t*controlX + t*t*endPoint.x;
          const curveY = (1-t)*(1-t)*startPoint.y + 2*(1-t)*t*controlY + t*t*endPoint.y;
          const dist = Math.sqrt(
            Math.pow(curveX - point.x, 2) + Math.pow(curveY - point.y, 2)
          );
          minDistance = Math.min(minDistance, dist);
        }
        
        if (minDistance < 20) {
          foundTransitions.push(transition);
        }
      }
    }
    
    return foundTransitions;
  };

  // NEW: Handle deletion dialog submission
  const handleDeleteSelected = () => {
    if (selectedTransitionsToDelete.size === 0) {
      setDeletionDialog(null);
      setSelectedTransitionsToDelete(new Set());
      return;
    }

    // Remove selected transitions
    const newTransitions = transitions.filter(t => !selectedTransitionsToDelete.has(t.id));
    setTransitions(newTransitions);
    
    // Close dialog and reset selection
    setDeletionDialog(null);
    setSelectedTransitionsToDelete(new Set());
    onToolUsed?.();
  };

  // NEW: Toggle transition selection
  const toggleTransitionSelection = (transitionId: string) => {
    const newSelection = new Set(selectedTransitionsToDelete);
    if (newSelection.has(transitionId)) {
      newSelection.delete(transitionId);
    } else {
      newSelection.add(transitionId);
    }
    setSelectedTransitionsToDelete(newSelection);
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !selectedTool || isSimulating) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedState = states.find(s => {
      const dx = s.position.x - x;
      const dy = s.position.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= STATE_RADIUS;
    });

    if (selectedTool === 'add-state' && !clickedState) {
      const newState: State = {
        id: `state-${Date.now()}`,
        label: getNextStateLabel(),
        position: { x, y },
        isInitial: states.length === 0,
        isFinal: false,
      };
      setStates([...states, newState]);
      onToolUsed?.();
    } else if (selectedTool === 'delete-state' && clickedState) {
      setStates(states.filter(s => s.id !== clickedState.id));
      setTransitions(transitions.filter(t => t.from !== clickedState.id && t.to !== clickedState.id));
      onToolUsed?.();
    } else if (selectedTool === 'add-transition' && clickedState) {
      if (!transitionStart) {
        setTransitionStart(clickedState.id);
      } else {
        setSelectedState(clickedState.id);
        setTransitionDialogPos({ x: e.clientX, y: e.clientY });
        setShowTransitionDialog(true);
      }
    } else if (selectedTool === 'delete-transition') {
      // NEW: Find all transitions near the click point
      const clickedTransitions = findTransitionsNearPoint({ x, y });
      
      if (clickedTransitions.length > 0) {
        // Get the first transition to determine from/to states
        const firstTransition = clickedTransitions[0];
        const fromState = states.find(s => s.id === firstTransition.from);
        const toState = states.find(s => s.id === firstTransition.to);
        
        if (fromState && toState) {
          // Find ALL transitions between these two states (same direction)
          const allTransitionsBetween = transitions.filter(
            t => t.from === firstTransition.from && t.to === firstTransition.to
          );
          
          if (allTransitionsBetween.length === 1) {
            // Only one transition - delete it immediately
            setTransitions(transitions.filter(t => t.id !== allTransitionsBetween[0].id));
            onToolUsed?.();
          } else {
            // Multiple transitions - show deletion dialog
            setDeletionDialog({
              visible: true,
              position: { x: e.clientX, y: e.clientY },
              fromState,
              toState,
              transitions: allTransitionsBetween
            });
            // Pre-select all transitions by default
            setSelectedTransitionsToDelete(new Set(allTransitionsBetween.map(t => t.id)));
          }
        }
      }
    } else if (selectedTool === 'set-initial' && clickedState) {
      setStates(states.map(s => ({
        ...s,
        isInitial: s.id === clickedState.id,
      })));
      onToolUsed?.();
    } else if (selectedTool === 'set-final' && clickedState) {
      setStates(states.map(s => 
        s.id === clickedState.id ? { ...s, isFinal: !s.isFinal } : s
      ));
      onToolUsed?.();
    }
  };

  const handleStateMouseDown = (e: React.MouseEvent, stateId: string) => {
    if ((selectedTool === 'select' || !selectedTool) && !isSimulating) {
      e.stopPropagation();
      const state = states.find(s => s.id === stateId);
      if (state && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setDraggingState(stateId);
        setDragOffset({
          x: mouseX - state.position.x,
          y: mouseY - state.position.y,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingState && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      setStates(states.map(s =>
        s.id === draggingState ? { ...s, position: { x, y } } : s
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggingState(null);
  };

  const groupedTransitions = groupTransitions();

  // NEW: Parse current simulation states (for NFA support)
  const currentSimulationStates = currentSimulationState 
    ? currentSimulationState.split(',').map(s => s.trim())
    : [];

  return (
    <>
      <svg
        ref={svgRef}
        className="w-full h-full"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <style>{`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>

        {groupedTransitions.map((group, index) => {
          const fromState = states.find(s => s.id === group.from);
          const toState = states.find(s => s.id === group.to);
          if (!fromState || !toState) return null;

          const isSelfLoop = group.from === group.to;
          const isBidirectional = hasBidirectionalTransition(group.from, group.to);
          const curveOffset = isBidirectional ? CURVE_OFFSET : 0;
          // NEW: Highlight specific symbol during simulation
          const symbolLabel = group.symbols.join(', ');
          const highlightedSymbol = group.isHighlighted && highlightedTransition?.symbol 
            ? highlightedTransition.symbol 
            : null;

          if (isSelfLoop) {
            const loopOffset = 40;
            return (
              <g key={`group-${index}`}>
                <circle
                  cx={fromState.position.x}
                  cy={fromState.position.y - STATE_RADIUS - loopOffset / 2}
                  r={loopOffset / 2}
                  fill="none"
                  stroke={group.isHighlighted ? "#22c55e" : "black"}
                  strokeWidth={group.isHighlighted ? "3" : "2"}
                />
                <text
                  x={fromState.position.x}
                  y={fromState.position.y - STATE_RADIUS - loopOffset - 5}
                  textAnchor="middle"
                  fill="black"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {highlightedSymbol ? (
                    // Render each symbol, highlighting the one being used
                    group.symbols.map((sym, idx) => (
                      <tspan 
                        key={idx}
                        fill={sym === highlightedSymbol ? "#22c55e" : "black"}
                        fontWeight={sym === highlightedSymbol ? "900" : "bold"}
                        fontSize={sym === highlightedSymbol ? "16" : "14"}
                      >
                        {sym}{idx < group.symbols.length - 1 ? ', ' : ''}
                      </tspan>
                    ))
                  ) : (
                    symbolLabel
                  )}
                </text>
              </g>
            );
          }

          const dx = toState.position.x - fromState.position.x;
          const dy = toState.position.y - fromState.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const perpX = -dy / distance;
          const perpY = dx / distance;

          const angle = Math.atan2(dy, dx);
          const angleOffset = isBidirectional ? 0.2 : 0;
          const startAngle = angle + angleOffset;
          const endAngle = angle + Math.PI + angleOffset;

          const startPoint = {
            x: fromState.position.x + STATE_RADIUS * Math.cos(startAngle),
            y: fromState.position.y + STATE_RADIUS * Math.sin(startAngle),
          };

          const endPoint = {
            x: toState.position.x + STATE_RADIUS * Math.cos(endAngle),
            y: toState.position.y + STATE_RADIUS * Math.sin(endAngle),
          };

          const midX = (startPoint.x + endPoint.x) / 2;
          const midY = (startPoint.y + endPoint.y) / 2;
          const controlX = midX + perpX * curveOffset;
          const controlY = midY + perpY * curveOffset;

          const textX = 0.25 * startPoint.x + 0.5 * controlX + 0.25 * endPoint.x;
          const textY = 0.25 * startPoint.y + 0.5 * controlY + 0.25 * endPoint.y;

          const t = 0.95;
          const curveEndX = (1-t)*(1-t)*startPoint.x + 2*(1-t)*t*controlX + t*t*endPoint.x;
          const curveEndY = (1-t)*(1-t)*startPoint.y + 2*(1-t)*t*controlY + t*t*endPoint.y;
          const arrowAngle = Math.atan2(endPoint.y - curveEndY, endPoint.x - curveEndX);

          const arrowPoint = endPoint;
          const arrowLeft = {
            x: arrowPoint.x - ARROW_SIZE * Math.cos(arrowAngle - Math.PI / 6),
            y: arrowPoint.y - ARROW_SIZE * Math.sin(arrowAngle - Math.PI / 6),
          };
          const arrowRight = {
            x: arrowPoint.x - ARROW_SIZE * Math.cos(arrowAngle + Math.PI / 6),
            y: arrowPoint.y - ARROW_SIZE * Math.sin(arrowAngle + Math.PI / 6),
          };

          return (
            <g key={`group-${index}`}>
              <path
                d={`M ${startPoint.x} ${startPoint.y} Q ${controlX} ${controlY} ${endPoint.x} ${endPoint.y}`}
                fill="none"
                stroke={group.isHighlighted ? "#22c55e" : "black"}
                strokeWidth={group.isHighlighted ? "3" : "2"}
              />
              
              <polygon
                points={`${arrowPoint.x},${arrowPoint.y} ${arrowLeft.x},${arrowLeft.y} ${arrowRight.x},${arrowRight.y}`}
                fill={group.isHighlighted ? "#22c55e" : "black"}
              />
              
              <text
                x={textX}
                y={textY - 5}
                textAnchor="middle"
                fill="black"
                fontSize="14"
                fontWeight="bold"
              >
                {highlightedSymbol ? (
                  // Render each symbol, highlighting the one being used
                  group.symbols.map((sym, idx) => (
                    <tspan 
                      key={idx}
                      fill={sym === highlightedSymbol ? "#22c55e" : "black"}
                      fontWeight={sym === highlightedSymbol ? "900" : "bold"}
                      fontSize={sym === highlightedSymbol ? "16" : "14"}
                    >
                      {sym}{idx < group.symbols.length - 1 ? ', ' : ''}
                    </tspan>
                  ))
                ) : (
                  symbolLabel
                )}
              </text>
            </g>
          );
        })}

        {transitionStart && selectedTool === 'add-transition' && !showTransitionDialog && (
          <line
            x1={states.find(s => s.id === transitionStart)?.position.x}
            y1={states.find(s => s.id === transitionStart)?.position.y}
            x2={hoveredState ? states.find(s => s.id === hoveredState)?.position.x : states.find(s => s.id === transitionStart)?.position.x}
            y2={hoveredState ? states.find(s => s.id === hoveredState)?.position.y : states.find(s => s.id === transitionStart)?.position.y}
            stroke="black"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.5"
          />
        )}

        {states.map(state => {
          // NEW: Check if this state is in the current simulation states (supports multiple for NFA)
          const isCurrentState = currentSimulationStates.includes(state.id);
          
          const stateColor = isSimulating 
            ? (isCurrentState 
                ? (state.isFinal ? '#22c55e' : '#ef4444')
                : 'rgba(255, 255, 255, 0.3)')
            : (hoveredState === state.id ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)');
          
          return (
          <g key={state.id}>
            {state.isInitial && (
              <>
                <line
                  x1={state.position.x - STATE_RADIUS - 30}
                  y1={state.position.y}
                  x2={state.position.x - STATE_RADIUS}
                  y2={state.position.y}
                  stroke="black"
                  strokeWidth="2"
                />
                <polygon
                  points={`${state.position.x - STATE_RADIUS},${state.position.y} ${state.position.x - STATE_RADIUS - 10},${state.position.y - 5} ${state.position.x - STATE_RADIUS - 10},${state.position.y + 5}`}
                  fill="black"
                />
              </>
            )}

            <circle
              cx={state.position.x}
              cy={state.position.y}
              r={STATE_RADIUS}
              fill={stateColor}
              stroke={isCurrentState ? (state.isFinal ? '#22c55e' : '#ef4444') : 'black'}
              strokeWidth={isCurrentState ? "4" : "2"}
              style={isCurrentState ? { animation: 'blink 1.5s ease-in-out infinite' } : {}}
              cursor={selectedTool === 'select' || !selectedTool ? 'move' : 'pointer'}
              onMouseDown={(e) => handleStateMouseDown(e, state.id)}
              onMouseEnter={() => setHoveredState(state.id)}
              onMouseLeave={() => setHoveredState(null)}
            />

            {state.isFinal && (
              <circle
                cx={state.position.x}
                cy={state.position.y}
                r={STATE_RADIUS - 5}
                fill="none"
                stroke="black"
                strokeWidth="2"
              />
            )}

            <text
              x={state.position.x}
              y={state.position.y + 5}
              textAnchor="middle"
              fill="black"
              fontSize="16"
              fontWeight="bold"
              pointerEvents="none"
            >
              {state.label}
            </text>
          </g>
        )})}

        {states.length === 0 && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            fill="black"
            fontSize="20"
            opacity="0.5"
          >
            Click to add your first state
          </text>
        )}
      </svg>

      {/* Transition Input Dialog */}
      {showTransitionDialog && (
        <div
          className="fixed bg-white border-2 border-blue-500 rounded-lg shadow-xl p-4 z-50"
          style={{
            left: `${transitionDialogPos.x}px`,
            top: `${transitionDialogPos.y}px`,
            transform: 'translate(-50%, -100%) translateY(-10px)'
          }}
        >
          <div className="text-sm font-semibold text-gray-700 mb-2">
            Enter Transition Symbol(s)
          </div>
          <input
            type="text"
            value={transitionInput}
            onChange={(e) => setTransitionInput(e.target.value)}
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
          <div className="text-xs text-gray-500 mt-1 mb-3">
            Separate multiple symbols with commas
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTransitionSubmit}
              className="flex-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowTransitionDialog(false);
                setTransitionInput('');
                setTransitionStart(null);
              }}
              className="flex-1 px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* NEW: Transition Deletion Dialog */}
      {deletionDialog && (
        <div
          className="fixed bg-white border-2 border-red-500 rounded-lg shadow-xl p-4 z-50 min-w-[280px]"
          style={{
            left: `${deletionDialog.position.x}px`,
            top: `${deletionDialog.position.y}px`,
            transform: 'translate(-50%, -100%) translateY(-10px)'
          }}
        >
          <div className="text-sm font-semibold text-gray-700 mb-2">
            Delete Transitions from {deletionDialog.fromState.label} → {deletionDialog.toState.label}
          </div>
          
          <div className="text-xs text-gray-600 mb-3">
            Select which transitions to delete:
          </div>

          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {deletionDialog.transitions.map((transition) => (
              <label 
                key={transition.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTransitionsToDelete.has(transition.id)}
                  onChange={() => toggleTransitionSelection(transition.id)}
                  className="w-4 h-4 text-red-500 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {transition.symbol}
                </span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDeleteSelected}
              disabled={selectedTransitionsToDelete.size === 0}
              className={`flex-1 px-3 py-1.5 rounded text-sm font-medium ${
                selectedTransitionsToDelete.size === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              Delete Selected ({selectedTransitionsToDelete.size})
            </button>
            <button
              onClick={() => {
                setDeletionDialog(null);
                setSelectedTransitionsToDelete(new Set());
              }}
              className="flex-1 px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};