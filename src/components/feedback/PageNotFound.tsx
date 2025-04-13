import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/shadcn/button';

/**
 * PageNotFound component displays a 404 error page 
 * when a route is not found.
 */
export const PageNotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
      <div className="mb-6 text-7xl font-bold text-gray-300">404</div>
      
      <h1 className="text-2xl font-semibold mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-6 max-w-md">
        The page you are looking for might have been removed, had its name changed, 
        or is temporarily unavailable.
      </p>
      
      <div className="flex space-x-4">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
        >
          Go Back
        </Button>
        
        <Button
          onClick={() => navigate('/dashboard')}
          variant="primary"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};
