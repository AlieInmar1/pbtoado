import React, { useState } from 'react';
import { AzureDevOpsExplorer } from './components/AzureDevOpsExplorer';
import { AzureDevOpsDataExplorer } from './components/AzureDevOpsDataExplorer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/shadcn/card';
import { Button } from '../../components/ui/shadcn/button';
import { Input } from '../../components/ui/shadcn/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/shadcn/table';
import { Badge } from '../../components/ui/shadcn/badge'; // Corrected path

// Mock data types
interface AdoStory {
  id: string;
  title: string;
  state: 'New' | 'Active' | 'Resolved' | 'Closed';
  assignedTo: string;
  areaPath: string;
  linkedFeatureId?: string; // ProductBoard Feature ID
}

// Mock data
const MOCK_STORIES: AdoStory[] = [
  { id: 'ADO-101', title: 'Implement password hashing', state: 'Closed', assignedTo: 'Alice', areaPath: 'Platform\\Security', linkedFeatureId: 'f1' },
  { id: 'ADO-102', title: 'Set up JWT authentication', state: 'Closed', assignedTo: 'Alice', areaPath: 'Platform\\Security', linkedFeatureId: 'f1' },
  { id: 'ADO-201', title: 'Develop sync logic for features', state: 'Active', assignedTo: 'Bob', areaPath: 'Platform\\Sync', linkedFeatureId: 'f2' },
  { id: 'ADO-202', title: 'Handle API rate limits', state: 'Active', assignedTo: 'Bob', areaPath: 'Platform\\Sync', linkedFeatureId: 'f2' },
  { id: 'ADO-301', title: 'Create dashboard layout', state: 'New', assignedTo: 'Charlie', areaPath: 'MobileApp\\UI', linkedFeatureId: 'f3' },
  { id: 'ADO-302', title: 'Add filtering controls', state: 'New', assignedTo: 'Charlie', areaPath: 'MobileApp\\UI', linkedFeatureId: 'f3' },
  { id: 'ADO-401', title: 'Investigate custom field sync', state: 'New', assignedTo: 'David', areaPath: 'Platform\\Sync' }, // Unlinked
];

// Helper to get badge variant based on state
const getStateVariant = (state: AdoStory['state']): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
  switch (state) {
    case 'New': return 'secondary';
    case 'Active': return 'default'; // Using default (blueish) for Active
    case 'Resolved': return 'outline'; // Using outline for Resolved
    case 'Closed': return 'secondary'; // Using secondary (gray) for Closed
    default: return 'secondary';
  }
};

/**
 * StoriesView component displays Azure DevOps stories.
 */
const StoriesView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredStories = MOCK_STORIES.filter(story =>
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Azure DevOps Stories</h1>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/stories/azure-devops'}
          >
            View Azure DevOps Explorer
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/stories/azure-devops-data'}
          >
            View Hierarchy Data
          </Button>
          <Input
            type="search"
            placeholder="Search stories (ID, title, assignee)..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work Items</CardTitle>
          <CardDescription>User stories and tasks from Azure DevOps.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Area Path</TableHead>
                <TableHead>Linked Feature</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStories.length > 0 ? (
                filteredStories.map((story) => (
                  <TableRow key={story.id}>
                    <TableCell className="font-medium">{story.id}</TableCell>
                    <TableCell>{story.title}</TableCell>
                    <TableCell>
                      <Badge variant={getStateVariant(story.state)}>{story.state}</Badge>
                    </TableCell>
                    <TableCell>{story.assignedTo}</TableCell>
                    <TableCell>{story.areaPath}</TableCell>
                    <TableCell>{story.linkedFeatureId || 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No stories found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Define routes for the stories feature
export const storiesRoutes = [
  {
    path: '/stories',
    element: <StoriesView />,
  },
  {
    path: '/stories/azure-devops',
    element: <AzureDevOpsExplorer />,
  },
  {
    path: '/stories/azure-devops-data',
    element: <AzureDevOpsDataExplorer />,
  }
];
