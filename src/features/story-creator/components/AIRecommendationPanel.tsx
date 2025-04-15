import React from 'react';
import { AIAnalysisResult } from '../../../types/story-creator';

interface AIRecommendationPanelProps {
  analysisResult: AIAnalysisResult | null;
  onApplySuggestion: (field: string, value: any) => void;
  isLoading: boolean;
}

const AIRecommendationPanel: React.FC<AIRecommendationPanelProps> = ({
  analysisResult,
  onApplySuggestion,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="ml-2 text-gray-600">Analyzing story...</span>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No AI suggestions yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Click "Get AI Suggestions" to analyze your story and get recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto max-h-[600px]">
      <h3 className="text-lg font-medium text-gray-900 mb-4">AI Recommendations</h3>

      {/* Title suggestions */}
      {analysisResult.title_suggestions && analysisResult.title_suggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Title Suggestions</h4>
          <ul className="space-y-2">
            {analysisResult.title_suggestions.map((title, index) => (
              <li key={index} className="border border-gray-200 rounded-md p-2">
                <p className="text-sm text-gray-800">{title}</p>
                <button
                  type="button"
                  onClick={() => onApplySuggestion('title', title)}
                  className="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Apply this suggestion
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Description suggestions */}
      {analysisResult.description_suggestions && analysisResult.description_suggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Description Suggestions</h4>
          <ul className="space-y-2">
            {analysisResult.description_suggestions.map((description, index) => (
              <li key={index} className="border border-gray-200 rounded-md p-2">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{description}</p>
                <button
                  type="button"
                  onClick={() => onApplySuggestion('description', description)}
                  className="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Apply this suggestion
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Acceptance criteria */}
      {analysisResult.acceptance_criteria && analysisResult.acceptance_criteria.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Acceptance Criteria Suggestions</h4>
          <div className="border border-gray-200 rounded-md p-2">
            <ul className="space-y-2">
              {analysisResult.acceptance_criteria.map((criterion, index) => (
                <li key={index} className="text-sm text-gray-800">
                  {criterion}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => onApplySuggestion('acceptance_criteria', analysisResult.acceptance_criteria)}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-800"
            >
              Apply all criteria
            </button>
          </div>
        </div>
      )}

      {/* Complexity and effort estimates */}
      {(analysisResult.complexity_estimate || analysisResult.effort_estimate) && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Effort Estimation</h4>
          <div className="grid grid-cols-2 gap-4">
            {analysisResult.complexity_estimate && (
              <div className="border border-gray-200 rounded-md p-2">
                <p className="text-xs text-gray-500">Complexity</p>
                <p className="text-lg font-medium text-gray-900">{analysisResult.complexity_estimate}/5</p>
                <button
                  type="button"
                  onClick={() => onApplySuggestion('complexity', analysisResult.complexity_estimate)}
                  className="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Apply
                </button>
              </div>
            )}
            {analysisResult.effort_estimate && (
              <div className="border border-gray-200 rounded-md p-2">
                <p className="text-xs text-gray-500">Story Points</p>
                <p className="text-lg font-medium text-gray-900">{analysisResult.effort_estimate}</p>
                <button
                  type="button"
                  onClick={() => onApplySuggestion('story_points', analysisResult.effort_estimate)}
                  className="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team suggestions */}
      {analysisResult.team_suggestions && analysisResult.team_suggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Teams</h4>
          <div className="flex flex-wrap gap-2">
            {analysisResult.team_suggestions.map((team, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {team}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Component suggestions */}
      {analysisResult.component_suggestions && analysisResult.component_suggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Components</h4>
          <div className="flex flex-wrap gap-2">
            {analysisResult.component_suggestions.map((component, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {component}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Risk assessment */}
      {analysisResult.risk_assessment && analysisResult.risk_assessment.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Assessment</h4>
          <ul className="space-y-2">
            {analysisResult.risk_assessment.map((risk, index) => (
              <li key={index} className="border border-gray-200 rounded-md p-2">
                <div className="flex items-start">
                  <div
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                      risk.severity === 'high'
                        ? 'bg-red-100 text-red-800'
                        : risk.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {risk.severity}
                  </div>
                  <p className="text-sm text-gray-800 flex-1">{risk.description}</p>
                </div>
                {risk.mitigation_suggestion && (
                  <p className="mt-1 text-xs text-gray-600">
                    <span className="font-medium">Mitigation:</span> {risk.mitigation_suggestion}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Duplicate check */}
      {analysisResult.duplicate_check && analysisResult.duplicate_check.has_duplicates && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Potential Duplicates</h4>
          <div className="border border-yellow-200 bg-yellow-50 rounded-md p-2">
            <p className="text-sm text-yellow-800 mb-2">
              This story may be similar to existing stories:
            </p>
            <ul className="space-y-2">
              {analysisResult.duplicate_check.potential_duplicates?.map((duplicate) => (
                <li key={duplicate.story_id} className="text-sm">
                  <span className="font-medium">{duplicate.title}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    (Similarity: {Math.round(duplicate.similarity_score * 100)}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommendationPanel;
