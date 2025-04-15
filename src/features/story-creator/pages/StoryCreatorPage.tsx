import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StoryCreatorWizard from '../components/StoryCreatorWizard';
import { useWorkspace } from '../../../contexts/WorkspaceContext';

const StoryCreatorPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [showWizard, setShowWizard] = useState(false);
  const [parentId, setParentId] = useState<string | undefined>(undefined);

  const handleComplete = (storyId: string) => {
    // Optionally navigate to the created story or reset the wizard
    console.log(`Story created with ID: ${storyId}`);
    // Reset after a delay to show the success message
    setTimeout(() => {
      setShowWizard(false);
      setParentId(undefined);
    }, 3000);
  };

  const handleCancel = () => {
    setShowWizard(false);
    setParentId(undefined);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Story Creator</h1>
          <p className="text-gray-600">
            Create stories with AI assistance for better quality and consistency
          </p>
        </div>
        <div className="flex space-x-4">
          <Link
            to="/story-creator/templates"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Manage Templates
          </Link>
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create New Story
          </button>
        </div>
      </div>

      {showWizard ? (
        <StoryCreatorWizard
          parentId={parentId}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <h2 className="mt-2 text-lg font-medium text-gray-900">Create a new story</h2>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new story with AI assistance
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowWizard(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Story
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium text-gray-900">AI-Powered Story Creation</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600 mb-4">
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
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
                </div>
                <h4 className="text-base font-medium text-gray-900">Intelligent Suggestions</h4>
                <p className="mt-2 text-sm text-gray-500">
                  Get AI-powered suggestions for titles, descriptions, and acceptance criteria based on
                  your input.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600 mb-4">
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h4 className="text-base font-medium text-gray-900">Templates</h4>
                <p className="mt-2 text-sm text-gray-500">
                  Use predefined templates for different types of stories to ensure consistency and
                  completeness.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600 mb-4">
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="text-base font-medium text-gray-900">Risk Assessment</h4>
                <p className="mt-2 text-sm text-gray-500">
                  Automatically identify potential risks and get suggestions for mitigation strategies.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryCreatorPage;
