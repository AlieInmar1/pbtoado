import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/shadcn/card';
import { Button } from '../../components/ui/shadcn/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/shadcn/table';
import { Badge } from '../../components/ui/shadcn/badge';
import { format } from 'date-fns'; // For date formatting

// Mock data types
interface GroomingSession {
  id: string;
  date: Date;
  attendees: string[];
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

// Mock data
const MOCK_SESSIONS: GroomingSession[] = [
  { id: 'gs1', date: new Date(2025, 3, 10), attendees: ['Alice', 'Bob', 'Charlie'], notes: 'Discussed feature sync engine details.', status: 'Completed' },
  { id: 'gs2', date: new Date(2025, 3, 17), attendees: ['Alice', 'Charlie', 'David'], notes: 'Planning for interactive dashboard.', status: 'Scheduled' },
  { id: 'gs3', date: new Date(2025, 3, 3), attendees: ['Bob', 'David'], notes: 'Initial review of custom fields.', status: 'Completed' },
  { id: 'gs4', date: new Date(2025, 2, 27), attendees: ['Alice', 'Bob'], notes: 'Cancelled due to conflict.', status: 'Cancelled' },
];

// Helper to get badge variant based on status
const getStatusVariant = (status: GroomingSession['status']): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
  switch (status) {
    case 'Scheduled': return 'default'; // Blueish
    case 'Completed': return 'secondary'; // Gray
    case 'Cancelled': return 'destructive'; // Red
    default: return 'secondary';
  }
};

/**
 * GroomingView component displays grooming session information.
 */
const GroomingView: React.FC = () => {
  // Sort sessions by date descending
  const sortedSessions = MOCK_SESSIONS.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Grooming Sessions</h1>
        <Button variant="primary">Schedule New Session</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>Past and upcoming grooming sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Date</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSessions.length > 0 ? (
                sortedSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{format(session.date, 'PPP')}</TableCell> {/* Format date */}
                    <TableCell>{session.attendees.join(', ')}</TableCell>
                    <TableCell className="max-w-xs truncate">{session.notes}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(session.status)}>{session.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No grooming sessions found.
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

// Define routes for the grooming feature
export const groomingRoutes = [
  {
    path: '/grooming',
    element: <GroomingView />,
  }
];
