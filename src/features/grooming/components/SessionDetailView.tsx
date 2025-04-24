import React, { useState } from 'react';
import { ArrowLeftIcon, UserGroupIcon, DocumentTextIcon, ClockIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/shadcn/card';
import { Button } from '../../../components/ui/shadcn/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/shadcn/tabs';
import { format } from 'date-fns';
import { useGroomingSession } from '../../../hooks/useGroomingSessions';
import { SessionStatusToggle } from '../../../../grooming/SessionStatusToggle';
import { SessionParticipantList } from '../../../../grooming/SessionParticipantList';
import { TranscriptUploadModal } from '../../../../grooming/TranscriptUploadModal';
import { SessionActionItems } from '../../../../grooming/SessionActionItems';
import { StoriesTab } from './StoriesTab';

interface SessionDetailViewProps {
  sessionId: string;
  onBack: () => void;
  onSessionUpdated: () => void;
}

export const SessionDetailView: React.FC<SessionDetailViewProps> = ({
  sessionId,
  onBack,
  onSessionUpdated
}) => {
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  
  // Fetch session data
  const { 
    data: session, 
    isLoading, 
    error,
    refetch: refetchSession
  } = useGroomingSession(sessionId);
  
  // Handle status change
  const handleStatusChange = async (newStatus: 'planned' | 'in_progress' | 'completed') => {
    try {
      // In a real implementation, we would call an API to update the session status
      // await api.updateSessionStatus(sessionId, newStatus);
      
      // For now, just refetch the session data
      await refetchSession();
      onSessionUpdated();
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating session status:', error);
      return Promise.reject(error);
    }
  };
  
  // Handle participant actions
  const handleAddParticipant = async (participant: any) => {
    try {
      // In a real implementation, we would call an API to add a participant
      // await api.addParticipant(sessionId, participant);
      
      // For now, just refetch the session data
      await refetchSession();
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding participant:', error);
      return Promise.reject(error);
    }
  };
  
  const handleRemoveParticipant = async (participantId: string) => {
    try {
      // In a real implementation, we would call an API to remove a participant
      // await api.removeParticipant(sessionId, participantId);
      
      // For now, just refetch the session data
      await refetchSession();
      return Promise.resolve();
    } catch (error) {
      console.error('Error removing participant:', error);
      return Promise.reject(error);
    }
  };
  
  const handleUpdateParticipant = async (participantId: string, data: any) => {
    try {
      // In a real implementation, we would call an API to update a participant
      // await api.updateParticipant(sessionId, participantId, data);
      
      // For now, just refetch the session data
      await refetchSession();
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating participant:', error);
      return Promise.reject(error);
    }
  };
  
  // Handle transcript upload
  const handleTranscriptUploaded = () => {
    refetchSession();
    onSessionUpdated();
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !session) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold">Session Details</h1>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">Error loading session details</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">{session.name}</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
              <CardDescription>Details about this grooming session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="mt-1">{format(new Date(session.session_date), 'PPP p')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="mt-1">{session.duration_minutes} minutes</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="mt-1 capitalize">{session.session_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="mt-1">{format(new Date(session.created_at), 'PPP')}</p>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={() => setIsTranscriptModalOpen(true)}
                  className="flex items-center"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  {session.transcript ? 'Update Transcript' : 'Upload Transcript'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <SessionStatusToggle 
            session={session} 
            onStatusChange={handleStatusChange} 
          />
        </div>
      </div>
      
      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="participants">
            <UserGroupIcon className="h-4 w-4 mr-2" />
            Participants
          </TabsTrigger>
          <TabsTrigger value="stories">
            <ClockIcon className="h-4 w-4 mr-2" />
            Stories
          </TabsTrigger>
          <TabsTrigger value="action-items">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Action Items
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="participants" className="mt-6">
          {/* Mock participants for now - in a real implementation, we would fetch participants */}
          <SessionParticipantList 
            participants={[]}
            onAddParticipant={handleAddParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onUpdateParticipant={handleUpdateParticipant}
            disabled={session.status === 'completed'}
          />
        </TabsContent>
        
        <TabsContent value="stories" className="mt-6">
          <StoriesTab 
            sessionId={sessionId} 
            sessionStatus={session.status} 
            onSessionUpdated={onSessionUpdated}
          />
        </TabsContent>
        
        <TabsContent value="action-items" className="mt-6">
          {/* Mock action items for now - in a real implementation, we would fetch action items */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Action Items</h3>
              <Button 
                variant="outline" 
                size="sm"
                disabled={session.status === 'completed'}
              >
                Add Action Item
              </Button>
            </div>
            <div className="text-center py-6 text-gray-500">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm">No action items yet</p>
              <p className="text-xs">Add action items to track follow-up tasks</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Transcript Upload Modal */}
      {isTranscriptModalOpen && (
        <TranscriptUploadModal
          session={session}
          onClose={() => setIsTranscriptModalOpen(false)}
          onUploaded={handleTranscriptUploaded}
        />
      )}
    </div>
  );
};
