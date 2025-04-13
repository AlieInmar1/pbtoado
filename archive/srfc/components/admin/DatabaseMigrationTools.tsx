import React from 'react';
import { EnhancedDatabaseMigrationTool } from './EnhancedDatabaseMigrationTool';
import { MigrationGuide } from './MigrationGuide';

export function DatabaseMigrationTools() {
  return (
    <div className="space-y-6">
      <EnhancedDatabaseMigrationTool />
      <MigrationGuide />
    </div>
  );
}
