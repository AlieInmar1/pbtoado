import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { ServerStackIcon, Cog6ToothIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { AIAssistant } from './AIAssistant';
import { Select } from './ui/Select';

export function Layout() {
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspace();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <ServerStackIcon className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  PB + ADO Sync
                </span>
              </Link>              
            </div>
            <div className="flex items-center">
              <Select
                value={currentWorkspace?.id || ''}
                onChange={(e) => {
                  const selectedWorkspace = workspaces.find((w) => w.id === e.target.value);
                  setCurrentWorkspace(selectedWorkspace || null);
                }}
                options={[
                  { value: '', label: 'Select Workspace' },
                  ...workspaces.map((w) => ({
                    value: w.id,
                    label: w.name,
                  }))
                ]}
                className="w-64 mr-4"
              />
              <Link
                to="/admin"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname.startsWith('/admin')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900'
                } mr-4`}
              >
                <Cog6ToothIcon className="h-5 w-5 mr-1" />
                Admin
              </Link>
              <Link
                to="/grooming"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname.startsWith('/admin')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UsersIcon className="h-5 w-5 mr-1" />
                Grooming
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-100">
        <Outlet />
        <div className="fixed bottom-8 right-8 z-50">
          <AIAssistant />
        </div>
      </main>
    </div>
  );
}
