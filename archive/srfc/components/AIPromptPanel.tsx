import React, { useState } from 'react';
import { SparklesIcon, ArrowPathIcon, ArrowRightIcon, DocumentDuplicateIcon, XMarkIcon, PencilSquareIcon, ChevronRightIcon, CursorArrowRaysIcon, LightBulbIcon, BoltIcon } from '@heroicons/react/24/outline';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

type PromptType = 'user_need' | 'feature_idea' | 'pain_point' | 'business_objective';

interface AIResponse {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  riceScore: {
    reach: number;
    impact: number;
    confidence: number;
    effort: number;
  };
  sprintable: boolean;
  completenessScore: number;
}

export function AIPromptPanel() {
  const { currentWorkspace } = useWorkspace();
  const [prompt, setPrompt] = useState('');
  const [promptType, setPromptType] = useState<PromptType>('user_need');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [showBreakdownInput, setShowBreakdownInput] = useState(false);
  const [breakdownTitle, setBreakdownTitle] = useState('');
  const [breakdownDescription, setBreakdownDescription] = useState('');
  const [breakdownLevel, setBreakdownLevel] = useState<'feature' | 'story'>('feature');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);

  const promptTypeConfig = {
    user_need: {
      icon: CursorArrowRaysIcon,
      label: 'User Need',
      description: 'Describe a user problem or need',
      placeholder: 'e.g., Users need a way to quickly filter and sort their data...',
    },
    feature_idea: {
      icon: LightBulbIcon,
      label: 'Feature Idea',
      description: 'Propose a new feature or enhancement',
      placeholder: 'e.g., Add the ability to export data in multiple formats...',
    },
    pain_point: {
      icon: BoltIcon,
      label: 'Pain Point',
      description: 'Describe a current pain point or friction',
      placeholder: 'e.g., Users are frustrated by the complex navigation...',
    },
    business_objective: {
      icon: CursorArrowRaysIcon,
      label: 'Business Objective',
      description: 'Define a business goal or objective',
      placeholder: 'e.g., Increase user engagement by making the onboarding process more intuitive...',
    },
  };

  const generateStory = async () => {
    if (!currentWorkspace || !prompt) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-story`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: promptType,
            prompt,
            workspaceId: currentWorkspace.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate story');
      }
      
      setResponse(data);
      toast.success('Story generated successfully');

      // Create story in Supabase
      const { error: dbError } = await supabase.from('stories').insert({
        workspace_id: currentWorkspace.id,
        pb_id: `PB-DRAFT-${Date.now()}`,
        pb_title: data.title,
        description: data.description,
        status: 'draft',
        story_points: data.riceScore.effort,
        rice_score: data.riceScore,
        sprintable: data.sprintable,
        completeness_score: data.completenessScore,
        notes: `Acceptance Criteria:\n${data.acceptanceCriteria.join('\n')}`,
      });

      if (dbError) throw dbError;
      toast.success('Story saved to drafts');

      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const breakdownStory = async () => {
    if (!currentWorkspace || !breakdownTitle || !breakdownDescription) return;
    
    setIsBreakingDown(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/breakdown-story`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId: currentWorkspace.id,
            storyData: {
              title: breakdownTitle,
              description: breakdownDescription,
              level: breakdownLevel,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to break down story');
      }

      if (breakdownLevel === 'feature') {
        // Create parent feature
        const { data: feature, error: featureError } = await supabase
          .from('stories')
          .insert({
            workspace_id: currentWorkspace.id,
            pb_id: `PB-FEATURE-${Date.now()}`,
            pb_title: breakdownTitle,
            description: breakdownDescription,
            status: 'draft',
            level: 'feature',
          })
          .select()
          .single();

        if (featureError) throw featureError;

        // Create child stories
        await Promise.all(data.map(async (story: any) => {
          await supabase.from('stories').insert({
            workspace_id: currentWorkspace.id,
            pb_id: `PB-STORY-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            pb_title: story.title,
            description: story.description,
            status: 'draft',
            level: 'story',
            parent_id: feature.id,
            story_points: story.storyPoints,
            acceptance_criteria: story.acceptanceCriteria,
            notes: story.technicalNotes,
          });
        }));
      } else {
        // Update single story with enhanced details
        await supabase.from('stories').insert({
          workspace_id: currentWorkspace.id,
          pb_id: `PB-STORY-${Date.now()}`,
          pb_title: data.title,
          description: data.description,
          status: 'draft',
          level: 'story',
          story_points: data.storyPoints,
          acceptance_criteria: data.acceptanceCriteria,
          notes: `Technical Notes:\n${data.technicalNotes}\n\nDependencies:\n${data.dependencies.join('\n')}\n\nRisks:\n${data.risks.join('\n')}`,
        });
      }

      toast.success(breakdownLevel === 'feature' ? 'Feature broken down into stories' : 'Story enhanced successfully');
      setBreakdownTitle('');
      setBreakdownDescription('');
      setShowBreakdownInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to process story');
    } finally {
      setIsBreakingDown(false);
    }
  };

  const enhanceStory = async () => {
    if (!currentWorkspace || !prompt) return;
    
    setIsEnhancing(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/breakdown-story`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId: currentWorkspace.id,
            storyData: {
              title: breakdownTitle,
              description: breakdownDescription,
              level: breakdownLevel,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance story');
      }

      // Create enhanced story
      const { error: dbError } = await supabase.from('stories').insert({
        workspace_id: currentWorkspace.id,
        pb_id: `PB-ENHANCED-${Date.now()}`,
        pb_title: data.title,
        description: data.description,
        status: 'draft',
        story_points: data.storyPoints,
        acceptance_criteria: data.acceptanceCriteria,
        notes: `Technical Notes:\n${data.technicalNotes}\n\nDependencies:\n${data.dependencies.join('\n')}\n\nRisks:\n${data.risks.join('\n')}`,
      });

      if (dbError) throw dbError;
      toast.success('Story enhanced and saved');

      setBreakdownTitle('');
      setBreakdownDescription('');
      setShowBreakdownInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to enhance story');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div 
      className={`
        transition-all duration-300 ease-in-out transform bg-white border border-gray-100
        ${isCollapsed 
          ? 'w-14 h-14 rounded-full shadow-lg hover:scale-110' 
          : 'w-96 h-[650px] rounded-2xl shadow-2xl'
        }
      `}
    >
      <div className="relative h-full">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-2 top-4 bg-white rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <ArrowRightIcon className="h-4 w-4 text-gray-600" />
        </button>
        
        <div className="h-full">
          {isCollapsed ? (
            <div 
              className="w-full h-full flex items-center justify-center cursor-pointer"
              onClick={() => setIsCollapsed(false)}
            >
              <SparklesIcon className="h-6 w-6 text-indigo-600 animate-pulse" />
            </div>
          ) : (
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center space-x-2 mb-4">
              <SparklesIcon className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-medium text-gray-900">AI Story Assistant</h2>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="flex-1 flex flex-col space-y-4">
              {showBreakdownInput ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-900">Manual Story Creation</h3>
                    <button
                      onClick={() => setShowBreakdownInput(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <select
                      value={breakdownLevel}
                      onChange={(e) => setBreakdownLevel(e.target.value as 'feature' | 'story')}
                      className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="feature">Feature to break down</option>
                      <option value="story">Story to enhance</option>
                    </select>
                    <input
                      type="text"
                      value={breakdownTitle}
                      onChange={(e) => setBreakdownTitle(e.target.value)}
                      placeholder={`Enter ${breakdownLevel} title`}
                      className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <textarea
                      value={breakdownDescription}
                      onChange={(e) => setBreakdownDescription(e.target.value)}
                      placeholder={`Describe the ${breakdownLevel}`}
                      rows={4}
                      className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <button
                    onClick={breakdownStory}
                    disabled={isBreakingDown || !breakdownTitle || !breakdownDescription}
                    className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 mb-2"
                  >
                    {isBreakingDown ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                        {breakdownLevel === 'feature' ? 'Break Down Feature' : 'Enhance Story'}
                      </>
                    )}
                  </button>
                  <button
                    onClick={enhanceStory}
                    disabled={isEnhancing || !breakdownTitle || !breakdownDescription}
                    className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isEnhancing ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <BoltIcon className="h-4 w-4 mr-2" />
                        Enhance with AI
                      </>
                    )}
                  </button>

                </div>
              ) : (
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe your feature or story idea..."
              />
              )}
              {!showBreakdownInput && (
              <button
                onClick={generateStory}
                disabled={loading || !prompt}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </button>
              )}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Create New Story
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowBreakdownInput(!showBreakdownInput)}
                    className="w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors duration-200 bg-gray-50 hover:bg-gray-100 text-gray-900 mb-4 flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      <PencilSquareIcon className="h-4 w-4 mr-2" />
                      Manual Creation
                    </span>
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                  <div className="text-xs text-gray-500 mb-2">Or use AI to help you create:</div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setBreakdownLevel('feature');
                        setShowBreakdownInput(false);
                      }}
                      className={`flex-1 px-4 py-2.5 text-sm rounded-xl transition-colors duration-200 ${
                        breakdownLevel === 'feature'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <SparklesIcon className="h-4 w-4 mx-auto mb-2" />
                      Feature
                    </button>
                    <button
                      onClick={() => {
                        setBreakdownLevel('story');
                        setShowBreakdownInput(false);
                      }}
                      className={`flex-1 px-4 py-2.5 text-sm rounded-xl transition-colors duration-200 ${
                        breakdownLevel === 'story'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <SparklesIcon className="h-4 w-4 mx-auto mb-2" />
                      Story
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    AI will help you generate and refine your {breakdownLevel}
                  </p>
                </div>
              </div>
              {response && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h4 className="text-sm font-medium text-indigo-900 mb-2 flex items-center">
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generated Story
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-indigo-800">Title</div>
                        <div className="text-sm text-indigo-900">{response.title}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-indigo-800">Description</div>
                        <div className="text-sm text-indigo-900">{response.description}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-indigo-800">Acceptance Criteria</div>
                        <ul className="list-disc list-inside text-sm text-indigo-900">
                          {response.acceptanceCriteria.map((criterion, index) => (
                            <li key={index}>{criterion}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-xs font-medium text-indigo-800">Story Points</div>
                          <div className="text-indigo-900">{response.riceScore.effort}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-indigo-800">RICE Score</div>
                          <div className="text-indigo-900">
                            {Math.round((response.riceScore.reach * response.riceScore.impact * response.riceScore.confidence) / response.riceScore.effort)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-indigo-800">Sprintable</div>
                          <div className="text-indigo-900">{response.sprintable ? 'Yes' : 'No'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-indigo-800">Completeness</div>
                          <div className="text-indigo-900">{response.completenessScore}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}