import React from 'react';

interface StorySubmissionStatusProps {
  success: boolean;
  storyId: string | null;
  error: string | null;
}

const StorySubmissionStatus: React.FC<StorySubmissionStatusProps> = ({
  success,
  storyId,
  error
}) => {
  if (success && storyId) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mt-3 text-lg font-medium text-gray-900">Story created successfully!</h3>
        <div className="mt-2 text-sm text-gray-500">
          <p>Your story has been created and is ready for review.</p>
        </div>
        <div className="mt-6">
          <div className="bg-gray-50 p-4 rounded-md inline-block">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Story ID:</span> {storyId}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            You can now view this story in the grooming system or add it to a sprint.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h3 className="mt-3 text-lg font-medium text-gray-900">Story creation failed</h3>
        <div className="mt-2 text-sm text-gray-500">
          <p>There was an error creating your story.</p>
        </div>
        <div className="mt-6">
          <div className="bg-red-50 p-4 rounded-md text-left">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            Please try again or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  // Default state (should not happen, but just in case)
  return (
    <div className="text-center py-8">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
        <svg
          className="h-6 w-6 text-gray-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="mt-3 text-lg font-medium text-gray-900">Unknown status</h3>
      <div className="mt-2 text-sm text-gray-500">
        <p>The status of your story creation is unknown.</p>
      </div>
    </div>
  );
};

export default StorySubmissionStatus;
