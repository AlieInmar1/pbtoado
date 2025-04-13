import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'sonner';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { 
  HomeIcon, 
  RectangleGroupIcon,
  AdjustmentsHorizontalIcon,
  LinkIcon,
  ClockIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

// Import existing pages
import { GroomingSessions } from './pages/GroomingSessions';
import ProductBoardHierarchy from './pages/ProductBoardHierarchy';
import { ProductBoardFeatures } from './pages/ProductBoardFeatures';
import ProductBoardRankings from './pages/ProductBoardRankings';
import { StoryManagement } from './pages/StoryManagement';
import { SyncHistory } from './pages/SyncHistory';

function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <DatabaseProvider>
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: 'white',
                color: '#374151',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '0.5rem'
              },
            }}
          />
          <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <NavLink 
                      to="/" 
                      className="flex-shrink-0 flex items-center text-primary-600 font-bold text-xl"
                    >
                      <div className="mr-2 h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white">
                        PB
                      </div>
                      <span className="hidden md:block">ProductBoard-ADO</span>
                    </NavLink>
                  </div>
                  
                  <nav className="flex items-center space-x-1 sm:space-x-4">
                    <NavLink 
                      to="/" 
                      className={({ isActive }) => 
                        `px-2 sm:px-3 py-2 text-sm font-medium transition-all duration-150 flex items-center ${
                          isActive 
                            ? 'text-primary-600 border-b-2 border-primary-500' 
                            : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                        }`
                      }
                      end
                    >
                      <HomeIcon className="h-5 w-5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </NavLink>
                    
                    <NavLink 
                      to="/hierarchy" 
                      className={({ isActive }) => 
                        `px-2 sm:px-3 py-2 text-sm font-medium transition-all duration-150 flex items-center ${
                          isActive 
                            ? 'text-primary-600 border-b-2 border-primary-500' 
                            : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                        }`
                      }
                    >
                      <RectangleGroupIcon className="h-5 w-5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Hierarchy</span>
                    </NavLink>
                    
                    <NavLink 
                      to="/features" 
                      className={({ isActive }) => 
                        `px-2 sm:px-3 py-2 text-sm font-medium transition-all duration-150 flex items-center ${
                          isActive 
                            ? 'text-primary-600 border-b-2 border-primary-500' 
                            : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                        }`
                      }
                    >
                      <AdjustmentsHorizontalIcon className="h-5 w-5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Features</span>
                    </NavLink>
                    
                    <NavLink 
                      to="/stories" 
                      className={({ isActive }) => 
                        `px-2 sm:px-3 py-2 text-sm font-medium transition-all duration-150 flex items-center ${
                          isActive 
                            ? 'text-primary-600 border-b-2 border-primary-500' 
                            : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                        }`
                      }
                    >
                      <LinkIcon className="h-5 w-5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Stories</span>
                    </NavLink>
                    
                    <NavLink 
                      to="/grooming" 
                      className={({ isActive }) => 
                        `px-2 sm:px-3 py-2 text-sm font-medium transition-all duration-150 flex items-center ${
                          isActive 
                            ? 'text-primary-600 border-b-2 border-primary-500' 
                            : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                        }`
                      }
                    >
                      <UserGroupIcon className="h-5 w-5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Grooming</span>
                    </NavLink>
                    
                    <NavLink 
                      to="/sync-history" 
                      className={({ isActive }) => 
                        `px-2 sm:px-3 py-2 text-sm font-medium transition-all duration-150 flex items-center ${
                          isActive 
                            ? 'text-primary-600 border-b-2 border-primary-500' 
                            : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                        }`
                      }
                    >
                      <ClockIcon className="h-5 w-5 sm:mr-1.5" />
                      <span className="hidden sm:inline">History</span>
                    </NavLink>
                    
                    <NavLink 
                      to="/admin" 
                      className={({ isActive }) => 
                        `px-2 sm:px-3 py-2 text-sm font-medium transition-all duration-150 flex items-center ${
                          isActive 
                            ? 'text-primary-600 border-b-2 border-primary-500' 
                            : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                        }`
                      }
                    >
                      <Cog6ToothIcon className="h-5 w-5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Admin</span>
                    </NavLink>
                  </nav>
                </div>
              </div>
            </header>

            <main className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/hierarchy" element={<ProductBoardHierarchy />} />
                  <Route path="/features" element={<ProductBoardFeatures />} />
                  <Route path="/rankings" element={<ProductBoardRankings />} />
                  <Route path="/stories" element={<StoryManagement />} />
                  <Route path="/grooming" element={<GroomingSessions />} />
                  <Route path="/sync-history" element={<SyncHistory />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/story-dependencies" element={
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                      <h1 className="text-2xl font-semibold mb-4 text-gray-900">Story Dependencies</h1>
                      <p className="text-gray-600">Manage relationships between stories and tasks.</p>
                    </div>
                  } />
                  <Route path="/estimations" element={
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                      <h1 className="text-2xl font-semibold mb-4 text-gray-900">Estimations</h1>
                      <p className="text-gray-600">Track and manage story estimations and planning.</p>
                    </div>
                  } />
                  <Route path="/ado-hierarchy" element={
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                      <h1 className="text-2xl font-semibold mb-4 text-gray-900">Azure DevOps Hierarchy</h1>
                      <p className="text-gray-600">View your Azure DevOps work items hierarchy.</p>
                    </div>
                  } />
                  <Route path="/sync-status" element={
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                      <h1 className="text-2xl font-semibold mb-4 text-gray-900">Sync Status</h1>
                      <p className="text-gray-600">Monitor ongoing and scheduled sync operations.</p>
                    </div>
                  } />
                  <Route path="/connections" element={
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                      <h1 className="text-2xl font-semibold mb-4 text-gray-900">Connections</h1>
                      <p className="text-gray-600">Manage API connections and service integrations.</p>
                    </div>
                  } />
                </Routes>
              </div>
            </main>
          </div>
        </DatabaseProvider>
      </WorkspaceProvider>
    </BrowserRouter>
  );
}

export default App;
