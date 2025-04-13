import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { ArrowPathIcon, KeyIcon, CheckCircleIcon, XCircleIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import type { ProductBoardTrackedBoard } from '../../types/database';

interface TokenCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: ProductBoardTrackedBoard | null;
  workspaceId: string;
}

interface TokenInfo {
  isValid: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  error?: string;
}

interface CredentialsForm {
  username: string;
  password: string;
  workspace: string;
}

/**
 * Modal for capturing ProductBoard authentication tokens
 * This component handles the automated token capture process using Apify.
 */
export function TokenCaptureModal({ isOpen, onClose, board, workspaceId }: TokenCaptureModalProps) {
  const [capturing, setCapturing] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenInfo | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [credentials, setCredentials] = useState<CredentialsForm>({
    username: '',
    password: '',
    workspace: ''
  });

  // Check if we have an existing token when the modal opens
  useEffect(() => {
    if (isOpen && board) {
      checkTokenStatus();
    }
  }, [isOpen, board]);

  // Load token status for the current board
  const checkTokenStatus = async () => {
    if (!board) return;
    
    setLoadingStatus(true);
    try {
      // Use fetch directly to avoid URL encoding issues with Supabase client
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-token-validity`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workspaceId,
            boardId: board.board_id
          })
        }
      );
      
      if (!response.ok) {
        // If not found, just set to null without error
        if (response.status === 404) {
          setTokenStatus(null);
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check token status');
      }
      
      const data = await response.json();
      
      if (data && data.isValid !== undefined) {
        setTokenStatus({
          isValid: data.isValid,
          expiresAt: data.expiresAt,
          lastUsedAt: data.lastUsedAt
        });
      } else {
        setTokenStatus(null);
      }
    } catch (error: any) {
      console.error('Error checking token status:', error);
      toast.error(`Failed to check token status: ${error.message}`);
      setTokenStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Handle credential form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Start the token capture process using Apify
  const captureTokens = async () => {
    // Show credential form if not already shown
    if (!showCredentialForm) {
      setShowCredentialForm(true);
      return;
    }
    
    // Validate credentials
    if (!credentials.username || !credentials.password) {
      toast.error('ProductBoard username and password are required');
      return;
    }

    if (!board) {
      toast.error('No board selected');
      return;
    }
    
    setCapturing(true);
    try {
      // Call Supabase function to run the Apify token extractor
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
            boardId: board.board_id,
            boardUrl: board.board_url,
            credentials: {
              username: credentials.username,
              password: credentials.password,
              workspace: credentials.workspace || undefined
            },
            useApify: true
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to capture tokens');
      }
      
      const result = await response.json();
      
      // Update token status
      toast.success('ProductBoard tokens captured successfully');
      setTokenStatus({
        isValid: true,
        expiresAt: result.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        lastUsedAt: new Date().toISOString()
      });
      
      // Reset form
      setShowCredentialForm(false);
      setCredentials({
        username: '',
        password: '',
        workspace: ''
      });
      
    } catch (error: any) {
      console.error('Error capturing tokens:', error);
      toast.error(`Failed to capture tokens: ${error.message}`);
      setTokenStatus({
        isValid: false,
        expiresAt: null,
        lastUsedAt: null,
        error: error.message
      });
    } finally {
      setCapturing(false);
    }
  };

  // Format a date string for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Calculate if a token is close to expiring (within 2 hours)
  const isTokenExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    
    const expiry = new Date(expiresAt);
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    return expiry < twoHoursFromNow;
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Capture Authentication Tokens: ${board?.board_name || ''}`}
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          To extract data from ProductBoard, we need to capture authentication tokens 
          for direct API access. This automated process securely logs in to your ProductBoard account
          and extracts the necessary tokens.
        </p>
        
        {loadingStatus ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : tokenStatus ? (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2">Token Status</h3>
            
            <div className="flex items-center mb-2">
              {tokenStatus.isValid ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-600 font-medium">Valid</span>
                </>
              ) : (
                <>
                  <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-600 font-medium">Invalid</span>
                </>
              )}
            </div>
            
            {tokenStatus.error && (
              <div className="mb-2 text-red-600 text-sm">{tokenStatus.error}</div>
            )}
            
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="font-medium">Expires:</span>{' '}
                <span className={isTokenExpiringSoon(tokenStatus.expiresAt) ? 'text-amber-600' : ''}>
                  {formatDate(tokenStatus.expiresAt)}
                  {isTokenExpiringSoon(tokenStatus.expiresAt) && ' (expiring soon)'}
                </span>
              </div>
              <div>
                <span className="font-medium">Last Used:</span> {formatDate(tokenStatus.lastUsedAt)}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  No token found for this board. Capture a token to enable direct API access.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {showCredentialForm ? (
          <div className="bg-white border border-gray-200 p-4 rounded-md shadow-sm">
            <h3 className="text-lg font-medium mb-4">Enter ProductBoard Credentials</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="username"
                    name="username"
                    value={credentials.username}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your-email@example.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="workspace" className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Name (Optional)
                </label>
                <input
                  type="text"
                  id="workspace"
                  name="workspace"
                  value={credentials.workspace}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave blank to use first available workspace"
                />
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>Your credentials are only used to log in to ProductBoard and extract tokens. They are not stored.</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2">How It Works</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Click "Capture Tokens" below to start the process</li>
              <li>Enter your ProductBoard credentials securely</li>
              <li>Our system will automatically log in and extract the tokens</li>
              <li>The tokens will be securely stored for this board</li>
              <li>Tokens expire after 24 hours and will need to be refreshed</li>
            </ol>
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button
            onClick={() => {
              if (showCredentialForm) {
                setShowCredentialForm(false);
              } else {
                onClose();
              }
            }}
            variant="secondary"
          >
            {showCredentialForm ? 'Back' : 'Cancel'}
          </Button>
          
          <div className="flex space-x-3">
            <Button
              onClick={captureTokens}
              disabled={capturing}
              className="bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center"
            >
              {capturing ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <KeyIcon className="h-4 w-4 mr-1" />
                  {showCredentialForm ? 'Submit Credentials' : 'Capture Tokens'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
