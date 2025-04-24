import React from 'react';
import { Story } from '../../../../types/story-creator';

interface DetailedContentSectionProps {
  story: Partial<Story>;
  onChange: (field: keyof Story, value: any) => void;
}

/**
 * DetailedContentSection allows users to input detailed textual content
 * for the story, including acceptance criteria and customer needs.
 */
export const DetailedContentSection: React.FC<DetailedContentSectionProps> = ({
  story,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Detailed Content</h2>
        <p className="text-gray-500 text-sm">
          Add detailed information that will help with implementing and testing the story.
        </p>
      </div>
      
      {/* Acceptance Criteria */}
      <div>
        <label htmlFor="acceptance_criteria" className="block text-sm font-medium text-gray-700">
          Acceptance Criteria
        </label>
        <div className="mt-1">
          <textarea
            id="acceptance_criteria"
            rows={5}
            value={story.acceptance_criteria || ''}
            onChange={(e) => onChange('acceptance_criteria', e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Enter specific criteria that must be met for this story to be considered complete..."
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          List the specific requirements that must be met for this story to be considered complete. Use clear, testable statements.
        </p>
        <div className="mt-2 bg-gray-50 p-3 rounded-md border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700">Suggestion</h4>
          <p className="text-xs text-gray-600">
            Consider using a format like:
            <br />
            • Given [context], when [action], then [result]
            <br />
            • The user should be able to [action]
            <br />
            • The system should [behavior] when [condition]
          </p>
        </div>
      </div>
      
      {/* Customer Need Description */}
      <div>
        <label htmlFor="customer_need_description" className="block text-sm font-medium text-gray-700">
          Customer Need Description
        </label>
        <div className="mt-1">
          <textarea
            id="customer_need_description"
            rows={4}
            value={story.customer_need_description || ''}
            onChange={(e) => onChange('customer_need_description', e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Describe the customer problem or need this story addresses..."
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Explain the specific customer problem or need that this story addresses. Include relevant user research or feedback.
        </p>
      </div>
      
      {/* Release Notes */}
      <div>
        <label htmlFor="release_notes" className="block text-sm font-medium text-gray-700">
          Release Notes
        </label>
        <div className="mt-1">
          <textarea
            id="release_notes"
            rows={3}
            value={story.release_notes || ''}
            onChange={(e) => onChange('release_notes', e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Draft release notes for this feature..."
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Draft text that could be used in release notes to announce this feature. Focus on benefits rather than implementation details.
        </p>
      </div>
      
      {/* AI-Assisted Content Generation */}
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
        <h3 className="text-sm font-medium text-indigo-800">AI Assistance Available</h3>
        <p className="mt-1 text-xs text-indigo-600">
          Need help crafting compelling descriptions? Our AI can help generate or improve content for any of these fields.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              // This would connect to an AI suggestion system
              alert('AI assistance for acceptance criteria would be triggered here');
            }}
            className="inline-flex items-center px-2.5 py-1.5 border border-indigo-300 text-xs font-medium rounded shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Generate Acceptance Criteria
          </button>
          
          <button
            type="button"
            onClick={() => {
              // This would connect to an AI suggestion system
              alert('AI assistance for customer needs would be triggered here');
            }}
            className="inline-flex items-center px-2.5 py-1.5 border border-indigo-300 text-xs font-medium rounded shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Enhance Customer Need
          </button>
          
          <button
            type="button"
            onClick={() => {
              // This would connect to an AI suggestion system
              alert('AI assistance for release notes would be triggered here');
            }}
            className="inline-flex items-center px-2.5 py-1.5 border border-indigo-300 text-xs font-medium rounded shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Draft Release Notes
          </button>
        </div>
      </div>
    </div>
  );
};
