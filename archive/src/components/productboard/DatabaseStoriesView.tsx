import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Story } from '../../types/database';

export function DatabaseStoriesView() {
  const { currentWorkspace } = useWorkspace();
  const { db } = useDatabase();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  
  const loadStories = async () => {
    if (!currentWorkspace?.id || !db) return;
    
    setLoading(true);
    try {
      // Get all stories for the workspace
      const workspaceStories = await db.stories.getByWorkspace(currentWorkspace.id);
      
      // Sort by current_rank if available
      const sortedStories = [...workspaceStories].sort((a, b) => {
        if (a.current_rank && b.current_rank) {
          return a.current_rank - b.current_rank;
        }
        if (a.current_rank) return -1;
        if (b.current_rank) return 1;
        return 0;
      });
      
      setStories(sortedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadStories();
  }, [currentWorkspace?.id, db]);
  
  return (
    <Card className="DatabaseStoriesView">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Database Stories</h3>
          <Button 
            onClick={loadStories} 
            disabled={loading}
            variant="secondary"
            className="text-xs py-1 px-2"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Story ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Previous Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stories.map(story => (
                <tr key={story.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {story.current_rank || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {story.pb_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {story.pb_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {story.previous_rank || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {story.rank_changed_at ? new Date(story.rank_changed_at).toLocaleString() : 'Never'}
                  </td>
                </tr>
              ))}
              {stories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No stories found in the database
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
