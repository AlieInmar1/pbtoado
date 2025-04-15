import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

/**
 * MainLayout component provides the main application layout structure,
 * including the navigation header and content area.
 * It uses the Outlet component from react-router-dom to render nested route content.
 */
export const MainLayout: React.FC = () => {
  const location = useLocation();
  
  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  // Navigation items - only showing grooming, grooming assistant, story creator, and admin as requested
  const navItems = [
    { path: '/grooming', label: 'Grooming' },
    { path: '/grooming-assistant', label: 'Grooming Assistant' },
    { path: '/story-creator', label: 'Story Creator' },
    { path: '/admin', label: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link 
                to="/dashboard" 
                className="flex-shrink-0 flex items-center text-indigo-600 font-bold text-xl"
              >
                <div className="mr-2 h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                  PB
                </div>
                <span className="hidden md:block">ProductBoard-ADO</span>
              </Link>
            </div>
            
            <nav className="flex items-center space-x-4">
              {navItems.map((item) => (
                <Link 
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-150 flex items-center ${
                    isActive(item.path) 
                      ? 'text-indigo-600 border-b-2 border-indigo-500' 
                      : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
