import React, { useState, useEffect } from 'react';
import { Story, ScoreValue } from '../../../types/story-creator';
import { useSuggestions } from '../hooks/useSuggestions';

interface ContextAwareAIHelperProps {
  story: Partial<Story>;
  currentSection: string;
  onApplySuggestion: (field: string, value: any) => void;
}

// Interface for content suggestions
interface ContentSuggestion {
  content: string;
  rationale: string;
}

// Type for all possible suggestions
type Suggestion = 
  | { type: 'text'; field: keyof Story; suggestion: ContentSuggestion }
  | { type: 'relationship'; parentFeature: { id: string; name: string }; explanation: string };

/**
 * ContextAwareAIHelper provides AI-generated suggestions based on the
 * section of the story form that's currently being edited.
 * 
 * It adapts its recommendations based on context and provides specific
 * guidance for acceptance criteria, planning, and other story elements.
 */
export const ContextAwareAIHelper: React.FC<ContextAwareAIHelperProps> = ({
  story,
  currentSection,
  onApplySuggestion
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  
  // Use our hook that calls the AI suggestion API
  const { generateSuggestions, isLoading } = useSuggestions();
  
  // Effect to clear suggestions when section changes
  useEffect(() => {
    setSuggestions([]);
  }, [currentSection]);
  
  // Generate context-specific suggestions
  const generateContextualSuggestions = async () => {
    setIsGenerating(true);
    
    try {
      // Call API with the current story and section
      const result = await generateSuggestions(story, currentSection);
      
      // Process and format the results as suggestions
      if (result) {
        const formattedSuggestions = formatSuggestions(result, currentSection);
        setSuggestions(formattedSuggestions);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Format raw API suggestions into structured suggestion objects
  const formatSuggestions = (
    rawSuggestions: any, 
    section: string
  ): Suggestion[] => {
    if (!rawSuggestions) return [];
    
    const formatted: Suggestion[] = [];
    
    switch (section) {
      case 'rice':
        // Skip - RICE scoring is handled in the full editor
        break;
        
      case 'content':
        // Handle content suggestions
        if (rawSuggestions.acceptanceCriteria) {
          formatted.push({
            type: 'text',
            field: 'acceptance_criteria',
            suggestion: {
              content: rawSuggestions.acceptanceCriteria.content,
              rationale: rawSuggestions.acceptanceCriteria.rationale
            }
          });
        }
        break;
        
      case 'planning':
        // Handle planning suggestions
        if (rawSuggestions.timeframe) {
          formatted.push({
            type: 'text',
            field: 'timeframe',
            suggestion: {
              content: rawSuggestions.timeframe.content,
              rationale: rawSuggestions.timeframe.rationale
            }
          });
        }
        break;
        
      case 'main':
        // Handle main information suggestions
        if (rawSuggestions.parentFeature) {
          formatted.push({
            type: 'relationship',
            parentFeature: {
              id: rawSuggestions.parentFeature.id,
              name: rawSuggestions.parentFeature.name
            },
            explanation: rawSuggestions.parentFeature.explanation
          });
        }
        break;
        
      default:
        // For other sections, just pass through text suggestions
        Object.entries(rawSuggestions).forEach(([key, value]: [string, any]) => {
          if (value && value.content) {
            formatted.push({
              type: 'text',
              field: key as keyof Story,
              suggestion: {
                content: value.content,
                rationale: value.rationale || 'AI suggested content'
              }
            });
          }
        });
    }
    
    return formatted;
  };
  
  // Handle applying a suggestion
  const applySuggestion = (suggestion: Suggestion) => {
    switch (suggestion.type) {
      case 'text':
        onApplySuggestion(suggestion.field, suggestion.suggestion.content);
        break;
        
      case 'relationship':
        onApplySuggestion('parent_feature_id', suggestion.parentFeature.id);
        onApplySuggestion('parent_feature_name', suggestion.parentFeature.name);
        break;
    }
  };
  
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
          <svg className="h-5 w-5 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          AI Recommendations
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Context-aware suggestions for the {currentSection} section
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {/* Generate button */}
        <button
          type="button"
          onClick={generateContextualSuggestions}
          disabled={isGenerating || isLoading}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isGenerating || isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isGenerating || isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Recommendations'
          )}
        </button>
        
        {/* No suggestions placeholder */}
        {!isGenerating && !isLoading && suggestions.length === 0 && (
          <div className="text-center mt-8 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Click the button above to generate AI recommendations for this section.
            </p>
          </div>
        )}
        
        {/* RICE section warning */}
        {currentSection === 'rice' && (
          <div className="mt-4 p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-md">
            <h4 className="font-medium mb-1">Note:</h4>
            <p className="text-sm">
              RICE scoring recommendations have been moved to the main editor. This allows you to focus on content first, then evaluate impact in a dedicated step.
            </p>
          </div>
        )}
        
        {/* Suggestions list */}
        {suggestions.length > 0 && (
          <div className="mt-6 space-y-6">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                {suggestion.type === 'text' && (
                  <>
                    <h4 className="text-sm font-medium text-gray-900 capitalize mb-2">
                      {suggestion.field.replace('_', ' ')}
                    </h4>
                    <div className="bg-white rounded p-2 border border-gray-200 mb-2 text-sm text-gray-800 whitespace-pre-line">
                      {suggestion.suggestion.content}
                    </div>
                    <p className="text-xs text-gray-600 italic">{suggestion.suggestion.rationale}</p>
                  </>
                )}
                
                {suggestion.type === 'relationship' && (
                  <>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Parent Feature</h4>
                    <div className="bg-white rounded p-2 border border-gray-200 mb-2">
                      <p className="text-sm font-medium text-gray-900">{suggestion.parentFeature.name}</p>
                      <p className="text-xs text-gray-500">ID: {suggestion.parentFeature.id}</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{suggestion.explanation}</p>
                  </>
                )}
                
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => applySuggestion(suggestion)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Apply this suggestion
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
