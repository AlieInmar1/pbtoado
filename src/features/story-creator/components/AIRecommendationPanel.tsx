import React, { useState, useEffect } from 'react';
import { Story } from '../../../types/story-creator';
import { getSuggestionsForStory } from '../../../lib/api/aiStoryGenerator';

interface AIRecommendationPanelProps {
  story: Partial<Story>;
  onSuggestionApply: (field: keyof Story, value: any) => void;
}

/**
 * AIRecommendationPanel provides AI-generated suggestions for story content
 * and allows users to apply those suggestions to their story.
 */
export const AIRecommendationPanel: React.FC<AIRecommendationPanelProps> = ({
  story,
  onSuggestionApply
}) => {
  const [generating, setGenerating] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<keyof Story | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Extract story content for AI context
  const getFieldContentForAI = (field: keyof Story): string => {
    const fieldValue = story[field];
    
    // Use current field value as context, or fall back to a description of what's needed
    if (fieldValue && typeof fieldValue === 'string') {
      return `Current ${field}: ${fieldValue}. Please suggest improvements.`;
    }
    
    // Context to provide when no current value exists
    const contextMap: Record<string, string> = {
      title: `Suggest a clear, concise title for a ${story.type || 'story'} about: ${story.description || 'a new feature'}`,
      description: `Create a detailed description for: ${story.title || 'a new feature'}`,
      acceptance_criteria: `Generate specific, testable acceptance criteria for: ${story.title || 'this feature'}`,
      tags: `Suggest relevant tags for: ${story.title || 'this feature'}`
    };
    
    return contextMap[field as string] || `Suggest content for ${field}`;
  };
  
  // Convert acceptanceCriteria array to string for display
  const formatAcceptanceCriteria = (criteria: string[]): string => {
    return criteria.join('\n');
  };
  
  // Trigger AI recommendation generation
  const generateSuggestions = async (field: keyof Story) => {
    setGenerating(true);
    setActiveField(field);
    setError(null);
    
    try {
      console.log(`Generating AI suggestions for field: ${field}`);
      
      // Get appropriate input based on field
      const input = getFieldContentForAI(field);
      console.log(`AI input context: ${input}`);
      
      // Call the actual AI generation function
      const result = await getSuggestionsForStory({
        idea: input,
        domain: (story.investment_category || 'general').toString(),
        audience: 'users',
        priority: 'medium',
        parentFeature: story.parent_feature_id?.toString() || '',
        component: story.component_name?.toString() || ''
      });
      
      console.log('AI generation result:', result);
      
      // Process AI response based on the field
      let fieldSuggestions: string[] = [];
      
      if (field === 'title') {
        // Use title directly
        fieldSuggestions = result.title ? [result.title] : ["New Feature"];
        // Also add variations if available
        if (result.title) {
          // Create variations by modifying the original title slightly
          const words = result.title.split(' ');
          if (words.length > 3) {
            // Create a shorter version
            fieldSuggestions.push(words.slice(0, 3).join(' '));
          }
          
          // Add a more descriptive version
          fieldSuggestions.push(`${result.title} for ${story.component_name || 'the product'}`);
        }
      } else if (field === 'description') {
        // Use description directly
        fieldSuggestions = result.description ? [result.description] : ["Feature description"];
        // Add a shorter variation if the description is long
        if (result.description && result.description.length > 100) {
          fieldSuggestions.push(result.description.substring(0, 100) + '...');
        }
      } else if (field === 'acceptance_criteria') {
        // Handle acceptance criteria as array or string
        if (result.acceptance_criteria) {
          // Handle as string or convert to array
          const criteriaArray = typeof result.acceptance_criteria === 'string' 
            ? result.acceptance_criteria.split('\n').filter(Boolean)
            : Array.isArray(result.acceptance_criteria) ? result.acceptance_criteria : [];
            
          fieldSuggestions = [formatAcceptanceCriteria(criteriaArray)];
          
          // Also suggest a subset of criteria
          if (criteriaArray.length > 2) {
            const subset = criteriaArray.slice(0, 2);
            fieldSuggestions.push(formatAcceptanceCriteria(subset));
          }
        } else if (result.description) {
          // Fall back to using description to generate acceptance criteria
          fieldSuggestions = [
            `• Verify that the user can ${result.title?.toLowerCase() || 'perform the action'}\n` +
            `• Ensure the system provides appropriate feedback\n` +
            `• Confirm all data is properly saved and validated`
          ];
        }
      } else if (field === 'tags') {
        // Generate tags from the title and description
        const sourceText = `${result.title} ${result.description}`;
        const words = sourceText.toLowerCase().split(/\W+/).filter(word => 
          word.length > 3 && !['this', 'that', 'with', 'from', 'have', 'should'].includes(word)
        );
        
        // Get unique meaningful words
        const uniqueWords = Array.from(new Set(words)).slice(0, 5);
        fieldSuggestions = [uniqueWords.join(', ')];
        
        // Add another variation
        if (uniqueWords.length > 2) {
          fieldSuggestions.push(uniqueWords.slice(0, 3).join(', '));
        }
      }
      
      // Update suggestions state
      setSuggestions(prev => ({
        ...prev,
        [field]: fieldSuggestions.filter(Boolean) // Remove any empty suggestions
      }));
      
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      setError('Failed to generate suggestions. Please try again.');
      
      // Fall back to local generation
      const fallbackSuggestions = getLocalFallbackSuggestions(field as string);
      setSuggestions(prev => ({
        ...prev,
        [field]: fallbackSuggestions
      }));
    } finally {
      setGenerating(false);
    }
  };
  
  // Provide fallback suggestions if AI fails
  const getLocalFallbackSuggestions = (field: string): string[] => {
    const fallbacks: Record<string, string[]> = {
      title: [
        "Enhance User Story Creation",
        "Implement Feature Builder",
        "Develop Intelligent Recommendation System"
      ],
      description: [
        "Create a user-friendly tool that helps product managers build comprehensive user stories with automated suggestions and formatting assistance.",
        "Implement a feature that analyzes input and provides smart recommendations based on system context and best practices."
      ],
      acceptance_criteria: [
        "• Users can generate suggestions for any field\n• Suggestions are contextually relevant\n• Users can apply suggestions with one click\n• The system provides immediate feedback on suggestion application",
        "• The feature correctly analyzes user input\n• The interface is intuitive and accessible\n• Performance meets or exceeds benchmarks"
      ],
      tags: [
        "user-experience, automation, productivity",
        "ai-assisted, content-generation, product-management"
      ]
    };
    
    return fallbacks[field] || ["No suggestions available"];
  };
  
  // Render suggestion list for the current active field
  const renderSuggestions = () => {
    if (!activeField) {
      return (
        <div className="text-center p-4 text-gray-500">
          Select a field to generate suggestions.
        </div>
      );
    }
    
    const activeSuggestions = suggestions[activeField as string] || [];
    
    if (activeSuggestions.length === 0 && !generating && !error) {
      return (
        <div className="text-center p-4 text-gray-500">
          No suggestions available. Generate suggestions first.
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => generateSuggestions(activeField)}
            className="mt-2 text-xs text-red-700 hover:text-red-900 font-medium"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {activeSuggestions.map((suggestion, index) => (
          <div 
            key={index}
            className="p-3 bg-white border border-gray-200 rounded-md hover:bg-blue-50 cursor-pointer transition-colors"
            onClick={() => onSuggestionApply(activeField, suggestion)}
          >
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{suggestion}</p>
            <div className="mt-2 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('[AI Panel] Apply button clicked for field:', activeField);
                  console.log('[AI Panel] Applying suggestion:', suggestion);
                  // Add an immediate visual feedback
                  e.currentTarget.innerHTML = 'Applied ✓';
                  e.currentTarget.className = 'text-xs text-green-600 font-medium';
                  // Call the callback from parent component
                  if (typeof onSuggestionApply === 'function') {
                    onSuggestionApply(activeField, suggestion);
                    console.log('[AI Panel] onSuggestionApply called');
                  } else {
                    console.error('[AI Panel] onSuggestionApply is not a function:', onSuggestionApply);
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1 rounded"
              >
                Apply
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // When story changes, reset suggestions to avoid showing outdated content
  useEffect(() => {
    setSuggestions({});
    setActiveField(null);
  }, [story.id]);
  
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden h-full">
      <div className="bg-indigo-600 text-white px-4 py-3">
        <h3 className="text-lg font-medium">AI Recommendations</h3>
        <p className="text-xs text-indigo-200">
          Get intelligent suggestions to enhance your story
        </p>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Generate suggestions for:</p>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => generateSuggestions('title')}
              className={`px-3 py-2 text-sm font-medium rounded-md border 
                ${activeField === 'title' 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              Title
            </button>
            
            <button
              onClick={() => generateSuggestions('description')}
              className={`px-3 py-2 text-sm font-medium rounded-md border 
                ${activeField === 'description' 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              Description
            </button>
            
            <button
              onClick={() => generateSuggestions('acceptance_criteria')}
              className={`px-3 py-2 text-sm font-medium rounded-md border 
                ${activeField === 'acceptance_criteria' 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              Acceptance Criteria
            </button>
            
            <button
              onClick={() => generateSuggestions('tags')}
              className={`px-3 py-2 text-sm font-medium rounded-md border 
                ${activeField === 'tags' 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              Tags
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h4>
          
          {generating ? (
            <div className="flex justify-center items-center h-40">
              <div className="text-center">
                <div className="spinner h-8 w-8 border-3 border-indigo-500 border-r-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">Generating AI recommendations...</p>
              </div>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {renderSuggestions()}
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 italic border-t border-gray-200 pt-3 mt-3">
          All suggestions are AI-generated. Review and edit before applying.
        </div>
      </div>
    </div>
  );
};
