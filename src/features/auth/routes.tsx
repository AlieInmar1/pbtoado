import React from 'react';

// Placeholder component
const Login = () => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
    <h1 className="text-2xl font-semibold mb-6">Login Page</h1>
    <p className="text-gray-500">This is a placeholder for the login page.</p>
  </div>
);

// Define routes for the auth feature
export const authRoutes = [
  {
    path: '/login',
    element: <Login />,
  }
];
