import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ServerIcon, CircleStackIcon, CloudIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export function MigrationGuide() {
  return (
    <Card>
      <CardContent>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Migration Guide</h2>
        <p className="text-sm text-gray-500 mb-6">
          Follow these steps to migrate your application to a different backend.
        </p>

        <div className="space-y-8">
          {/* Step 1: Data Export */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
              <ArrowDownTrayIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Step 1: Export Your Data
            </h3>
            <div className="ml-7 space-y-2">
              <p className="text-sm text-gray-600">
                Use the Database Migration Tool above to export all your data. This will create a JSON file containing:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                <li>Workspaces and configurations</li>
                <li>Stories and their relationships</li>
                <li>Templates and field mappings</li>
                <li>Feature flags and settings</li>
              </ul>
            </div>
          </div>

          {/* Step 2: Database Setup */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
              <CircleStackIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Step 2: Set Up New Database
            </h3>
            <div className="ml-7 space-y-2">
              <p className="text-sm text-gray-600">
                Create your new database schema using the migration files in <code>/supabase/migrations</code>:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                <li>Core tables (stories, workspaces)</li>
                <li>Audit tables for change tracking</li>
                <li>Indexes and constraints</li>
                <li>Triggers for timestamps and validation</li>
              </ul>
              <div className="bg-gray-50 p-4 rounded-md mt-2">
                <p className="text-sm text-gray-700 font-medium mb-2">Example PostgreSQL Setup:</p>
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {`-- Create database
CREATE DATABASE your_db_name;

-- Apply migrations
\i path/to/migrations/*.sql

-- Verify setup
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';`}
                </pre>
              </div>
            </div>
          </div>

          {/* Step 3: Update Repository Layer */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
              <ServerIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Step 3: Implement Repository Layer
            </h3>
            <div className="ml-7 space-y-2">
              <p className="text-sm text-gray-600">
                Create new repository implementations in <code>src/lib/database/your-backend</code>:
              </p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-700 font-medium mb-2">Example Repository Structure:</p>
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {`src/lib/database/your-backend/
├── index.ts                    # Main provider
├── client.ts                   # Database client
└── repositories/
    ├── StoryRepository.ts      # Story operations
    ├── WorkspaceRepository.ts  # Workspace operations
    └── ...                     # Other repositories`}
                </pre>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Each repository must implement the interfaces defined in <code>src/lib/database/types.ts</code>
              </p>
            </div>
          </div>

          {/* Step 4: Update Edge Functions */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
              <CloudIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Step 4: Migrate Edge Functions
            </h3>
            <div className="ml-7 space-y-2">
              <p className="text-sm text-gray-600">
                Convert Supabase Edge Functions to your new platform:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                <li>Story analysis and generation</li>
                <li>Sync operations</li>
                <li>Integration testing</li>
                <li>Transcript analysis</li>
              </ul>
              <div className="bg-gray-50 p-4 rounded-md mt-2">
                <p className="text-sm text-gray-700 font-medium mb-2">Example Cloud Function:</p>
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {`// AWS Lambda example
exports.handler = async (event) => {
  const { workspaceId, storyData } = JSON.parse(event.body);
  
  // Your existing business logic here
  const analysis = await analyzeStory(workspaceId, storyData);
  
  return {
    statusCode: 200,
    body: JSON.stringify(analysis)
  };
};`}
                </pre>
              </div>
            </div>
          </div>

          {/* Step 5: Import Data */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
              <ArrowUpTrayIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Step 5: Import Data
            </h3>
            <div className="ml-7 space-y-2">
              <p className="text-sm text-gray-600">
                Use the Database Migration Tool to import your exported data into the new system.
                The tool will:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                <li>Validate the import file format</li>
                <li>Import data in the correct order (respecting foreign keys)</li>
                <li>Preserve all relationships and metadata</li>
                <li>Handle any necessary data transformations</li>
              </ul>
            </div>
          </div>

          {/* Step 6: Testing */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Step 6: Verify Migration
            </h3>
            <div className="ml-7 space-y-2">
              <p className="text-sm text-gray-600">
                Run the test suite to verify the migration:
              </p>
              <pre className="text-xs bg-gray-50 p-4 rounded-md">npm run test</pre>
              <p className="text-sm text-gray-600 mt-2">
                The tests will verify:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                <li>Data integrity and relationships</li>
                <li>Repository implementations</li>
                <li>Edge function compatibility</li>
                <li>Feature flag functionality</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
