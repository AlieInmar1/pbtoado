import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoryCreator } from '../../../hooks/useStoryCreator';
import { StoryTemplate, CreateStoryTemplateRequest, UpdateStoryTemplateRequest, StoryContent } from '../../../types/story-creator';
import { useWorkspace } from '../../../contexts/WorkspaceContext';

const TemplateManagementPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const {
    templates,
    templatesLoading,
    templatesError,
    createTemplate,
    isCreatingTemplate,
    updateTemplate,
    isUpdatingTemplate,
    deleteTemplate,
    isDeletingTemplate
  } = useStoryCreator();

  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<StoryTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<CreateStoryTemplateRequest> | UpdateStoryTemplateRequest>({
    name: '',
    type: 'feature',
    description: '',
    default_content: {
      title: '',
      description: '',
      acceptance_criteria: []
    } as StoryContent,
    required_fields: ['title', 'description', 'acceptance_criteria'],
    suggested_acceptance_criteria: []
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleContentChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      default_content: {
        ...formData.default_content,
        [field]: value
      } as StoryContent
    });
  };

  const handleRequiredFieldsChange = (field: string, checked: boolean) => {
    const requiredFields = [...(formData.required_fields || [])];
    if (checked && !requiredFields.includes(field)) {
      requiredFields.push(field);
    } else if (!checked && requiredFields.includes(field)) {
      const index = requiredFields.indexOf(field);
      requiredFields.splice(index, 1);
    }
    setFormData({
      ...formData,
      required_fields: requiredFields
    });
  };

  const handleAddAcceptanceCriterion = () => {
    const criteria = Array.isArray(formData.suggested_acceptance_criteria)
      ? [...formData.suggested_acceptance_criteria]
      : [];
    criteria.push('Given [context], when [action], then [result].');
    setFormData({
      ...formData,
      suggested_acceptance_criteria: criteria
    });
  };

  const handleRemoveAcceptanceCriterion = (index: number) => {
    const criteria = Array.isArray(formData.suggested_acceptance_criteria)
      ? [...formData.suggested_acceptance_criteria]
      : [];
    criteria.splice(index, 1);
    setFormData({
      ...formData,
      suggested_acceptance_criteria: criteria
    });
  };

  const handleEditAcceptanceCriterion = (index: number, value: string) => {
    const criteria = Array.isArray(formData.suggested_acceptance_criteria)
      ? [...formData.suggested_acceptance_criteria]
      : [];
    criteria[index] = value;
    setFormData({
      ...formData,
      suggested_acceptance_criteria: criteria
    });
  };

  const handleEditTemplate = (template: StoryTemplate) => {
    setCurrentTemplate(template);
    setFormData({
      id: template.id,
      name: template.name,
      type: template.type,
      description: template.description || '',
      default_content: { ...template.default_content },
      required_fields: [...template.required_fields],
      suggested_acceptance_criteria: [...template.suggested_acceptance_criteria]
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCreateTemplate = () => {
    setCurrentTemplate(null);
    setFormData({
      name: '',
      type: 'feature',
      description: '',
      default_content: {
        title: '',
        description: '',
        acceptance_criteria: []
      } as StoryContent,
      required_fields: ['title', 'description', 'acceptance_criteria'],
      suggested_acceptance_criteria: []
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setCurrentTemplate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentWorkspace) return;

    try {
      if (isCreating) {
        await createTemplate({
          ...formData as CreateStoryTemplateRequest,
          workspace_id: currentWorkspace.id
        });
        setIsCreating(false);
      } else if (isEditing && currentTemplate) {
        await updateTemplate(formData as UpdateStoryTemplateRequest);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate(templateId);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">No workspace selected</h2>
          <p className="mt-2 text-gray-500">Please select a workspace to continue</p>
        </div>
      </div>
    );
  }

  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    );
  }

  if (templatesError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-700">Error loading templates</h2>
          <p className="mt-2 text-gray-500">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
          <p className="text-gray-600">
            Create and manage templates for story creation
          </p>
        </div>
        <div className="flex space-x-4">
          <Link
            to="/story-creator"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Story Creator
          </Link>
          <button
            type="button"
            onClick={handleCreateTemplate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create New Template
          </button>
        </div>
      </div>

      {(isEditing || isCreating) ? (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {isCreating ? 'Create New Template' : 'Edit Template'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Template Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Template Type
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="feature">Feature</option>
                  <option value="sub-feature">Sub-Feature</option>
                  <option value="bug">Bug</option>
                  <option value="enhancement">Enhancement</option>
                  <option value="task">Task</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Template Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Default Content</h3>
                <div className="border border-gray-200 rounded-md p-4 space-y-4">
                  <div>
                    <label htmlFor="default_title" className="block text-sm font-medium text-gray-700">
                      Default Title
                    </label>
                    <input
                      type="text"
                      id="default_title"
                      value={formData.default_content?.title || ''}
                      onChange={(e) => handleContentChange('title', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="default_description" className="block text-sm font-medium text-gray-700">
                      Default Description
                    </label>
                    <textarea
                      id="default_description"
                      value={formData.default_content?.description || ''}
                      onChange={(e) => handleContentChange('description', e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Required Fields</h3>
                <div className="border border-gray-200 rounded-md p-4">
                  <div className="space-y-2">
                    {['title', 'description', 'acceptance_criteria'].map((field) => (
                      <div key={field} className="flex items-center">
                        <input
                          id={`required_${field}`}
                          type="checkbox"
                          checked={formData.required_fields?.includes(field) || false}
                          onChange={(e) => handleRequiredFieldsChange(field, e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`required_${field}`} className="ml-2 block text-sm text-gray-900">
                          {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Suggested Acceptance Criteria</h3>
                <div className="border border-gray-200 rounded-md p-4">
                  {formData.suggested_acceptance_criteria && formData.suggested_acceptance_criteria.length > 0 ? (
                    <ul className="space-y-2">
                      {formData.suggested_acceptance_criteria.map((criterion, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-1">
                            <textarea
                              value={criterion}
                              onChange={(e) => handleEditAcceptanceCriterion(index, e.target.value)}
                              rows={2}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAcceptanceCriterion(index)}
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
                    <p className="text-gray-500 text-sm">No suggested acceptance criteria added yet</p>
                  )}
                  <button
                    type="button"
                    onClick={handleAddAcceptanceCriterion}
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
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isCreatingTemplate || isUpdatingTemplate}
              >
                {isCreatingTemplate || isUpdatingTemplate ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          {templates.length === 0 ? (
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
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new template.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleCreateTemplate}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Template
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Templates</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-base font-medium text-gray-900">{template.name}</h4>
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
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditTemplate(template)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent rounded text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        disabled={isDeletingTemplate}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TemplateManagementPage;
