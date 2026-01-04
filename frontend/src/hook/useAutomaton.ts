// src/hooks/useAutomaton.ts

import { useState, useCallback } from 'react';
import { State, Transition, Automaton } from '../lib/types';

export function useAutomaton(initialType: 'DFA' | 'NFA' = 'DFA') {
  const [states, setStates] = useState<State[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [type, setType] = useState<'DFA' | 'NFA'>(initialType);

  const automaton: Automaton = {
    states,
    transitions,
    alphabet: Array.from(new Set(transitions.map(t => t.symbol))).filter(s => s && s !== 'ε'),
    type,
  };

  const addState = useCallback((state: State) => {
    setStates(prev => [...prev, state]);
  }, []);

  const removeState = useCallback((stateId: string) => {
    setStates(prev => prev.filter(s => s.id !== stateId));
    setTransitions(prev => prev.filter(t => t.from !== stateId && t.to !== stateId));
  }, []);

  const updateState = useCallback((stateId: string, updates: Partial<State>) => {
    setStates(prev => prev.map(s => s.id === stateId ? { ...s, ...updates } : s));
  }, []);

  const addTransition = useCallback((transition: Transition) => {
    setTransitions(prev => [...prev, transition]);
  }, []);

  const removeTransition = useCallback((transitionId: string) => {
    setTransitions(prev => prev.filter(t => t.id !== transitionId));
  }, []);

  const changeType = useCallback((newType: 'DFA' | 'NFA') => {
    // Warn if changing type with existing automaton
    if ((states.length > 0 || transitions.length > 0) && newType !== type) {
      const confirmed = window.confirm(
        `You are changing from ${type} to ${newType}. The automaton structure will remain the same. Continue?`
      );
      if (!confirmed) return;
    }
    setType(newType);
  }, [states.length, transitions.length, type]);

  const clear = useCallback(() => {
    setStates([]);
    setTransitions([]);
  }, []);

  return {
    automaton,
    states,
    transitions,
    type,
    addState,
    removeState,
    updateState,
    addTransition,
    removeTransition,
    setStates,
    setTransitions,
    changeType,
    clear,
  };
}