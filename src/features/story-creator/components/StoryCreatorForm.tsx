import React, { useState } from 'react';
import { StoryTemplate, StoryContent } from '../../../types/story-creator';
import { useFeatures } from '../../../hooks/useFeatures';
import { useComponents } from '../../../hooks/useComponents';

interface StoryCreatorFormProps {
  template: StoryTemplate | null;
  content: StoryContent | null;
  onChange: (field: string, value: any) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const StoryCreatorForm: React.FC<StoryCreatorFormProps> = ({
  template,
  content,
  onChange,
  onAnalyze,
  isAnalyzing
}) => {
  if (!template || !content) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">No template selected</p>
      </div>
    );
  }

  const handleInputChange = (field: string, value: any) => {
    onChange(field, value);
  };

  // Get features and components
  const { features, isLoading: featuresLoading } = useFeatures();
  const { components, isLoading: componentsLoading } = useComponents();
  
  // State for ideas/problems input
  const [ideaInput, setIdeaInput] = useState<string>('');
  
  // Function to generate title and description from ideas/problems
  const generateFromIdea = () => {
    if (!ideaInput.trim()) return;
    
    // Simple transformation for now - in a real implementation, this would use AI
    const lines = ideaInput.split('\n').filter(line => line.trim());
    
    if (lines.length > 0) {
      // Use first line as title
      handleInputChange('title', lines[0]);
      
      // Use remaining lines as description
      if (lines.length > 1) {
        const description = lines.slice(1).join('\n\n');
        handleInputChange('description', description);
      }
    }
    
    // Clear the idea input
    setIdeaInput('');
  };

  const renderField = (field: string) => {
    const value = content[field];
    const isRequired = template.required_fields.includes(field);

    switch (field) {
      case 'parent_feature_id':
        // Only show for stories (not features)
        if (template.type !== 'feature') {
          return (
            <div key={field} className="mb-4">
              <label htmlFor={field} className="block text-sm font-medium text-gray-700">
                Parent Feature {isRequired && <span className="text-red-500">*</span>}
              </label>
              <select
                id={field}
                value={value || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required={isRequired}
              >
                <option value="">Select a parent feature</option>
                {features
                  .filter(feature => feature.type === 'feature')
                  .map(feature => (
                    <option key={feature.id} value={feature.id}>
                      {feature.name}
                    </option>
                  ))}
              </select>
            </div>
          );
        }
        return null;
        
      case 'component_id':
        // Only show for features
        if (template.type === 'feature') {
          return (
            <div key={field} className="mb-4">
              <label htmlFor={field} className="block text-sm font-medium text-gray-700">
                Component {isRequired && <span className="text-red-500">*</span>}
              </label>
              <select
                id={field}
                value={value || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required={isRequired}
              >
                <option value="">Select a component</option>
                {components.map(component => (
                  <option key={component.id} value={component.productboard_id}>
                    {component.name}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        return null;
      case 'title':
        return (
          <div key={field} className="mb-4">
            <label htmlFor={field} className="block text-sm font-medium text-gray-700">
              Title {isRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              id={field}
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required={isRequired}
            />
          </div>
        );

      case 'description':
        return (
          <div key={field} className="mb-4">
            <label htmlFor={field} className="block text-sm font-medium text-gray-700">
              Description {isRequired && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id={field}
              value={value || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              rows={5}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required={isRequired}
            />
            <p className="mt-1 text-xs text-gray-500">
              Use the format: "As a [user type], I want to [action] so that [benefit]"
            </p>
          </div>
        );

      case 'acceptance_criteria':
        return (
          <div key={field} className="mb-4">
            <label htmlFor={field} className="block text-sm font-medium text-gray-700">
              Acceptance Criteria {isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="mt-1 border border-gray-300 rounded-md p-2">
              {Array.isArray(value) && value.length > 0 ? (
                <ul className="space-y-2">
                  {value.map((criterion, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-1">
                        <textarea
                          value={criterion}
                          onChange={(e) => {
                            const newCriteria = [...value];
                            newCriteria[index] = e.target.value;
                            handleInputChange(field, newCriteria);
                          }}
                          rows={2}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newCriteria = [...value];
                          newCriteria.splice(index, 1);
                          handleInputChange(field, newCriteria);
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No acceptance criteria added yet</p>
              )}
              <button
                type="button"
                onClick={() => {
                  const newCriteria = Array.isArray(value) ? [...value] : [];
                  newCriteria.push('Given [context], when [action], then [result]');
                  handleInputChange(field, newCriteria);
                }}
                className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Criterion
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Use the format: "Given [context], when [action], then [result]"
            </p>
          </div>
        );

      case 'complexity':
        return (
          <div key={field} className="mb-4">
            <label htmlFor={field} className="block text-sm font-medium text-gray-700">
              Complexity {isRequired && <span className="text-red-500">*</span>}
            </label>
            <select
              id={field}
              value={value || ''}
              onChange={(e) => handleInputChange(field, parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required={isRequired}
            >
              <option value="">Select complexity</option>
              <option value="1">1 - Very Simple</option>
              <option value="2">2 - Simple</option>
              <option value="3">3 - Moderate</option>
              <option value="4">4 - Complex</option>
              <option value="5">5 - Very Complex</option>
            </select>
          </div>
        );

      case 'story_points':
        return (
          <div key={field} className="mb-4">
            <label htmlFor={field} className="block text-sm font-medium text-gray-700">
              Story Points {isRequired && <span className="text-red-500">*</span>}
            </label>
            <select
              id={field}
              value={value || ''}
              onChange={(e) => handleInputChange(field, parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required={isRequired}
            >
              <option value="">Select points</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="8">8</option>
              <option value="13">13</option>
            </select>
          </div>
        );

      default:
        // Handle other fields as text inputs
        if (typeof value === 'string') {
          return (
            <div key={field} className="mb-4">
              <label htmlFor={field} className="block text-sm font-medium text-gray-700">
                {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}{' '}
                {isRequired && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                id={field}
                value={value || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required={isRequired}
              />
            </div>
          );
        }
        return null;
    }
  };

  // Get all fields from the template's default content
  const fields = Object.keys(content).filter(
    (field) => field !== 'workspace_id'
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Story Details</h3>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Analyzing...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
              Get AI Suggestions
            </>
          )}
        </button>
      </div>

      {/* Ideas/Problems Input */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-md font-medium text-blue-800 mb-2">Quick Idea Entry</h4>
        <p className="text-sm text-blue-600 mb-3">
          Enter your ideas or problems here, and we'll help format them into a proper story.
        </p>
        <textarea
          value={ideaInput}
          onChange={(e) => setIdeaInput(e.target.value)}
          rows={4}
          placeholder="Type your ideas or problems here... First line will become the title, remaining text will be the description."
          className="w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        />
        <button
          type="button"
          onClick={generateFromIdea}
          className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Generate Story
        </button>
      </div>

      <form className="space-y-4">
        {fields.map((field) => renderField(field))}
      </form>
    </div>
  );
};

export default StoryCreatorForm;
