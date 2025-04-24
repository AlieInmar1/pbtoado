import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/shadcn/card';
import { StateComponentsProps } from './types';

/**
 * StateComponents component for displaying loading and error states
 */
export const StateComponents: React.FC<StateComponentsProps> = ({ 
  isLoading, 
  isError, 
  error 
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-b-transparent border-primary rounded-full"></div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return null;
};

export default StateComponents;
