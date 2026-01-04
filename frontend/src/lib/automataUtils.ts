// src/lib/automataUtils.ts
// COMPLETE FILE - Replace everything

import { State, Transition, Automaton } from './types';

// ==================== TYPE DEFINITIONS ====================

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
  crashed?: boolean;
}

// ==================== UTILITY FUNCTIONS ====================

export function sanitizeInput(input: string): string {
  const withoutTags = input.replace(/<[^>]*>/g, '');
  const sanitized = withoutTags.replace(/[^a-zA-Z0-9ε]/g, '');
  const maxLength = 1000;
  return sanitized.slice(0, maxLength);
}

export function validateAutomaton(automaton: Automaton): { valid: boolean; error?: string } {
  if (automaton.states.length === 0) {
    return { valid: false, error: 'No states defined' };
  }

  const initialState = automaton.states.find(s => s.isInitial);
  if (!initialState) {
    return { valid: false, error: 'No initial state defined' };
  }

  const finalStates = automaton.states.filter(s => s.isFinal);
  if (finalStates.length === 0) {
    return { valid: false, error: 'No final states defined' };
  }

  return { valid: true };
}

// ==================== DFA SIMULATION ====================

export function simulateDFA(
  automaton: Automaton,
  input: string
): SimulationResult {
  const sanitizedInput = sanitizeInput(input);
  const validation = validateAutomaton(automaton);
  
  if (!validation.valid) {
    return {
      steps: [],
      accepted: false,
      errorMessage: validation.error,
      crashed: false,
    };
  }

  const initialState = automaton.states.find(s => s.isInitial)!;
  const steps: SimulationStep[] = [];
  let currentStateId = initialState.id;
  let crashed = false;

  // Initial step
  steps.push({
    currentState: currentStateId,
    symbol: null,
    nextState: null,
    isValid: true,
    message: `Starting at state ${initialState.label}`,
    isCrashed: false,
  });

  // Process each symbol
  for (let i = 0; i < sanitizedInput.length; i++) {
    const symbol = sanitizedInput[i];
    const currentState = automaton.states.find(s => s.id === currentStateId);
    
    if (!currentState) {
      crashed = true;
      steps.push({
        currentState: currentStateId,
        symbol,
        nextState: null,
        isValid: false,
        isCrashed: true,
        message: `❌ Invalid state reached`,
      });
      break;
    }

    // Find transition for current state and symbol
    const transition = automaton.transitions.find(
      t => t.from === currentStateId && t.symbol === symbol
    );

    if (!transition) {
      // CRASH DETECTED - Set flag and break
      crashed = true;
      steps.push({
        currentState: currentStateId,
        symbol,
        nextState: null,
        isValid: false,
        isCrashed: true,
        message: `❌ No transition for '${symbol}' from ${currentState.label}. Automaton crashed!`,
      });
      break; // Break out of loop
    }

    const nextState = automaton.states.find(s => s.id === transition.to);
    if (!nextState) {
      crashed = true;
      steps.push({
        currentState: currentStateId,
        symbol,
        nextState: null,
        isValid: false,
        isCrashed: true,
        message: `❌ Invalid transition target`,
      });
      break;
    }

    steps.push({
      currentState: currentStateId,
      symbol,
      nextState: transition.to,
      isValid: true,
      isCrashed: false,
      message: `Read '${symbol}', move to ${nextState.label}`,
    });

    currentStateId = transition.to;
  }

  // Check if crashed
  if (!crashed) {
    // Normal end - check if accepted
    const finalState = automaton.states.find(s => s.id === currentStateId);
    const accepted = finalState?.isFinal || false;

    steps.push({
      currentState: currentStateId,
      symbol: null,
      nextState: null,
      isValid: accepted,
      isCrashed: false,
      message: accepted 
        ? `✅ String accepted! Ended in final state ${finalState?.label}`
        : `❌ String rejected. Ended in non-final state ${finalState?.label}`,
    });

    return {
      steps,
      accepted,
      crashed: false,
    };
  }

  // Crashed - return with crash flag
  return {
    steps,
    accepted: false,
    crashed: true,
    errorMessage: `Automaton crashed - no valid transition found`,
  };
}

// ==================== NFA SIMULATION ====================

