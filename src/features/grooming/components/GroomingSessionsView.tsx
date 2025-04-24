import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/shadcn/card';
import { Button } from '../../../components/ui/shadcn/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/shadcn/table';
import { Badge } from '../../../components/ui/shadcn/badge';
import { format } from 'date-fns';
import { useGroomingSessions } from '../../../hooks/useGroomingSessions';
import { GroomingSessionModal } from '../../../../grooming/GroomingSessionModal';
import { SessionDetailView } from '../../../features/grooming/components/SessionDetailView';

import { useWorkspace } from '../../../contexts/WorkspaceContext';

/**
 * GroomingSessionsView component displays grooming session information and management.
 */
const GroomingSessionsView: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  // Use a valid UUID for the default workspace to avoid type errors with Supabase
  const DEFAULT_WORKSPACE_UUID = '00000000-0000-0000-0000-000000000000';
  const workspaceId = currentWorkspace?.id || DEFAULT_WORKSPACE_UUID;
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Fetch grooming sessions
  const { 
    data: sessionsData, 
    isLoading, 
    error, 
    refetch: refetchSessions 
  } = useGroomingSessions({ workspace_id: workspaceId });
  
  // Map status to badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'planned': return 'default'; // Blue
      case 'in_progress': return 'secondary'; // Gray
      case 'completed': return 'outline'; // Green outline
      default: return 'secondary';
    }
  };
  
  // Map status to display text
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'planned': return 'Planned';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };
  
  // Handle session creation
  const handleSessionCreated = () => {
    refetchSessions();
  };
  
  // Handle view session
  const handleViewSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };
  
  // Handle back to list
  const handleBackToList = () => {
    setSelectedSessionId(null);
  };

  // If a session is selected, show the detail view
  if (selectedSessionId) {
    return (
      <SessionDetailView 
        sessionId={selectedSessionId} 
        onBack={handleBackToList} 
        onSessionUpdated={refetchSessions}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Grooming Sessions</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Schedule New Session
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">Error loading grooming sessions</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>Past and upcoming grooming sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Session Name</TableHead>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsData?.data && sessionsData.data.length > 0 ? (
                  sessionsData.data.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.name}</TableCell>
                      <TableCell>{format(new Date(session.session_date), 'PPP')}</TableCell>
                      <TableCell className="capitalize">{session.session_type}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(session.status)}>
                          {getStatusText(session.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewSession(session.id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No grooming sessions found. Create your first session to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <GroomingSessionModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleSessionCreated}
        />
      )}
    </div>
  );
};

export default GroomingSessionsView;
