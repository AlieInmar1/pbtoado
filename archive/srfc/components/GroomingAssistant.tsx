import React, { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, ArrowPathIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function GroomingAssistant() {
  const { currentWorkspace } = useWorkspace();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const analyzeNotes = async () => {
    if (!currentWorkspace || !notes.trim()) return;
    
    setAnalyzing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-story`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId: currentWorkspace.id,
            storyData: {
              description: notes,
            },
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to analyze notes');

      const analysis = await response.json();
      setSuggestions(analysis.suggestions || []);
      toast.success('Notes analyzed successfully');
    } catch (error) {
      console.error('Error analyzing notes:', error);
      toast.error('Failed to analyze notes');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div 
      className={`
        transition-all duration-300 ease-in-out transform bg-white border border-gray-100
        ${isCollapsed 
          ? 'w-14 h-14 rounded-full shadow-lg hover:scale-110' 
          : 'w-96 h-[650px] rounded-2xl shadow-2xl'
        }
      `}
    >
      <div className="relative h-full">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-2 top-4 bg-white rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <ChevronRightIcon className="h-4 w-4 text-gray-600" />
        </button>
        
        <div className="h-full">
          {isCollapsed ? (
            <div 
              className="w-full h-full flex items-center justify-center cursor-pointer"
              onClick={() => setIsCollapsed(false)}
            >
              <SparklesIcon className="h-6 w-6 text-indigo-600 animate-pulse" />
            </div>
          ) : (
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center space-x-2 mb-4">
                <SparklesIcon className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-medium text-gray-900">Grooming Assistant</h2>
              </div>

              <div className="flex-1 flex flex-col space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes & Ideas
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={8}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Jot down your thoughts, questions, and ideas during grooming..."
                  />
                </div>

                <button
                  onClick={analyzeNotes}
                  disabled={analyzing || !notes.trim()}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Get AI Feedback
                    </>
                  )}
                </button>

                {suggestions.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">AI Suggestions</h4>
                    <ul className="space-y-2 text-sm text-blue-700">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                            {index + 1}
                          </span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}