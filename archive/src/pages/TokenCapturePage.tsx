import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getBookmarkletCode, consoleScript } from '../lib/bookmarklet.ts';

// CSS for a clean, focused UI
const styles = {
  container: 'max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md',
  title: 'text-2xl font-bold mb-4 text-gray-800',
  subtitle: 'text-lg font-semibold mb-2 text-gray-700',
  paragraph: 'mb-4 text-gray-600',
  stepContainer: 'mb-6',
  stepNumber: 'inline-flex items-center justify-center w-6 h-6 mr-2 bg-blue-600 text-white rounded-full text-sm',
  stepTitle: 'text-lg font-medium text-gray-800',
  stepDescription: 'mt-2 text-gray-600',
  button: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded',
  secondaryButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded ml-3',
  alert: 'p-4 mb-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700',
  success: 'p-4 mb-4 bg-green-50 border-l-4 border-green-400 text-green-700',
  error: 'p-4 mb-4 bg-red-50 border-l-4 border-red-400 text-red-700',
  buttonContainer: 'flex mt-6',
  loaderContainer: 'flex justify-center items-center py-8',
  loader: 'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600',
  codeBlock: 'bg-gray-100 p-3 rounded font-mono text-sm mb-4 overflow-x-auto',
};

/**
 * Page component for capturing ProductBoard authentication tokens
 */