export function simulateNFA(
  automaton: Automaton,
  input: string
): SimulationResult {
  const sanitizedInput = sanitizeInput(input);
  const validation = validateAutomaton(automaton);
  
  if (!validation.valid) {
    return {
      steps: [],
      accepted: false,
      errorMessage: validation.error,
      crashed: false,
    };
  }

  // For NFA, we track multiple possible states simultaneously
  const initialState = automaton.states.find(s => s.isInitial)!;
  let currentStates = new Set([initialState.id]);
  const steps: SimulationStep[] = [];
  let crashed = false;

  // Apply epsilon closure to initial state
  currentStates = getEpsilonClosure(currentStates, automaton.transitions, automaton.states);

  const getStateLabels = (stateIds: Set<string>) => {
    return Array.from(stateIds)
      .map(id => automaton.states.find(s => s.id === id)?.label || id)
      .join(', ');
  };

  steps.push({
    currentState: Array.from(currentStates).join(','),
    symbol: null,
    nextState: null,
    isValid: true,
    isCrashed: false,
    message: `Starting at state(s): {${getStateLabels(currentStates)}}`,
  });

  // Process each symbol
  for (let i = 0; i < sanitizedInput.length; i++) {
    const symbol = sanitizedInput[i];
    const nextStates = new Set<string>();

    // For each current state, find all possible next states (non-determinism!)
    for (const stateId of currentStates) {
      const transitions = automaton.transitions.filter(
        t => t.from === stateId && t.symbol === symbol
      );

      for (const transition of transitions) {
        nextStates.add(transition.to);
      }
    }

    // Check if no transitions exist (crash)
    if (nextStates.size === 0) {
      crashed = true;
      steps.push({
        currentState: Array.from(currentStates).join(','),
        symbol,
        nextState: null,
        isValid: false,
        isCrashed: true,
        message: `❌ No transitions for '${symbol}' from {${getStateLabels(currentStates)}}. NFA crashed!`,
      });
      break;
    }

    // Apply epsilon closure to next states
    const closedNextStates = getEpsilonClosure(nextStates, automaton.transitions, automaton.states);

    steps.push({
      currentState: Array.from(currentStates).join(','),
      symbol,
      nextState: Array.from(closedNextStates).join(','),
      isValid: true,
      isCrashed: false,
      message: `Read '${symbol}', move to {${getStateLabels(closedNextStates)}} (exploring ${closedNextStates.size} path${closedNextStates.size > 1 ? 's' : ''})`,
    });

    currentStates = closedNextStates;
  }

  // Check if crashed
  if (!crashed) {
    // Check if ANY current state is a final state (NFA acceptance condition)
    const finalStateIds = Array.from(currentStates).filter(stateId => {
      const state = automaton.states.find(s => s.id === stateId);
      return state?.isFinal;
    });

    const accepted = finalStateIds.length > 0;

    if (accepted) {
      const finalStateLabels = finalStateIds
        .map(id => automaton.states.find(s => s.id === id)?.label || id)
        .join(', ');
      
      steps.push({
        currentState: Array.from(currentStates).join(','),
        symbol: null,
        nextState: null,
        isValid: true,
        isCrashed: false,
        message: `✅ String accepted! At least one path ended in final state: {${finalStateLabels}}`,
      });
    } else {
      steps.push({
        currentState: Array.from(currentStates).join(','),
        symbol: null,
        nextState: null,
        isValid: false,
        isCrashed: false,
        message: `❌ String rejected. No path ended in a final state (Current: {${getStateLabels(currentStates)}})`,
      });
    }

    return {
      steps,
      accepted,
      crashed: false,
    };
  }

  // Crashed - return with crash flag
  return {
    steps,
    accepted: false,
    crashed: true,
    errorMessage: `NFA crashed - no valid transitions found`,
  };
}

// ==================== EPSILON CLOSURE ====================

function getEpsilonClosure(
  states: Set<string>,
  transitions: Transition[],
  allStates: State[]
): Set<string> {
  const closure = new Set(states);
  const stack = Array.from(states);
  const visited = new Set<string>();

  while (stack.length > 0) {
    const state = stack.pop()!;
    
    // Avoid infinite loops
    if (visited.has(state)) continue;
    visited.add(state);

    // Find epsilon transitions (ε or 'epsilon' string or '^')
    const epsilonTransitions = transitions.filter(
      t => t.from === state && (t.symbol === 'ε' || t.symbol === 'epsilon' || t.symbol === '^')
    );

    for (const transition of epsilonTransitions) {
      // Validate target state exists
      if (allStates.find(s => s.id === transition.to)) {
        if (!closure.has(transition.to)) {
          closure.add(transition.to);
          stack.push(transition.to);
        }
      }
    }
  }

  return closure;
}