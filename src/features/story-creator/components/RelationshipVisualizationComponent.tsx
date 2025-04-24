import React, { useState, useEffect, useRef } from 'react';
import { Story, StoryReference } from '../../../types/story-creator';
import { supabase } from '../../../lib/supabase';

interface RelationshipVisualizationProps {
  story: Partial<Story>;
  allStories: Partial<Story>[];
  onSelectRelatedStory?: (storyId: string) => void;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'current' | 'dependency' | 'dependent' | 'related';
  data: Partial<Story>;
}

interface GraphLink {
  source: string;
  target: string;
  type: 'depends_on' | 'blocked_by' | 'related_to';
}

/**
 * RelationshipVisualizationComponent displays a visual graph of story relationships
 * including dependencies, stories that depend on this one, and related stories.
 */
export const RelationshipVisualizationComponent: React.FC<RelationshipVisualizationProps> = ({
  story,
  allStories,
  onSelectRelatedStory
}) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [relatedStoriesLoaded, setRelatedStoriesLoaded] = useState<boolean>(false);
  const [showAllRelated, setShowAllRelated] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Set up the initial graph with the current story and its direct dependencies
  useEffect(() => {
    if (!story.id) return;
    
    const setupInitialGraph = () => {
      try {
        // Create the current story node
        const currentNode: GraphNode = {
          id: story.id!,
          label: story.title || 'Current Story',
          type: 'current',
          data: story
        };
        
        const graphNodes: GraphNode[] = [currentNode];
        const graphLinks: GraphLink[] = [];
        
        // Add dependencies as nodes and create links
        if (story.dependencies && story.dependencies.length > 0) {
          story.dependencies.forEach(dep => {
            // Find the full dependency story from allStories
            const dependencyStory = allStories.find(s => s.id === dep.id);
            if (dependencyStory) {
              graphNodes.push({
                id: dep.id,
                label: dependencyStory.title || dep.title || 'Dependency',
                type: 'dependency',
                data: dependencyStory
              });
              
              // Create a link from current story to dependency
              graphLinks.push({
                source: story.id!,
                target: dep.id,
                type: 'depends_on'
              });
            }
          });
        }
        
        // Find stories that depend on this one
        const dependentStories = allStories.filter(s => 
          s.dependencies?.some(d => d.id === story.id)
        );
        
        dependentStories.forEach(depStory => {
          if (depStory.id) {
            graphNodes.push({
              id: depStory.id,
              label: depStory.title || 'Dependent Story',
              type: 'dependent',
              data: depStory
            });
            
            // Create a link from dependent story to current story
            graphLinks.push({
              source: depStory.id,
              target: story.id!,
              type: 'blocked_by'
            });
          }
        });
        
        setNodes(graphNodes);
        setLinks(graphLinks);
      } catch (err) {
        console.error('Error setting up relationship graph:', err);
        setError('Failed to visualize relationships. Please try again.');
      }
    };
    
    setupInitialGraph();
  }, [story.id, story.dependencies, allStories]);
  
  // Load related stories based on common tags, categories, etc.
  useEffect(() => {
    if (!story.id || relatedStoriesLoaded || !showAllRelated) return;
    
    const fetchRelatedStories = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use tags and categories for finding related stories
        const tags = story.tags || [];
        const category = story.investment_category;
        
        // Find stories with similar tags or categories
        let relatedStories: Partial<Story>[] = [];
        
        if (tags.length > 0 || category) {
          const { data, error } = await supabase
            .from('stories')
            .select('*')
            .neq('id', story.id)
            .limit(10);
            
          if (error) throw error;
          
            if (data) {
            // Filter stories with common tags or categories
            relatedStories = data.filter(s => {
              // Check for common tags
              const commonTags = s.tags?.filter((tag: string) => tags.includes(tag)) || [];
              const hasSameCategory = s.investment_category === category;
              
              return commonTags.length > 0 || hasSameCategory;
            });
          }
        }
        
        // Add related stories to the graph
        if (relatedStories.length > 0) {
          setNodes(prev => {
            const existingNodeIds = new Set(prev.map(n => n.id));
            const newNodes: GraphNode[] = [...prev];
            
            relatedStories.forEach(relStory => {
              if (relStory.id && !existingNodeIds.has(relStory.id)) {
                newNodes.push({
                  id: relStory.id,
                  label: relStory.title || 'Related Story',
                  type: 'related',
                  data: relStory
                });
                
                // Create a 'related_to' link
                setLinks(prevLinks => [
                  ...prevLinks,
                  {
                    source: story.id!,
                    target: relStory.id!,
                    type: 'related_to'
                  }
                ]);
              }
            });
            
            return newNodes;
          });
        }
        
        setRelatedStoriesLoaded(true);
      } catch (err) {
        console.error('Error loading related stories:', err);
        setError('Failed to load related stories. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelatedStories();
  }, [story.id, story.tags, story.investment_category, relatedStoriesLoaded, showAllRelated]);
  
  // Render the graph using simple HTML/CSS
  // In a real application, you might use a library like D3.js or react-force-graph
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Story Relationships</h3>
      
      {error && (
        <div className="mb-4 bg-red-50 p-3 rounded-md text-sm text-red-600">
          {error}
        </div>
      )}
      
      {nodes.length === 1 && links.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M13 10V3L4 14h7v7l9-11h-7z" 
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No relationships found</h3>
          <p className="mt-1 text-sm text-gray-500">
            This story doesn't have any dependencies or related stories yet.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div 
            ref={canvasRef} 
            className="h-[300px] bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
          >
            {/* Simple visualization of the graph */}
            <div className="p-4 h-full flex flex-col items-center justify-center relative">
              {/* Center node (current story) */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-blue-100 border-2 border-blue-500 rounded-lg px-3 py-2 shadow-md w-48 text-center">
                  <div className="font-medium text-blue-800 truncate">
                    {story.title || 'Current Story'}
                  </div>
                </div>
              </div>
              
              {/* Dependency nodes (top) */}
              <div className="absolute top-4 left-0 right-0 flex justify-center space-x-4">
                {nodes.filter(n => n.type === 'dependency').map(node => (
                  <div 
                    key={node.id} 
                    className="bg-green-100 border border-green-500 rounded-lg px-3 py-2 shadow-sm cursor-pointer hover:bg-green-200"
                    onClick={() => onSelectRelatedStory?.(node.id)}
                  >
                    <div className="text-xs font-medium text-green-800 truncate max-w-[100px]">
                      {node.label}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Dependent nodes (bottom) */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                {nodes.filter(n => n.type === 'dependent').map(node => (
                  <div 
                    key={node.id} 
                    className="bg-red-100 border border-red-500 rounded-lg px-3 py-2 shadow-sm cursor-pointer hover:bg-red-200"
                    onClick={() => onSelectRelatedStory?.(node.id)}
                  >
                    <div className="text-xs font-medium text-red-800 truncate max-w-[100px]">
                      {node.label}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Related nodes (sides) */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-2">
                {nodes.filter(n => n.type === 'related').slice(0, 3).map(node => (
                  <div 
                    key={node.id} 
                    className="bg-purple-100 border border-purple-500 rounded-lg px-3 py-2 shadow-sm cursor-pointer hover:bg-purple-200"
                    onClick={() => onSelectRelatedStory?.(node.id)}
                  >
                    <div className="text-xs font-medium text-purple-800 truncate max-w-[100px]">
                      {node.label}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Draw lines between nodes (simplified) */}
              <div className="absolute inset-0 pointer-events-none">
                <svg width="100%" height="100%">
                  {/* These lines are simplified; in a real app, you'd calculate actual coordinates */}
                  {links.map((link, index) => {
                    const sourceType = nodes.find(n => n.id === link.source)?.type || 'current';
                    const targetType = nodes.find(n => n.id === link.target)?.type || 'current';
                    
                    let color = '#6366F1'; // Default indigo color
                    if (link.type === 'depends_on') color = '#10B981'; // green
                    else if (link.type === 'blocked_by') color = '#EF4444'; // red
                    
                    return (
                      <line 
                        key={index}
                        x1="50%" 
                        y1="50%" 
                        x2={sourceType === 'dependency' ? '50%' : targetType === 'dependency' ? '50%' : '75%'}
                        y2={sourceType === 'dependency' ? '20%' : targetType === 'dependency' ? '20%' : '50%'}
                        stroke={color}
                        strokeWidth="2"
                        strokeDasharray={link.type === 'related_to' ? '5,5' : undefined}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Current Story</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Dependencies</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Dependent Stories</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span>Related Stories</span>
            </div>
          </div>
          
          {/* Show more related stories button */}
          {!showAllRelated && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowAllRelated(true)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-1 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    Find related stories
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
