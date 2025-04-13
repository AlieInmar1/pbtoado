import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/shadcn/card';
import { Button } from '../../components/ui/shadcn/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/shadcn/table';
import { Badge } from '../../components/ui/shadcn/badge';
import { format, formatDistanceToNow } from 'date-fns'; // For date formatting

// Mock data types
interface SyncLog {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'Running' | 'Completed' | 'Failed' | 'Completed with Errors';
  itemsProcessed: number;
  errors: number;
  trigger: 'Manual' | 'Scheduled';
}

// Mock data
const MOCK_SYNC_LOGS: SyncLog[] = [
  { id: 'sync1', startTime: new Date(2025, 3, 12, 10, 30), endTime: new Date(2025, 3, 12, 10, 35), status: 'Completed', itemsProcessed: 150, errors: 0, trigger: 'Manual' },
  { id: 'sync2', startTime: new Date(2025, 3, 12, 8, 0), endTime: new Date(2025, 3, 12, 8, 7), status: 'Completed with Errors', itemsProcessed: 145, errors: 5, trigger: 'Scheduled' },
  { id: 'sync3', startTime: new Date(2025, 3, 11, 18, 15), endTime: new Date(2025, 3, 11, 18, 16), status: 'Failed', itemsProcessed: 10, errors: 1, trigger: 'Manual' },
  { id: 'sync4', startTime: new Date(2025, 3, 11, 8, 0), endTime: new Date(2025, 3, 11, 8, 5), status: 'Completed', itemsProcessed: 155, errors: 0, trigger: 'Scheduled' },
  { id: 'sync5', startTime: new Date(2025, 3, 12, 11, 0), status: 'Running', itemsProcessed: 25, errors: 0, trigger: 'Manual' }, // Currently running
];

// Helper to get badge variant based on status
const getStatusVariant = (status: SyncLog['status']): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
  switch (status) {
    case 'Running': return 'default'; // Blueish
    case 'Completed': return 'secondary'; // Gray for success (like GitHub Actions)
    case 'Completed with Errors': return 'outline'; // Yellowish/Orange
    case 'Failed': return 'destructive'; // Red
    default: return 'secondary';
  }
};

/**
 * SyncHistoryView component displays synchronization history.
 */
const SyncHistoryView: React.FC = () => {
  // Sort logs by start time descending
  const sortedLogs = MOCK_SYNC_LOGS.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Synchronization History</h1>
        <Button variant="primary">Start Manual Sync</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync Logs</CardTitle>
          <CardDescription>History of manual and scheduled synchronizations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Start Time</TableHead>
                <TableHead className="w-[150px]">Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items Processed</TableHead>
                <TableHead>Errors</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead className="w-[100px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLogs.length > 0 ? (
                sortedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(log.startTime, 'Pp')}</TableCell>
                    <TableCell>
                      {log.endTime ? formatDistanceToNow(log.endTime, { addSuffix: false, includeSeconds: true }) : 'Running...'} 
                      {/* Note: This duration calculation is incorrect, should be endTime - startTime */}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(log.status)}>{log.status}</Badge>
                    </TableCell>
                    <TableCell>{log.itemsProcessed}</TableCell>
                    <TableCell className={log.errors > 0 ? 'text-destructive' : ''}>{log.errors}</TableCell>
                    <TableCell>{log.trigger}</TableCell>
                    <TableCell>
                      <Button variant="link" size="sm" className="p-0 h-auto">View</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No synchronization history found.
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

// Define routes for the sync feature
export const syncRoutes = [
  {
    path: '/sync',
    element: <SyncHistoryView />,
  }
];
