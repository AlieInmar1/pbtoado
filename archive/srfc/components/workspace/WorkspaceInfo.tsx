import React from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

interface WorkspaceInfoProps {
  name: string;
  syncFrequency: string;
  lastSyncTimestamp: string | null;
}

export function WorkspaceInfo({ name, syncFrequency, lastSyncTimestamp }: WorkspaceInfoProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{name}</h3>
      <div className="space-y-1 mb-4">
        <p className="text-sm text-gray-500">
          Syncs every {syncFrequency}
        </p>
        <p className="text-sm text-gray-500">
          Last sync: {lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleString() : 'Never'}
        </p>
      </div>
      <div className="flex items-center text-sm text-gray-600">
        <Cog6ToothIcon className="h-4 w-4 mr-1" />
        Configure Settings
      </div>
    </div>
  );
}