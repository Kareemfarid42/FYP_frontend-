// src/components/Sidebar.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Eye, Edit, Loader2, RefreshCw } from 'lucide-react';
import { getAutomataList, deleteAutomata } from '../lib/api';
import type { AutomataListItem } from '../lib/api';

interface SidebarProps {
  onPreview: (encodedId: string) => void; 
  onEdit: (encodedId: string) => void;  
  onRefresh?: () => void;
}

export function Sidebar({ onPreview, onEdit, onRefresh }: SidebarProps) {
  const [automataList, setAutomataList] = useState<AutomataListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAutomata = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAutomataList();
      setAutomataList(data);
    } catch (err) {
      console.error('Failed to load automata:', err);
      setError('Failed to load automata');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAutomata();
  }, []);

  const handleDelete = async (encodedId: string, e: React.MouseEvent) => {  // CHANGED: Accept encodedId
  e.stopPropagation();
  
  if (!confirm('Are you sure you want to delete this automaton?')) {
    return;
  }

  setDeletingId(encodedId);
  try {
    await deleteAutomata(encodedId);
    setAutomataList((prev) => prev.filter((item) => item.encoded_id !== encodedId)); 
    onRefresh?.();
  } catch (err) {
    console.error('Failed to delete automata:', err);
    alert('Failed to delete automaton');
  } finally {
    setDeletingId(null);
  }
};

  const handleRefresh = () => {
    loadAutomata();
    onRefresh?.();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="w-64 bg-white/10 backdrop-blur-md border-r border-white/20 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            My Automata
          </h2>
          <button
            onClick={handleRefresh}
            className="text-white/60 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-white/60">
          {automataList.length} saved {automataList.length === 1 ? 'automaton' : 'automata'}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center p-4">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <button
              onClick={handleRefresh}
              className="text-blue-400 text-xs hover:text-blue-300 underline"
            >
              Try again
            </button>
          </div>
        ) : automataList.length === 0 ? (
          <div className="text-center p-4">
            <FileText className="h-12 w-12 text-white/30 mx-auto mb-2" />
            <p className="text-white/60 text-sm">No automata saved yet</p>
            <p className="text-white/40 text-xs mt-1">Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {automataList.map((automata) => (
              <div
                key={automata.id}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 transition-colors group"
              >
                {/* Title and Type */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">
                      {automata.name}
                    </h3>
                    <p className="text-white/60 text-xs">
                      {automata.type} • {formatDate(automata.created_at)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {automata.description && (
                  <p className="text-white/50 text-xs mb-2 line-clamp-2">
                    {automata.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-white/60 mb-3">
                  <span>{automata.states_count} states</span>
                  <span>•</span>
                  <span>{automata.transitions_count} transitions</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPreview(automata.encoded_id)}  // CHANGED: Use encoded_id
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 rounded text-xs transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => onEdit(automata.encoded_id)}  // CHANGED: Use encoded_id
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-300 rounded text-xs transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => handleDelete(automata.encoded_id, e)}  // CHANGED: Use encoded_id
                    disabled={deletingId === automata.encoded_id}  // CHANGED: Compare with encoded_id
                    className="px-2 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded text-xs transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === automata.encoded_id ? (  // CHANGED: Compare with encoded_id
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}