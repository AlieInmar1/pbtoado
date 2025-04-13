import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { DatabaseProviderFactory } from '../../lib/database/factory';
import type { DatabaseConfig } from '../../lib/database/types/config';

interface DatabaseProviderSelectorProps {
  initialConfig?: DatabaseConfig;
  onConfigChange: (config: DatabaseConfig) => void;
}

export function DatabaseProviderSelector({
  initialConfig,
  onConfigChange,
}: DatabaseProviderSelectorProps) {
  const [providerType, setProviderType] = useState<DatabaseConfig['type']>(
    initialConfig?.type || 'supabase'
  );
  const [config, setConfig] = useState<DatabaseConfig>(
    initialConfig || DatabaseProviderFactory.getDefaultConfig('supabase')
  );

  // Update config when provider type changes
  useEffect(() => {
    if (config.type !== providerType) {
      const newConfig = DatabaseProviderFactory.getDefaultConfig(providerType);
      setConfig(newConfig);
      onConfigChange(newConfig);
    }
  }, [providerType, onConfigChange]);

  // Update parent component when config changes
  const handleConfigChange = (newConfig: DatabaseConfig) => {
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <Card>
      <CardContent>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Database Provider</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider Type
            </label>
            <Select
              value={providerType}
              onChange={(e) => setProviderType(e.target.value as DatabaseConfig['type'])}
              options={[
                { value: 'supabase', label: 'Supabase' },
                { value: 'postgres', label: 'PostgreSQL' },
                { value: 'mongodb', label: 'MongoDB' },
                { value: 'mock', label: 'Mock (Testing)' },
              ]}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">Connection Settings</h3>
            
            <Input
              label="Database URL"
              value={config.connection.url}
              onChange={(e) => {
                handleConfigChange({
                  ...config,
                  connection: {
                    ...config.connection,
                    url: e.target.value,
                  },
                });
              }}
              placeholder={
                providerType === 'supabase'
                  ? 'https://your-project.supabase.co'
                  : providerType === 'postgres'
                  ? 'postgresql://localhost:5432'
                  : providerType === 'mongodb'
                  ? 'mongodb://localhost:27017'
                  : 'memory://'
              }
            />

            <Input
              label={
                providerType === 'supabase'
                  ? 'API Key'
                  : providerType === 'postgres' || providerType === 'mongodb'
                  ? 'Password'
                  : 'Mock Key'
              }
              type="password"
              value={config.connection.key}
              onChange={(e) => {
                handleConfigChange({
                  ...config,
                  connection: {
                    ...config.connection,
                    key: e.target.value,
                  },
                });
              }}
              placeholder={
                providerType === 'supabase'
                  ? 'your-supabase-key'
                  : providerType === 'postgres' || providerType === 'mongodb'
                  ? 'password'
                  : 'mock-key'
              }
            />

            {/* Supabase-specific options */}
            {providerType === 'supabase' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-service-role"
                  checked={!!(config.connection.options?.useServiceRole)}
                  onChange={(checked) => {
                    handleConfigChange({
                      ...config,
                      connection: {
                        ...config.connection,
                        options: {
                          ...config.connection.options,
                          useServiceRole: checked,
                        },
                      },
                    });
                  }}
                />
                <label htmlFor="use-service-role" className="text-sm text-gray-700">
                  Use service role key (for admin operations)
                </label>
              </div>
            )}

            {/* PostgreSQL-specific options */}
            {providerType === 'postgres' && (
              <>
                <Input
                  label="Database Name"
                  value={config.connection.options?.database as string || ''}
                  onChange={(e) => {
                    handleConfigChange({
                      ...config,
                      connection: {
                        ...config.connection,
                        options: {
                          ...config.connection.options,
                          database: e.target.value,
                        },
                      },
                    });
                  }}
                  placeholder="pbtoado"
                />

                <Input
                  label="Username"
                  value={config.connection.options?.user as string || ''}
                  onChange={(e) => {
                    handleConfigChange({
                      ...config,
                      connection: {
                        ...config.connection,
                        options: {
                          ...config.connection.options,
                          user: e.target.value,
                        },
                      },
                    });
                  }}
                  placeholder="postgres"
                />

                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-ssl"
                    checked={!!(config.connection.options?.ssl)}
                    onChange={(checked) => {
                      handleConfigChange({
                        ...config,
                        connection: {
                          ...config.connection,
                          options: {
                            ...config.connection.options,
                            ssl: checked,
                          },
                        },
                      });
                    }}
                  />
                  <label htmlFor="use-ssl" className="text-sm text-gray-700">
                    Use SSL connection
                  </label>
                </div>
              </>
            )}

            {/* MongoDB-specific options */}
            {providerType === 'mongodb' && (
              <Input
                label="Database Name"
                value={config.connection.options?.database as string || ''}
                onChange={(e) => {
                  handleConfigChange({
                    ...config,
                    connection: {
                      ...config.connection,
                      options: {
                        ...config.connection.options,
                        database: e.target.value,
                      },
                    },
                  });
                }}
                placeholder="pbtoado"
              />
            )}

            {/* Mock-specific options */}
            {providerType === 'mock' && (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="seed-data"
                    checked={!!(config.connection.options?.seedData)}
                    onChange={(checked) => {
                      handleConfigChange({
                        ...config,
                        connection: {
                          ...config.connection,
                          options: {
                            ...config.connection.options,
                            seedData: checked,
                          },
                        },
                      });
                    }}
                  />
                  <label htmlFor="seed-data" className="text-sm text-gray-700">
                    Seed with test data
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="simulate-latency"
                    checked={!!(config.connection.options?.simulateLatency)}
                    onChange={(checked) => {
                      handleConfigChange({
                        ...config,
                        connection: {
                          ...config.connection,
                          options: {
                            ...config.connection.options,
                            simulateLatency: checked,
                          },
                        },
                      });
                    }}
                  />
                  <label htmlFor="simulate-latency" className="text-sm text-gray-700">
                    Simulate network latency
                  </label>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">Advanced Settings</h3>
            
            <Input
              label="Schema Version"
              value={config.schemaVersion || ''}
              onChange={(e) => {
                handleConfigChange({
                  ...config,
                  schemaVersion: e.target.value,
                });
              }}
              placeholder="1.0.0"
            />

            <div className="flex items-center space-x-2">
              <Switch
                id="debug-mode"
                checked={!!config.debug}
                onChange={(checked) => {
                  handleConfigChange({
                    ...config,
                    debug: checked,
                  });
                }}
              />
              <label htmlFor="debug-mode" className="text-sm text-gray-700">
                Enable debug logging
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
