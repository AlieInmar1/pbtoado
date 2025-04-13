import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useDatabase } from '../../contexts/DatabaseContext';

interface SchemaVersion {
  version: string;
  appliedAt: string;
  description: string;
}

export function SchemaVersionTracker() {
  const { db } = useDatabase();
  const [versions, setVersions] = useState<SchemaVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  // In a real application, this would fetch the schema versions from the database
  useEffect(() => {
    const fetchVersions = async () => {
      setLoading(true);
      try {
        // This is a mock implementation
        // In a real app, you would query a schema_versions table
        const mockVersions: SchemaVersion[] = [
          {
            version: '1.0.0',
            appliedAt: '2025-03-15T10:30:00Z',
            description: 'Initial schema creation',
          },
          {
            version: '1.1.0',
            appliedAt: '2025-03-20T14:45:00Z',
            description: 'Added feature flags table',
          },
          {
            version: '1.2.0',
            appliedAt: '2025-03-25T09:15:00Z',
            description: 'Added grooming sessions',
          },
          {
            version: '1.3.0',
            appliedAt: '2025-04-01T08:30:00Z',
            description: 'Added story templates',
          },
        ];
        
        setVersions(mockVersions);
        setCurrentVersion('1.3.0'); // In a real app, this would be fetched from the database
      } catch (error) {
        console.error('Error fetching schema versions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [db]);

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Schema Versions</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Check for Updates
            </Button>
            <Button variant="primary" size="sm">
              Apply Latest
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading schema versions...</div>
        ) : (
          <>
            <div className="mb-4">
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  Current schema version: <strong>{currentVersion}</strong>
                </p>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Version
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Applied At
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {versions.map((version) => (
                    <tr key={version.version}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {version.version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(version.appliedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {version.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {version.version === currentVersion ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Current
                          </span>
                        ) : version.version < currentVersion ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Applied
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              <p>
                Schema versions track database structure changes over time.
                Migrations are applied in order to ensure data integrity.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
