import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { SupabaseClient } from '@supabase/supabase-js';

export function ProductBoardCredentialsForm() {
  const { currentWorkspace } = useWorkspace();
  const { db } = useDatabase();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  
  // Use the same hardcoded workspace ID as in AdminPanel.tsx
  const workspaceId = '6f171cbd-8b15-4779-b4fc-4092649e70d1';
  
  useEffect(() => {
    loadCredentials();
  }, []);
  
  const loadCredentials = async () => {
    
    try {
      const { data, error } = await (supabase as SupabaseClient)
        .from('productboard_ui_credentials')
        .select('username')
        .eq('workspace_id', workspaceId)
        .single();
      
      if (error) {
        console.error('Error loading credentials:', error);
        return;
      }
      
      if (data) {
        setUsername(data.username);
        setHasCredentials(true);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };
  
  const handleSave = async () => {
    if (!username || (!password && !hasCredentials)) {
      toast.error('Username and password are required');
      return;
    }
    
    setLoading(true);
    
    try {
      // If we already have credentials and the password field is empty,
      // we only want to update the username
      if (hasCredentials && !password) {
        const { error } = await (supabase as SupabaseClient)
          .from('productboard_ui_credentials')
          .update({
            username,
            updated_at: new Date().toISOString()
          })
          .eq('workspace_id', workspaceId);
        
        if (error) throw error;
      } else {
        // Otherwise, we're either creating new credentials or updating both username and password
        const { error } = await (supabase as SupabaseClient)
          .from('productboard_ui_credentials')
          .upsert({
            workspace_id: workspaceId,
            username,
            password,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'workspace_id'
          });
        
        if (error) throw error;
      }
      
      toast.success('ProductBoard credentials saved');
      setHasCredentials(true);
      setPassword(''); // Clear password field after save
    } catch (error: any) {
      console.error('Error saving credentials:', error);
      toast.error(`Failed to save credentials: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">ProductBoard UI Credentials</h2>
      <p className="text-gray-600 mb-4">
        These credentials will be used to log into ProductBoard and extract story rankings.
        They are stored securely and only used for automated synchronization.
      </p>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            ProductBoard Username
          </label>
          <Input
            id="username"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your ProductBoard email"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            ProductBoard Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={hasCredentials ? "••••••••••••" : "Enter your ProductBoard password"}
          />
          {hasCredentials && (
            <p className="mt-1 text-xs text-gray-500">
              Leave blank to keep the existing password
            </p>
          )}
        </div>
        
        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={loading || !username || (!password && !hasCredentials)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Saving...' : 'Save Credentials'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
