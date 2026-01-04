// src/lib/types.ts

export interface Position {
  x: number;
  y: number;
}

export interface State {
  id: string;
  label: string;
  position: Position;
  isInitial: boolean;
  isFinal: boolean;
}

export interface Transition {
  id: string;
  from: string; // state id
  to: string; // state id
  symbol: string;
  controlPoint?: Position; // For curved transitions
}

export interface Automaton {
  states: State[];
  transitions: Transition[];
  alphabet: string[];
  type: 'DFA' | 'NFA';
}

export interface SimulationStep {
  currentState: string;
  symbol: string | null;
  nextState: string | null;
  isValid: boolean;
  message: string;
  isCrashed?: boolean;
}

export interface SimulationResult {
  steps: SimulationStep[];
  accepted: boolean;
  errorMessage?: string;
  crashed? : boolean;
}

export type Tool = 
  | 'select'
  | 'add-state' 
  | 'delete-state' 
  | 'add-transition' 
  | 'delete-transition'
  | 'set-initial'
  | 'set-final';

export interface CanvasState {
  automaton: Automaton;
  selectedTool: Tool | null;
  selectedState: string | null;
  selectedTransition: string | null;
  transitionStart: string | null; // For drawing transitions
  hoveredState: string | null;
}