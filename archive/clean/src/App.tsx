import React from 'react';

function App() {
  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">ProductBoard Integration Tool</h1>
        <p className="text-gray-600">Connect and manage your ProductBoard data</p>
      </header>
      <main>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to the Clean Version</h2>
          <p className="mb-4">
            This is a simplified version of the ProductBoard integration tool that includes only the essential functionality.
          </p>
          <p className="mb-4">
            To access ProductBoard data, configure your credentials in the settings and use the pb-connect module.
          </p>
          <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
            <h3 className="font-medium text-blue-800">Getting Started</h3>
            <ul className="mt-2 list-disc list-inside text-blue-700">
              <li>Configure your ProductBoard API key</li>
              <li>Import data using the pb-connect module</li>
              <li>View and manage your ProductBoard features</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
