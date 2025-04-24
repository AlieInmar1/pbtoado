import React, { useState } from 'react';
import { useAIStoryGenerator } from '../../../hooks/useAIStoryGenerator';
import { StoryGenerationInput, StoryGenerationOutput } from '../../../lib/api/aiStoryGenerator';

interface IdeaToStoryGeneratorProps {
  onStoryGenerated?: (story: StoryGenerationOutput) => void;
}

/**
 * A component that allows users to generate stories from simple ideas using AI
 */
export const IdeaToStoryGenerator: React.FC<IdeaToStoryGeneratorProps> = ({ 
  onStoryGenerated
}) => {
  const [idea, setIdea] = useState('');
  const [domain, setDomain] = useState('product');
  const [audience, setAudience] = useState('enterprise');
  const [priority, setPriority] = useState('medium');
  const [parentFeature, setParentFeature] = useState('');
  const [component, setComponent] = useState('');
  
  const { 
    generateStory, 
    loading, 
    error, 
    data: generatedStory,
    reset
  } = useAIStoryGenerator({
    onSuccess: (story) => {
      if (onStoryGenerated) {
        onStoryGenerated(story);
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    const input: StoryGenerationInput = {
      idea,
      domain,
      audience,
      priority,
      ...(parentFeature && { parentFeature }),
      ...(component && { component })
    };

    await generateStory(input);
  };

  const handleReset = () => {
    setIdea('');
    setDomain('product');
    setAudience('enterprise');
    setPriority('medium');
    setParentFeature('');
    setComponent('');
    reset();
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">AI Story Generator</h2>
      <p className="text-gray-600 mb-4">
        Transform a simple idea into a fully structured story with AI assistance.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Idea Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Your Idea
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Describe your idea briefly..."
            rows={3}
            required
          />
        </div>
        
        {/* Domain Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Domain
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="product">Product</option>
            <option value="marketing">Marketing</option>
            <option value="support">Support</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="ux">User Experience</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Audience Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Audience
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all_users">All Users</option>
              <option value="enterprise">Enterprise</option>
              <option value="smb">Small Business</option>
              <option value="developers">Developers</option>
              <option value="designers">Designers</option>
              <option value="product_managers">Product Managers</option>
            </select>
          </div>
          
          {/* Priority Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Parent Feature */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Parent Feature (Optional)
            </label>
            <input
              type="text"
              value={parentFeature}
              onChange={(e) => setParentFeature(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Parent feature name"
            />
          </div>
          
          {/* Component */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Component (Optional)
            </label>
            <input
              type="text"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Component name"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading || !idea.trim()}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading || !idea.trim()
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Generating...' : 'Generate Story'}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          <p className="font-medium">Error generating story:</p>
          <p>{error.message}</p>
        </div>
      )}

      {/* Generated Story Preview */}
      {generatedStory && !loading && !error && (
        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-xl font-bold mb-2">{generatedStory.title}</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="mt-1">{generatedStory.description}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Acceptance Criteria</h4>
              <pre className="mt-1 whitespace-pre-wrap font-sans">{generatedStory.acceptance_criteria}</pre>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Investment Category</h4>
                <p className="mt-1">{generatedStory.investment_category}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Timeframe</h4>
                <p className="mt-1">{generatedStory.timeframe}</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">RICE Scoring</h4>
              <div className="mt-1 grid grid-cols-4 gap-2">
                <div className="p-2 bg-white rounded border border-gray-200">
                  <span className="block text-xs text-gray-500">Reach</span>
                  <span className="font-medium">{generatedStory.reach_score}</span>
                </div>
                <div className="p-2 bg-white rounded border border-gray-200">
                  <span className="block text-xs text-gray-500">Impact</span>
                  <span className="font-medium">{generatedStory.impact_score}</span>
                </div>
                <div className="p-2 bg-white rounded border border-gray-200">
                  <span className="block text-xs text-gray-500">Confidence</span>
                  <span className="font-medium">{generatedStory.confidence_score}</span>
                </div>
                <div className="p-2 bg-white rounded border border-gray-200">
                  <span className="block text-xs text-gray-500">Effort</span>
                  <span className="font-medium">{generatedStory.effort_score}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Tags</h4>
              <div className="mt-1 flex flex-wrap gap-2">
                {generatedStory.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Customer Need</h4>
              <p className="mt-1">{generatedStory.customer_need_description}</p>
            </div>
            
            {generatedStory.warning && (
              <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md">
                <p className="font-medium">Note:</p>
                <p>{generatedStory.warning}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaToStoryGenerator;
