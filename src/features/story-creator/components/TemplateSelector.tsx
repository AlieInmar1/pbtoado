import React from 'react';
import { StoryTemplate } from '../../../types/story-creator';

interface TemplateSelectorProps {
  templates: StoryTemplate[];
  isLoading: boolean;
  onSelect: (template: StoryTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  isLoading,
  onSelect
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
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
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No templates available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please create a template first or contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
          onClick={() => onSelect(template)}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {template.type}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">{template.description}</p>
          <div className="text-xs text-gray-500">
            <div className="mb-1">
              <span className="font-medium">Required fields:</span>{' '}
              {template.required_fields.join(', ')}
            </div>
            <div>
              <span className="font-medium">Default content:</span>{' '}
              {Object.keys(template.default_content).length} fields pre-filled
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TemplateSelector;
