import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/shadcn/card';
import { Button } from '../ui/shadcn/button';
import { StatusBadge } from '../feedback/StatusBadge';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

// Types for connection status
export type ConnectionState = 'connected' | 'disconnected' | 'error' | 'expired' | 'pending';

export type ConnectionInfo = {
  name: string;
  state: ConnectionState;
  lastChecked?: Date;
  expiresAt?: Date;
  errorMessage?: string;
};

export type ConnectionStatusProps = {
  connections: ConnectionInfo[];
  onRefresh?: (connectionName: string) => void;
  onTestConnection?: (connectionName: string) => void;
  className?: string;
};

/**
 * ConnectionStatus component displays the status of API connections
 * in the admin interface.
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connections,
  onRefresh,
  onTestConnection,
  className = '',
}) => {
  // Format date for display
  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  // Get time until expiration
  const getTimeUntilExpiration = (expiresAt?: Date) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    }
    
    return `${diffHours}h`;
  };

  // Get status badge type based on connection state
  const getStatusBadgeType = (state: ConnectionState): any => {
    switch (state) {
      case 'connected': return 'synced';
      case 'disconnected': return 'failed';
      case 'error': return 'failed';
      case 'expired': return 'failed';
      case 'pending': return 'pending';
      default: return 'failed';
    }
  };

  // Get status icon based on connection state
  const getStatusIcon = (state: ConnectionState) => {
    switch (state) {
      case 'connected': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'disconnected': return <AlertCircle className="h-5 w-5 text-gray-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'expired': return <Clock className="h-5 w-5 text-orange-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-blue-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-semibold">API Connections</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connections.map((connection) => (
          <Card key={connection.name} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{connection.name}</CardTitle>
                  <CardDescription>
                    Last checked: {formatDate(connection.lastChecked)}
                  </CardDescription>
                </div>
                <div>
                  {getStatusIcon(connection.state)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status:</span>
                  <StatusBadge 
                    type={getStatusBadgeType(connection.state)} 
                    variant="sync"
                  />
                </div>
                
                {connection.expiresAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Expires:</span>
                    <div className="flex items-center">
                      <span className="text-sm">
                        {formatDate(connection.expiresAt)}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({getTimeUntilExpiration(connection.expiresAt)})
                      </span>
                    </div>
                  </div>
                )}
                
                {connection.errorMessage && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                    {connection.errorMessage}
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="bg-gray-50 border-t flex justify-end space-x-2 py-2">
              {onTestConnection && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onTestConnection(connection.name)}
                >
                  Test Connection
                </Button>
              )}
              
              {onRefresh && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onRefresh(connection.name)}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