export default function TokenCapturePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCaptured, setIsCaptured] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualTokens, setManualTokens] = useState('');
  
  const [boardId, setBoardId] = useState('');
  const [boardUrl, setBoardUrl] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [returnUrl, setReturnUrl] = useState('');
  
  // Parse query parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const boardIdParam = params.get('boardId');
    const boardUrlParam = params.get('boardUrl');
    const workspaceIdParam = params.get('workspaceId');
    const returnUrlParam = params.get('returnUrl');
    
    if (boardIdParam) setBoardId(boardIdParam);
    if (boardUrlParam) setBoardUrl(decodeURIComponent(boardUrlParam));
    if (workspaceIdParam) setWorkspaceId(workspaceIdParam);
    if (returnUrlParam) setReturnUrl(returnUrlParam);
  }, []);
  
  // Send message to parent window
  const sendMessageToParent = (message: any) => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(message, '*');
    }
  };
  
  // We're using the imported bookmarklet code now
  
  // Capture tokens function
  const captureTokens = async () => {
    setIsLoading(true);
    
    try {
      // Create a new window to navigate to ProductBoard
      const pbWindow = window.open(boardUrl, 'productboard-login', 'width=1024,height=768');
      
      // Check if window was blocked by popup blocker
      if (!pbWindow || pbWindow.closed || typeof pbWindow.closed === 'undefined') {
        throw new Error('Popup window was blocked. Please disable your popup blocker and try again.');
      }
      
      // Show instructions to user and focus the popup window
      setCurrentStep(2);
      
      try {
        pbWindow.focus();
      } catch (e) {
        // Ignore focus errors
      }
      
      // Add event listener for messages from the ProductBoard window
      const handleMessage = async (event: MessageEvent) => {
        if (event.data && event.data.type === 'CAPTURE_COMPLETE') {
          // Remove the event listener
          window.removeEventListener('message', handleMessage);
          
          // Extract token data
          const { cookies, localStorage, userId, userEmail } = event.data;
          
          // Close the ProductBoard window
          if (pbWindow && !pbWindow.closed) {
            pbWindow.close();
          }
          
          // Submit tokens to the backend
          await submitTokens({
            cookies,
            localStorage,
            userId,
            userEmail
          });
          
          // Complete the flow
          setCurrentStep(3);
          setIsCaptured(true);
          setIsLoading(false);
          
          // Send success message to parent
          sendMessageToParent({ 
            type: 'TOKEN_CAPTURE_SUCCESS',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });
          
          // Close this window after a brief delay
          setTimeout(() => {
            window.close();
          }, 3000);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
    } catch (error: any) {
      setIsError(true);
      setErrorMessage(error.message || 'Failed to capture tokens');
      setIsLoading(false);
      
      // Send error message to parent
      sendMessageToParent({ 
        type: 'TOKEN_CAPTURE_ERROR',
        error: error.message || 'Failed to capture tokens'
      });
    }
  };
  
  // Submit tokens to the backend
  const submitTokens = async (tokenData: any) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-productboard-tokens`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId,
            boardId,
            boardUrl,
            authData: tokenData,
            isClientCapture: true
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save tokens');
      }
      
      // No need to update the board status here - the Supabase function will do it
      // This avoids creating multiple Supabase client instances
      
    } catch (error: any) {
      throw new Error(`Failed to save tokens: ${error.message}`);
    }
  };
  
  // Handle manual token submission
  const handleManualSubmit = async () => {
    setIsLoading(true);
    
    try {
      if (!manualTokens.trim()) {
        throw new Error('Please paste the token data first');
      }
      
      // Parse the tokens
      const tokenData = JSON.parse(manualTokens);
      
      // Submit tokens to the backend
      await submitTokens(tokenData);
      
      // Complete the flow
      setCurrentStep(3);
      setIsCaptured(true);
      setIsLoading(false);
      
      // Send success message to parent
      sendMessageToParent({ 
        type: 'TOKEN_CAPTURE_SUCCESS',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      
      // Close this window after a brief delay
      setTimeout(() => {
        window.close();
      }, 3000);
      
    } catch (error: any) {
      setIsError(true);
      setErrorMessage(error.message || 'Failed to submit tokens');
      setIsLoading(false);
    }
  };
  
  // Handle close button
  const handleClose = () => {
    // Send close message to parent
    sendMessageToParent({ type: 'TOKEN_CAPTURE_CANCELLED' });
    window.close();
  };
  
  // Handle manual capture
  const handleManualCapture = () => {
    // Add instructions for manual capture
    setCurrentStep(4);
  };
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ProductBoard Token Capture</h1>
      
      {isError && (
        <div className={styles.error}>
          <p><strong>Error:</strong> {errorMessage}</p>
          <p>Please try again or contact support if the issue persists.</p>
        </div>
      )}
      
      {isLoading && (
        <div className={styles.loaderContainer}>
          <div className={styles.loader}></div>
        </div>
      )}
      
      {!isLoading && !isCaptured && currentStep === 1 && (
        <div>
          <p className={styles.paragraph}>
            This page will help you capture authentication tokens from ProductBoard.
            The tokens are needed to extract rankings directly without using Apify.
          </p>
          
          <div className={styles.alert}>
            <p><strong>Note:</strong> You will need to log in to ProductBoard with your credentials.
            Your login information is not stored, only the session tokens required for API access.</p>
          </div>
          
          <div className={styles.stepContainer}>
            <div>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepTitle}>Open ProductBoard</span>
            </div>
            <p className={styles.stepDescription}>
              Click the button below to open ProductBoard in a new window.
            </p>
          </div>
          
          <div className={styles.stepContainer}>
            <div>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepTitle}>Log in to ProductBoard</span>
            </div>
            <p className={styles.stepDescription}>
              Use your ProductBoard credentials to log in.
            </p>
          </div>
          
          <div className={styles.stepContainer}>
            <div>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepTitle}>Use the Bookmarklet</span>
            </div>
            <p className={styles.stepDescription}>
              After logging in, you'll need to use a bookmarklet to capture the tokens.
              Drag this link to your bookmarks bar: <a href={getBookmarkletCode()} className="text-blue-500 underline">Capture ProductBoard Tokens</a>
            </p>
          </div>
          
          <div className={styles.buttonContainer}>
            <button 
              className={styles.button}
              onClick={captureTokens}
            >
              Start Token Capture
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {!isLoading && !isCaptured && currentStep === 2 && (
        <div>
          <p className={styles.paragraph}>
            Please log in to ProductBoard in the new window that opened.
            After login, navigate to the board you want to extract rankings from.
          </p>
          
          <div className={styles.alert}>
            <p><strong>Important:</strong> After logging in, you need to extract the tokens. You can either:</p>
            <ol className="list-decimal ml-5 mt-2">
              <li className="mb-1">Click the "Capture ProductBoard Tokens" bookmarklet if you saved it to your bookmarks</li>
              <li>Or copy and run this code in the browser console:</li>
            </ol>
            <pre className={styles.codeBlock} style={{margin: '10px 0', background: '#f0f0f0', padding: '8px', fontSize: '0.8rem'}}>
            {`(function(){
  const cookies = document.cookie.split(';').map(c => c.trim());
  const storage = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) storage[key] = localStorage.getItem(key);
  }
  if (window.opener) window.opener.postMessage({
    type: 'CAPTURE_COMPLETE', 
    cookies, localStorage: storage
  }, '*');
  else alert('Cannot communicate with capture window');
})();`}
            </pre>
          </div>
          
          <div className={styles.buttonContainer}>
            <button
              className={styles.secondaryButton}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleManualCapture}
            >
              Manual Capture
            </button>
          </div>
        </div>
      )}
      
      {!isLoading && isCaptured && currentStep === 3 && (
        <div className={styles.success}>
          <p><strong>Success!</strong> ProductBoard tokens were captured successfully.</p>
          <p>This window will close automatically.</p>
        </div>
      )}
      
      {!isLoading && !isCaptured && currentStep === 4 && (
        <div>
          <h2 className={styles.subtitle}>Manual Token Capture</h2>
          <p className={styles.paragraph}>
            If the automatic process is not working, you can manually extract tokens from ProductBoard:
          </p>
          
          <div className={styles.stepContainer}>
            <div>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepTitle}>Open the Browser Console</span>
            </div>
            <p className={styles.stepDescription}>
              In the ProductBoard window, open the browser developer console:
              <ul className="list-disc ml-6 mt-2">
                <li>Chrome/Edge: Press F12 or right-click → Inspect → Console</li>
                <li>Firefox: Press F12 or right-click → Inspect Element → Console</li>
                <li>Safari: Enable developer menu, then Develop → Show JavaScript Console</li>
              </ul>
            </p>
          </div>
          
          <div className={styles.stepContainer}>
            <div>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepTitle}>Extract the Tokens</span>
            </div>
            <p className={styles.stepDescription}>
              Copy and paste this code into the console and press Enter:
            </p>
            <pre className={styles.codeBlock}>{consoleScript}</pre>
          </div>
          
          <div className={styles.stepContainer}>
            <div>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepTitle}>Submit the Tokens</span>
            </div>
            <p className={styles.stepDescription}>
              Copy the output from the console and paste it here:
            </p>
            <textarea 
              className="w-full p-2 border border-gray-300 rounded h-40 font-mono text-sm"
              placeholder="Paste the JSON output here..."
              value={manualTokens}
              onChange={(e) => setManualTokens(e.target.value)}
            ></textarea>
          </div>
          
          <div className={styles.buttonContainer}>
            <button 
              className={styles.button}
              onClick={handleManualSubmit}
            >
              Submit Tokens
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => setCurrentStep(2)}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
