import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { UserTokenManager } from '../components/productboard/UserTokenManager';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// Admin sections
type AdminSection = 'tokens' | 'users' | 'stats' | 'system';

export function AdminPanel() {
  const { currentWorkspace, loading } = useWorkspace();
  const [activeSection, setActiveSection] = useState<AdminSection>('tokens');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h3 className="mt-2 text-lg font-medium text-gray-900">No Workspace Selected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please select a workspace from the dropdown in the navigation bar to access administration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Administration</h1>
      </div>

      {/* Admin Navigation */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeSection === 'tokens'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveSection('tokens')}
            >
              <div className="flex items-center">
                <span className="font-bold mr-2">TM</span>
                Token Management
              </div>
            </button>
            <button
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeSection === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveSection('users')}
            >
              <div className="flex items-center">
                <span className="font-bold mr-2">UA</span>
                User Administration
              </div>
            </button>
            <button
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeSection === 'stats'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveSection('stats')}
            >
              <div className="flex items-center">
                <span className="font-bold mr-2">SS</span>
                System Statistics
              </div>
            </button>
            <button
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeSection === 'system'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveSection('system')}
            >
              <div className="flex items-center">
                <span className="font-bold mr-2">SC</span>
                System Configuration
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Token Management */}
          {activeSection === 'tokens' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Token Management</h2>
              <UserTokenManager />
            </div>
          )}

          {/* User Administration */}
          {activeSection === 'users' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">User Administration</h2>
              <Card className="p-6 mb-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      Add User
                    </Button>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Manage users who have access to this workspace and their permissions.
                  </p>
                  
                  {/* Placeholder for user list */}
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users created yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create users to grant access to this workspace.
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Roles & Permissions</h3>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          User role management is currently under development. Check back soon for this feature.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* System Statistics */}
          {activeSection === 'stats' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">System Statistics</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="p-4 bg-white">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 p-3 rounded-md bg-blue-100">
                      <span className="text-blue-600 font-bold">AT</span>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-semibold text-gray-900">12</h2>
                      <p className="text-sm text-gray-500">Active Tokens</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 bg-white">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 p-3 rounded-md bg-green-100">
                      <span className="text-green-600 font-bold">AU</span>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-semibold text-gray-900">4</h2>
                      <p className="text-sm text-gray-500">Active Users</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 bg-white">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 p-3 rounded-md bg-purple-100">
                      <span className="text-purple-600 font-bold">SR</span>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-semibold text-gray-900">89%</h2>
                      <p className="text-sm text-gray-500">Sync Success Rate</p>
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* Additional Statistics */}
              <Card className="p-6 bg-white mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">API Usage</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">API usage statistics will appear here</p>
                </div>
              </Card>
              
              <Card className="p-6 bg-white">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sync Analytics</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Sync analytics will appear here</p>
                </div>
              </Card>
            </div>
          )}

          {/* System Configuration */}
          {activeSection === 'system' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">System Configuration</h2>
              
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">API Connection Settings</h3>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">ProductBoard API</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pb-api-key" className="block text-sm font-medium text-gray-700 mb-1">
                        API Key
                      </label>
                      <input
                        type="password"
                        id="pb-api-key"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value="••••••••••••••••••••••••••••••"
                        readOnly
                      />
                    </div>
                    <div>
                      <label htmlFor="pb-board-id" className="block text-sm font-medium text-gray-700 mb-1">
                        Default Board ID
                      </label>
                      <input
                        type="text"
                        id="pb-board-id"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Enter board ID"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Azure DevOps API</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="ado-organization" className="block text-sm font-medium text-gray-700 mb-1">
                        Organization
                      </label>
                      <input
                        type="text"
                        id="ado-organization"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Organization name"
                      />
                    </div>
                    <div>
                      <label htmlFor="ado-project" className="block text-sm font-medium text-gray-700 mb-1">
                        Project
                      </label>
                      <input
                        type="text"
                        id="ado-project"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Project name"
                      />
                    </div>
                    <div>
                      <label htmlFor="ado-api-key" className="block text-sm font-medium text-gray-700 mb-1">
                        Personal Access Token
                      </label>
                      <input
                        type="password"
                        id="ado-api-key"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Enter PAT"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Save Configuration
                  </Button>
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Flags</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Enable Token Management</h4>
                      <p className="text-sm text-gray-500">Allow users to manage their own ProductBoard tokens</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Enable Hierarchy Visualization</h4>
                      <p className="text-sm text-gray-500">Show hierarchy visualization in the UI</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Enable AI Grooming</h4>
                      <p className="text-sm text-gray-500">Enable AI-assisted grooming features</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto-Sync</h4>
                      <p className="text-sm text-gray-500">Enable automatic background synchronization</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
