/**
 * Relationship Insights Panel
 * 
 * This component displays contextual information and relationship insights
 * for stories, including patterns, parent/sibling context, and suggestions.
 */

import React, { useEffect, useState } from 'react';
import { useRelationships } from '../hooks/useRelationships';
import { ContextParams, DetectedPattern, Relationship } from '../types';

interface RelationshipInsightsPanelProps {
  storyId?: string;
  storyContent: {
    title?: string;
    description?: string;
    acceptance_criteria?: string[];
  };
  parentId?: string;
  componentId?: string;
  hierarchyLevel?: 'epic' | 'feature' | 'story' | 'task';
  workspaceId: string;
  onSuggestionApply?: (fieldName: string, value: any) => void;
}

const RelationshipInsightsPanel: React.FC<RelationshipInsightsPanelProps> = ({
  storyId,
  storyContent,
  parentId,
  componentId,
  hierarchyLevel = 'story',
  workspaceId,
  onSuggestionApply
}) => {
  const {
    relationships,
    isLoadingRelationships,
    detectedPatterns,
    isDetectingPatterns,
    contextIntelligence,
    isLoadingContext,
    contextError,
    findPatterns,
    getContext,
    autoDiscover
  } = useRelationships();

  // Track if content has changed since last pattern detection
  const [contentHash, setContentHash] = useState<string>('');
  const [hasNewContent, setHasNewContent] = useState<boolean>(false);

  // Generate a simple hash of the content for change detection
  const generateContentHash = () => {
    const content = `${storyContent.title || ''}|${storyContent.description || ''}|${storyContent.acceptance_criteria?.join('|') || ''}`;
    return content;
  };

  // Check if content has changed
  useEffect(() => {
    const newHash = generateContentHash();
    if (newHash !== contentHash) {
      setHasNewContent(true);
      setContentHash(newHash);
    }
  }, [storyContent, contentHash]);

  // Load context on mount or when dependencies change
  useEffect(() => {
    if (workspaceId) {
      loadContextData();
    }
  }, [workspaceId, parentId, componentId, storyId]);

  // Function to load all context data
  const loadContextData = async () => {
    const params: ContextParams = {
      entityId: storyId,
      entityType: 'story',
      parentId,
      componentId,
      hierarchyLevel,
      workspace_id: workspaceId,
      includePatterns: true,
      includeRelated: true
    };

    await getContext(params);

    // If we have a storyId, also fetch relationships and discover new ones
    if (storyId) {
      if (relationships.length === 0) {
        // Auto-discover relationships if we don't have any yet
        autoDiscover(storyId, workspaceId);
      }
    }

    // Detect patterns in the content
    if (storyContent.title || storyContent.description) {
      await detectContentPatterns();
      setHasNewContent(false);
    }
  };

  // Detect patterns in the current content
  const detectContentPatterns = async () => {
    const fullContent = [
      storyContent.title || '',
      storyContent.description || '',
      ...(storyContent.acceptance_criteria || [])
    ].join('\n\n');

    if (fullContent.trim()) {
      await findPatterns(fullContent, workspaceId);
    }
  };

  // Helper to format relationship type for display
  const formatRelationshipType = (type: string): string => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Story Insights</h3>
        <p className="text-sm text-gray-500">
          Contextual information and suggestions based on patterns and relationships
        </p>
      </div>

      {/* Pattern Detection Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-md font-medium text-gray-800">Detected Patterns</h4>
          {hasNewContent && (
            <button
              onClick={detectContentPatterns}
              disabled={isDetectingPatterns}
              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              {isDetectingPatterns ? 'Analyzing...' : 'Refresh Patterns'}
            </button>
          )}
        </div>

        {isDetectingPatterns ? (
          <div className="flex items-center justify-center py-4">
            <svg
              className="animate-spin h-5 w-5 text-blue-500 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm text-gray-600">Analyzing content...</span>
          </div>
        ) : detectedPatterns.length > 0 ? (
          <div className="space-y-3">
            {detectedPatterns.map((pattern, index) => (
              <PatternCard
                key={`${pattern.patternName}-${index}`}
                pattern={pattern}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-2">
            No patterns detected in the current content. Add more content or try a different format.
          </p>
        )}
      </div>

      {/* Context Intelligence Section */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-md font-medium text-gray-800 mb-2">Contextual Information</h4>

        {isLoadingContext ? (
          <div className="flex items-center justify-center py-4">
            <svg
              className="animate-spin h-5 w-5 text-blue-500 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm text-gray-600">Loading context...</span>
          </div>
        ) : contextError ? (
          <p className="text-sm text-red-500 py-2">
            Error loading context information. Please try again.
          </p>
        ) : contextIntelligence ? (
          <div className="space-y-3">
            {/* Parent Context */}
            {contextIntelligence.parentContext && (
              <div className="p-3 bg-blue-50 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <h5 className="text-sm font-medium text-blue-800">Parent: {contextIntelligence.parentContext.title}</h5>
                    {contextIntelligence.parentContext.description && (
                      <p className="mt-1 text-xs text-blue-600 line-clamp-2">
                        {contextIntelligence.parentContext.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Component Context */}
            {contextIntelligence.componentContext && (
              <div className="p-3 bg-purple-50 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <h5 className="text-sm font-medium text-purple-800">Component: {contextIntelligence.componentContext.name}</h5>
                    <p className="mt-1 text-xs text-purple-600">
                      Stories: {contextIntelligence.componentContext.statistics?.storyCount || 0} | 
                      Avg. Complexity: {contextIntelligence.componentContext.statistics?.averageComplexity?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sibling Context */}
            {contextIntelligence.siblingContext && contextIntelligence.siblingContext.length > 0 && (
              <div className="p-3 bg-green-50 rounded-md">
                <h5 className="text-sm font-medium text-green-800 mb-1">Related Stories</h5>
                <ul className="space-y-1">
                  {contextIntelligence.siblingContext.slice(0, 3).map(sibling => (
                    <li key={sibling.id} className="text-xs text-green-600 flex items-start">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 mr-1.5 flex-shrink-0"></span>
                      <span className="line-clamp-1">{sibling.title}</span>
                    </li>
                  ))}
                  {contextIntelligence.siblingContext.length > 3 && (
                    <li className="text-xs text-green-700">
                      +{contextIntelligence.siblingContext.length - 3} more related stories
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Show message if no context */}
            {!contextIntelligence.parentContext && 
             !contextIntelligence.componentContext &&
             (!contextIntelligence.siblingContext || contextIntelligence.siblingContext.length === 0) && (
              <p className="text-sm text-gray-500 py-2">
                No contextual information available. Try selecting a parent or component.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-2">
            No contextual information available yet.
          </p>
        )}
      </div>

      {/* Relationships Section */}
      <div className="p-4">
        <h4 className="text-md font-medium text-gray-800 mb-2">Relationships</h4>

        {isLoadingRelationships ? (
          <div className="flex items-center justify-center py-4">
            <svg
              className="animate-spin h-5 w-5 text-blue-500 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm text-gray-600">Loading relationships...</span>
          </div>
        ) : relationships.length > 0 ? (
          <div className="space-y-2">
            {relationships.map(relationship => (
              <div 
                key={relationship.id}
                className="p-2 bg-gray-50 rounded-md border border-gray-100 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">
                    {formatRelationshipType(relationship.relationshipType)}
                  </span>
                  <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">
                    {Math.round(relationship.strength * 100)}%
                  </span>
                </div>
                <div className="mt-1 text-gray-600">
                  {relationship.sourceType === 'story' ? 'Story' : relationship.sourceType} → {relationship.targetType === 'story' ? 'Story' : relationship.targetType}
                </div>
              </div>
            ))}
          </div>
        ) : storyId ? (
          <div className="text-center py-3">
            <p className="text-sm text-gray-500 mb-2">No relationships found for this story.</p>
            <button
              onClick={() => autoDiscover(storyId, workspaceId)}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Discover Relationships
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-2">
            Relationships will be available after saving the story.
          </p>
        )}
      </div>
    </div>
  );
};

// Pattern Card subcomponent
interface PatternCardProps {
  pattern: DetectedPattern;
}

const PatternCard: React.FC<PatternCardProps> = ({ pattern }) => {
  return (
    <div className="p-3 bg-yellow-50 rounded-md">
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
          </svg>
        </div>
        <div className="ml-2 flex-1">
          <div className="flex justify-between">
            <h5 className="text-sm font-medium text-yellow-800">{pattern.patternName}</h5>
            <span className="bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full text-xs">
              {Math.round(pattern.confidence * 100)}%
            </span>
          </div>
          {pattern.matches.length > 0 && (
            <p className="mt-1 text-xs text-yellow-700 italic line-clamp-1">
              "{pattern.matches[0]}"
            </p>
          )}
          {pattern.suggestedCompletion && (
            <p className="mt-1 text-xs text-yellow-600 line-clamp-2">
              {pattern.suggestedCompletion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelationshipInsightsPanel;
