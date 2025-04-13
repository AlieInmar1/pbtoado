import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Notification toaster */}
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
        
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <NavLink 
                  to="/" 
                  className="flex-shrink-0 flex items-center text-indigo-600 font-bold text-xl"
                >
                  <div className="mr-2 h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                    PB
                  </div>
                  <span className="hidden md:block">ProductBoard-ADO</span>
                </NavLink>
              </div>
              
              <nav className="flex items-center space-x-4">
                <NavLink 
                  to="/" 
                  className={({ isActive }) => 
                    `px-3 py-2 text-sm font-medium transition-all duration-150 flex items-center ${
                      isActive 
                        ? 'text-indigo-600 border-b-2 border-indigo-500' 
                        : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                    }`
                  }
                  end
                >
                  Dashboard
                </NavLink>
                
                <NavLink 
                  to="/hierarchy" 
                  className={({ isActive }) => 
                    `px-3 py-2 text-sm font-medium transition-all duration-150 flex items-center ${
                      isActive 
                        ? 'text-indigo-600 border-b-2 border-indigo-500' 
                        : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                    }`
                  }
                >
                  Hierarchy
                </NavLink>
                
                <NavLink 
                  to="/features" 
                  className={({ isActive }) => 
                    `px-3 py-2 text-sm font-medium transition-all duration-150 flex items-center ${
                      isActive 
                        ? 'text-indigo-600 border-b-2 border-indigo-500' 
                        : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                    }`
                  }
                >
                  Features
                </NavLink>
                
                <NavLink 
                  to="/stories" 
                  className={({ isActive }) => 
                    `px-3 py-2 text-sm font-medium transition-all duration-150 flex items-center ${
                      isActive 
                        ? 'text-indigo-600 border-b-2 border-indigo-500' 
                        : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                    }`
                  }
                >
                  Stories
                </NavLink>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/hierarchy" element={<PlaceholderPage title="Hierarchy" />} />
              <Route path="/features" element={<PlaceholderPage title="Features" />} />
              <Route path="/stories" element={<PlaceholderPage title="Stories" />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

// Simple placeholder components for testing
function HomePage() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900">Dashboard</h1>
      <p className="text-gray-500">
        Welcome to the ProductBoard-ADO integration dashboard.
      </p>
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900">{title}</h1>
      <p className="text-gray-500">
        This is the {title.toLowerCase()} page.
      </p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="bg-white shadow rounded-lg p-6 text-center">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900">404 - Not Found</h1>
      <p className="text-gray-500">
        The page you're looking for doesn't exist.
      </p>
    </div>
  );
}

export default App;
