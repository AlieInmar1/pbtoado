import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Landing page for the Story Creator that offers two paths:
 * 1. Create from Scratch - Direct access to the wizard
 * 2. Generate from Idea - AI-assisted story generation from a simple idea
 */
export const StoryCreatorLandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          AI Story Creator
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Create well-structured, comprehensive user stories for your product features
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Option 1: Create from Scratch */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="bg-indigo-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Create from Scratch</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-6">
              Start with a blank slate and build your story step-by-step using our guided wizard.
              Perfect when you have a clear vision of what you want to create.
            </p>
            <ul className="space-y-2 mb-8 text-gray-600">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Complete control over all story details</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Step-by-step guidance through the process</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>AI-powered suggestions for each field</span>
              </li>
            </ul>
            <button
              onClick={() => navigate('/story-creator/new')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create from Scratch
            </button>
          </div>
        </div>
        
        {/* Option 2: Generate from Idea */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="bg-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Generate from Idea</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-6">
              Start with a simple idea, and let our AI transform it into a complete story structure.
              Perfect when you have a rough concept that needs fleshing out.
            </p>
            <ul className="space-y-2 mb-8 text-gray-600">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>AI-powered expansion of simple ideas</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Quick generation of structured content</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Edit and refine AI suggestions</span>
              </li>
            </ul>
            <button
              onClick={() => navigate('/story-creator/from-idea')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Generate from Idea
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-12">
        <h3 className="text-xl font-medium text-gray-900 mb-4">Looking for templates?</h3>
        <button
          onClick={() => navigate('/story-creator/templates')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Browse Templates
        </button>
      </div>
    </div>
  );
};

export default StoryCreatorLandingPage;
