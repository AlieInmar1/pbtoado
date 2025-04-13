import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { 
  HomeIcon, 
  RectangleGroupIcon, 
  AdjustmentsHorizontalIcon,
  LinkIcon,
  ClockIcon,
  ArrowPathIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

export function Navigation() {
  const location = useLocation();
  const { workspaces, currentWorkspace, setCurrentWorkspace, loading } = useWorkspace();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">PB-ADO Integration</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`${
                  isActive('/') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <HomeIcon className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
              <Link
                to="/hierarchy"
                className={`${
                  isActive('/hierarchy') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <RectangleGroupIcon className="h-4 w-4 mr-1" />
                Hierarchy
              </Link>
              <Link
                to="/features"
                className={`${
                  isActive('/features') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
                Features
              </Link>
              <Link
                to="/rankings"
                className={`${
                  isActive('/rankings') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Rankings
              </Link>
              <Link
                to="/stories"
                className={`${
                  isActive('/stories') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                Stories
              </Link>
              <Link
                to="/grooming"
                className={`${
                  isActive('/grooming') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <UserGroupIcon className="h-4 w-4 mr-1" />
                Grooming
              </Link>
              <Link
                to="/sync-history"
                className={`${
                  isActive('/sync-history') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <ClockIcon className="h-4 w-4 mr-1" />
                History
              </Link>
              <Link
                to="/admin"
                className={`${
                  isActive('/admin') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <Cog6ToothIcon className="h-4 w-4 mr-1" />
                Admin
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-white p-1 rounded-md inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span>{loading ? 'Loading...' : currentWorkspace?.name || 'Select Workspace'}</span>
                <ChevronDownIcon className="h-4 w-4 ml-1" aria-hidden="true" />
              </button>

              {dropdownOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="workspace-menu"
                >
                  <div className="py-1" role="none">
                    {workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        onClick={() => {
                          setCurrentWorkspace(workspace);
                          setDropdownOpen(false);
                        }}
                        className={`${
                          currentWorkspace?.id === workspace.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                        role="menuitem"
                      >
                        {workspace.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, shows/hides based on menu state */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className={`${
              isActive('/') 
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            Dashboard
          </Link>
          <Link
            to="/hierarchy"
            className={`${
              isActive('/hierarchy') 
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            Hierarchy
          </Link>
          <Link
            to="/features"
            className={`${
              isActive('/features') 
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            Features
          </Link>
          <Link
            to="/rankings"
            className={`${
              isActive('/rankings') 
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            Rankings
          </Link>
          <Link
            to="/stories"
            className={`${
              isActive('/stories') 
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            Stories
          </Link>
          <Link
            to="/grooming"
            className={`${
              isActive('/grooming') 
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            Grooming
          </Link>
          <Link
            to="/sync-history"
            className={`${
              isActive('/sync-history') 
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            History
          </Link>
          <Link
            to="/admin"
            className={`${
              isActive('/admin') 
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            Admin
          </Link>

          <div className="mt-4 border-t border-gray-200 pt-4 pl-3">
            <div className="text-gray-600 font-semibold mb-2">Workspace</div>
            <div className="space-y-1">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => setCurrentWorkspace(workspace)}
                  className={`${
                    currentWorkspace?.id === workspace.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } block w-full text-left px-2 py-2 text-sm hover:bg-gray-100 rounded-md`}
                >
                  {workspace.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
