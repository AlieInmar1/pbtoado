import React from 'react';
import { StoryTemplate, StoryContent, AIAnalysisResult } from '../../../types/story-creator';

interface StoryPreviewProps {
  template: StoryTemplate | null;
  content: StoryContent | null;
  analysisResult: AIAnalysisResult | null;
}

const StoryPreview: React.FC<StoryPreviewProps> = ({
  template,
  content,
  analysisResult
}) => {
  if (!template || !content) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">No content to preview</p>
      </div>
    );
  }

  // Check for potential issues
  const missingRequiredFields = template.required_fields.filter(
    field => !content[field] || (Array.isArray(content[field]) && content[field].length === 0)
  );

  const hasDuplicates = analysisResult?.duplicate_check?.has_duplicates || false;
  const hasHighRisks = analysisResult?.risk_assessment?.some(risk => risk.severity === 'high') || false;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{content.title || 'Untitled Story'}</h3>
        <div className="flex items-center space-x-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {template.type}
          </span>
          {content.complexity && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Complexity: {content.complexity}/5
            </span>
          )}
          {content.story_points && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {content.story_points} Points
            </span>
          )}
        </div>

        {/* Warnings */}
        {(missingRequiredFields.length > 0 || hasDuplicates || hasHighRisks) && (
          <div className="mb-6 border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Attention needed</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {missingRequiredFields.length > 0 && (
                      <li>
                        Missing required fields:{' '}
                        {missingRequiredFields
                          .map(field => field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '))
                          .join(', ')}
                      </li>
                    )}
                    {hasDuplicates && (
                      <li>
                        Potential duplicate stories detected. Consider reviewing similar stories before
                        submitting.
                      </li>
                    )}
                    {hasHighRisks && (
                      <li>High-risk items identified. Consider addressing these risks before proceeding.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{content.description || 'No description provided'}</p>
          </div>
        </div>

        {/* Acceptance Criteria */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Acceptance Criteria</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            {Array.isArray(content.acceptance_criteria) && content.acceptance_criteria.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {content.acceptance_criteria.map((criterion, index) => (
                  <li key={index} className="text-sm text-gray-800">
                    {criterion}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No acceptance criteria provided</p>
            )}
          </div>
        </div>

        {/* Additional Fields */}
        {Object.keys(content)
          .filter(
            key =>
              key !== 'title' &&
              key !== 'description' &&
              key !== 'acceptance_criteria' &&
              key !== 'complexity' &&
              key !== 'story_points' &&
              key !== 'parent_id' &&
              key !== 'workspace_id'
          )
          .map(key => {
            const value = content[key];
            if (value === null || value === undefined || value === '') return null;

            return (
              <div key={key} className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                </h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  {typeof value === 'object' ? (
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-800">{value.toString()}</p>
                  )}
                </div>
              </div>
            );
          })}

        {/* AI Analysis Summary */}
        {analysisResult && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">AI Analysis Summary</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Complexity and Effort */}
              {(analysisResult.complexity_estimate || analysisResult.effort_estimate) && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Estimated Effort</h5>
                  <div className="flex space-x-4">
                    {analysisResult.complexity_estimate && (
                      <div>
                        <span className="text-xs text-gray-500">Complexity:</span>{' '}
                        <span className="font-medium">{analysisResult.complexity_estimate}/5</span>
                      </div>
                    )}
                    {analysisResult.effort_estimate && (
                      <div>
                        <span className="text-xs text-gray-500">Story Points:</span>{' '}
                        <span className="font-medium">{analysisResult.effort_estimate}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Team and Component Suggestions */}
              {((analysisResult.team_suggestions && analysisResult.team_suggestions.length > 0) || 
                (analysisResult.component_suggestions && analysisResult.component_suggestions.length > 0)) && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Suggested Assignments</h5>
                  {analysisResult.team_suggestions && analysisResult.team_suggestions.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-500">Teams:</span>{' '}
                      <span className="font-medium">{analysisResult.team_suggestions.join(', ')}</span>
                    </div>
                  )}
                  {analysisResult.component_suggestions && analysisResult.component_suggestions.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500">Components:</span>{' '}
                      <span className="font-medium">
                        {analysisResult.component_suggestions.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Risk Assessment Summary */}
              {analysisResult.risk_assessment && analysisResult.risk_assessment.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-md md:col-span-2">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Risk Assessment</h5>
                  <div className="flex space-x-2">
                    {['high', 'medium', 'low'].map(severity => {
                      const count = analysisResult.risk_assessment?.filter(
                        risk => risk.severity === severity
                      ).length;
                      if (!count) return null;
                      return (
                        <div
                          key={severity}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            severity === 'high'
                              ? 'bg-red-100 text-red-800'
                              : severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {count} {severity} risk{count !== 1 ? 's' : ''}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryPreview;
