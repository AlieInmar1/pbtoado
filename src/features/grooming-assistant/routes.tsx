import React from 'react';
import { SprintPlanningBoard } from '../../../grooming/sprint-planning/components/SprintPlanningBoard';
import { AnalyticsDashboard } from '../../../grooming/analytics/components/AnalyticsDashboard';
import { AIInsightsPanel } from '../../../grooming/ai-insights/components/AIInsightsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/shadcn/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/shadcn/card';

/**
 * GroomingAssistantView component provides a tabbed interface for the grooming assistant features
 */
const GroomingAssistantView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Grooming Assistant</h1>
          <p className="text-gray-500 mt-1">
            Tools to enhance your grooming process with AI insights, sprint planning, and analytics
          </p>
        </div>
      </div>

      <Tabs defaultValue="sprint-planning" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sprint-planning">Sprint Planning</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sprint-planning" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sprint Planning Board</CardTitle>
              <CardDescription>
                Organize stories into sprints with drag-and-drop functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SprintPlanningBoard workspaceId="00000000-0000-0000-0000-000000000000" />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Visualize grooming metrics and team performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsDashboard />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai-insights" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                AI-powered analysis of grooming sessions and stories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIInsightsPanel sessionId="sample-session-id" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Define routes for the grooming assistant feature
export const groomingAssistantRoutes = [
  {
    path: '/grooming-assistant',
    element: <GroomingAssistantView />,
  }
];
