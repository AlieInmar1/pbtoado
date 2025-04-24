import React, { useState } from 'react';
// Removed duplicate React import
import { supabase } from '../../../lib/supabase'; // Adjust path as needed
import { Button } from '../../../components/ui/Button'; // Corrected casing
import { Input } from '../../../components/ui/shadcn/input';   // Reverted path to shadcn subdir
import { Label } from '../../../components/ui/label'; // Path seems correct now
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/ui/Card'; // Corrected imports
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'; // Path seems correct now
import { Loader2 } from 'lucide-react'; // For loading indicator

export const PbAdoLinker: React.FC = () => {
  const [pbStoryUrl, setPbStoryUrl] = useState<string>('https://inmar.productboard.com/products-page?d=MTpQbUVudGl0eToxZmRhZDY4YS02NjZlLTRkY2UtYjVlYi1iMzU2N2YwZGU1NWY%3D');
  const [adoProjectName, setAdoProjectName] = useState<string>('Healthcare POC 1');
  const [adoStoryId, setAdoStoryId] = useState<string>('228508');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ success: boolean; message: string; screenshot?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLinkStory = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    if (!pbStoryUrl || !adoProjectName || !adoStoryId) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Calling proxy endpoint /apify/run-pb-linker...'); // Updated log

      // Get Supabase anon key for header - STILL NEEDED if proxy uses it for Supabase token fetch
      // const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // Ensure this env var is set in your .env file

      // REMOVED: Session check - bypassing user auth for this temporary test
      // const session = (await supabase.auth.getSession()).data.session;
      // if (!session) {
      //   throw new Error('User not authenticated. Cannot call function.');
      // }

      // REMOVED check for supabaseAnonKey as it's no longer needed here
      // if (!supabaseAnonKey) {
      //   console.error("VITE_SUPABASE_ANON_KEY is not set in environment variables.");
      //   // No longer need anon key check here if proxy handles all auth
      //   // throw new Error('Application configuration error.');
      // }

      const proxyUrl = 'http://localhost:3008/apify/run-pb-linker'; // New proxy endpoint

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No specific auth headers needed from client to this endpoint
          // Proxy server handles Supabase and Apify auth internally
        },
        body: JSON.stringify({ pbStoryUrl, adoProjectName, adoStoryId }),
      });

      if (!response.ok) {
        // Attempt to read error details from the response body
        let errorDetails = `Proxy request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || errorData.error || errorDetails;
        } catch (e) {
          // Ignore if response body is not JSON or empty
        }
        console.error('Proxy function invocation error:', errorDetails);
        throw new Error(errorDetails);
      }

      // Assuming the proxy forwards the function's JSON response
      const data = await response.json();

      // --- Original response handling logic ---
      console.log('Function response data:', data);

      if (data && typeof data === 'object') {
         // Type assertion if necessary, assuming data matches the expected structure
         const responseData = data as { success: boolean; message: string; screenshot?: string };
         setResult(responseData);
         if (!responseData.success) {
             setError(responseData.message);
         }
      } else {
          // Handle unexpected response format
          console.error('Unexpected response format from function:', data);
          throw new Error('Received unexpected response format from the server.');
      }
      // --- End of original response handling ---

    } catch (err: any) {
      console.error('Error calling /apify/run-pb-linker endpoint:', err); // Updated log message
      setError(err.message || 'An unexpected error occurred.');
      setResult(null); // Clear previous results on new error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        {/* Use standard HTML elements for title and description */}
        <h3 className="text-lg font-semibold leading-none tracking-tight">Link ProductBoard Story to ADO (UI Automation)</h3>
        <p className="text-sm text-muted-foreground">
          Enter the details below to automatically link a ProductBoard story to an Azure DevOps work item using UI automation.
        </p>
      </CardHeader>
      <CardBody className="space-y-4"> {/* Use CardBody */}
        <div className="space-y-2">
          <Label htmlFor="pbStoryUrl">ProductBoard Story URL</Label>
          <Input
            id="pbStoryUrl"
            type="url"
            placeholder="https://your-company.productboard.com/..."
            value={pbStoryUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPbStoryUrl(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adoProjectName">ADO Project Name</Label>
          <Input
            id="adoProjectName"
            type="text"
            placeholder="Your ADO Project"
            value={adoProjectName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdoProjectName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adoStoryId">ADO Story ID</Label>
          <Input
            id="adoStoryId"
            type="text"
            placeholder="e.g., 12345"
            value={adoStoryId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdoStoryId(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </CardBody> {/* Corrected closing tag */}
      <CardFooter className="flex flex-col items-start space-y-4">
        <Button onClick={handleLinkStory} disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Linking...' : 'Link Story via UI Automation'}
        </Button>

        {error && (
          <Alert variant="destructive" className="w-full">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            {result?.screenshot && <p className="text-xs mt-1">{result.screenshot}</p>}
          </Alert>
        )}

        {result && result.success && (
          <Alert variant="default" className="w-full bg-green-50 border-green-200 text-green-800">
             <AlertTitle>Success</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
};

// Export default if this is the main component for the feature page
// export default PbAdoLinker;
