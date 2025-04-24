import React, { useState } from 'react';
import { Button } from '../../components/ui/shadcn/button';
import { RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ProductBoardTokenButtonProps {
  onCaptureComplete?: (result: { success: boolean; message: string }) => void;
}

/**
 * Button component that triggers the capture-productboard-tokens function
 * to automatically capture and store ProductBoard tokens.
 */
const ProductBoardTokenButton: React.FC<ProductBoardTokenButtonProps> = ({
  onCaptureComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleCapture = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Get test board URL from environment or use a fallback
      // In production, you might want to get this from configuration
      const testBoardUrl = import.meta.env.TEST_BOARD_URL || 'https://app.productboard.com';
      const workspaceId = import.meta.env.WORKSPACE_ID || '00000000-0000-0000-0000-000000000000';

      // Call the Supabase Function to capture tokens using Apify
      const { data, error } = await supabase.functions.invoke('capture-productboard-tokens', {
        body: {
          workspaceId,
          boardId: 'primary', // This should be configured as needed
          boardUrl: testBoardUrl,
          boardName: 'ProductBoard',
          isClientCapture: false,
          useApify: true, // Use Apify for token extraction with credentials from environment variables
        },
      });

      if (error) {
        setError(`Error capturing token: ${error.message}`);
        onCaptureComplete?.({ success: false, message: error.message });
        return;
      }

      // Handle the response
      if (data && data.success) {
        setMessage('ProductBoard token captured and saved successfully!');
        onCaptureComplete?.({ success: true, message: data.message });
      } else {
        setError(data?.error || 'Failed to capture token');
        onCaptureComplete?.({ 
          success: false, 
          message: data?.error || 'Failed to capture token' 
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to capture token: ${errorMessage}`);
      onCaptureComplete?.({ success: false, message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant="secondary"
        onClick={handleCapture}
        disabled={isLoading}
        className="flex items-center space-x-2"
      >
        {isLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        <span>{isLoading ? 'Capturing Token...' : 'Capture ProductBoard Token'}</span>
      </Button>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {message && (
        <div className="mt-2 text-sm text-green-600">
          {message}
        </div>
      )}

      {message && (
        <div className="mt-2 text-xs text-gray-500">
          <strong>Note:</strong> This token will be used for UI automation to add links back 
          to ProductBoard features from Azure DevOps work items.
        </div>
      )}
    </div>
  );
};

export default ProductBoardTokenButton;
