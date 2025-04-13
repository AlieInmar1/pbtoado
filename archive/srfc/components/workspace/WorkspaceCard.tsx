import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import { WorkspaceInfo } from './WorkspaceInfo';
import type { Workspace } from '../../types/database';

interface WorkspaceCardProps {
  workspace: Workspace;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <Link to={`/admin/workspace/${workspace.id}`}>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent>
          <WorkspaceInfo
            name={workspace.name}
            syncFrequency={workspace.sync_frequency}
            lastSyncTimestamp={workspace.last_sync_timestamp}
          />
        </CardContent>
      </Card>
    </Link>
  );
}