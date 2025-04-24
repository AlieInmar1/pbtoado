import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/shadcn/button';
import { Input } from '../../../components/ui/shadcn/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/shadcn/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/shadcn/dialog';
import { Plus, Edit, Trash2, Save, AlertTriangle, Search, EyeOff, Eye } from 'lucide-react';
import { getAllSystemConfig, SystemConfigItem, setSystemConfig, deleteSystemConfig } from '../../../lib/api/systemConfig';
import { useToast } from '../../../contexts/ToastContext';

type ConfigItemFormData = {
  key: string;
  value: string;
  description: string;
};

/**
 * SystemConfigEditor component for managing system-wide configuration
 */
export const SystemConfigEditor: React.FC = () => {
  const [configItems, setConfigItems] = useState<SystemConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<ConfigItemFormData | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteItemKey, setDeleteItemKey] = useState<string | null>(null);
  const [showSensitiveValues, setShowSensitiveValues] = useState<Record<string, boolean>>({});
  
  const context = useToast();

  // Fetch all configuration items on component mount
  useEffect(() => {
    fetchConfigItems();
  }, []);

  // Filter config items based on search term
  const filteredConfigItems = configItems.filter(item =>
    item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch configuration items from the API
  const fetchConfigItems = async () => {
    try {
      setLoading(true);
      const items = await getAllSystemConfig();
      setConfigItems(items);
    } catch (error) {
      context.addToast({
        title: 'Error',
        message: 'Failed to load configuration items',
        type: 'error',
      });
      console.error('Error fetching config items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new configuration item
  const handleCreateItem = async (formData: ConfigItemFormData) => {
    try {
      await setSystemConfig(formData.key, formData.value, formData.description);
      
      context.addToast({
        title: 'Success',
        message: `Configuration item "${formData.key}" created successfully`,
        type: 'success',
      });
      
      fetchConfigItems();
      setIsAddDialogOpen(false);
    } catch (error) {
      context.addToast({
        title: 'Error',
        message: `Failed to create configuration item: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error',
      });
    }
  };

  // Update an existing configuration item
  const handleUpdateItem = async (formData: ConfigItemFormData) => {
    try {
      await setSystemConfig(formData.key, formData.value, formData.description);
      
      context.addToast({
        title: 'Success',
        message: `Configuration item "${formData.key}" updated successfully`,
        type: 'success',
      });
      
      fetchConfigItems();
      setEditingItem(null);
    } catch (error) {
      context.addToast({
        title: 'Error',
        message: `Failed to update configuration item: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error',
      });
    }
  };

  // Delete a configuration item
  const handleDeleteItem = async (key: string) => {
    try {
      await deleteSystemConfig(key);
      
      context.addToast({
        title: 'Success',
        message: `Configuration item "${key}" deleted successfully`,
        type: 'success',
      });
      
      fetchConfigItems();
      setIsDeleteDialogOpen(false);
      setDeleteItemKey(null);
    } catch (error) {
      context.addToast({
        title: 'Error',
        message: `Failed to delete configuration item: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error',
      });
    }
  };

  // Toggle visibility of sensitive values
  const toggleValueVisibility = (key: string) => {
    setShowSensitiveValues(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Determine if a key is for a sensitive value (like a token or password)
  const isSensitiveKey = (key: string): boolean => {
    const sensitivePatterns = [
      'token',
      'key',
      'secret',
      'password',
      'auth',
      'credential',
    ];
    
    return sensitivePatterns.some(pattern => key.toLowerCase().includes(pattern));
  };

  // Mask sensitive values
  const maskValue = (value: string): string => {
    if (!value) return '';
    if (value.length <= 8) return '•'.repeat(value.length);
    return value.substring(0, 4) + '•'.repeat(value.length - 8) + value.substring(value.length - 4);
  };

  // Render edit form for a configuration item
  const renderEditForm = () => {
    if (!editingItem) return null;
    
    return (
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Configuration</DialogTitle>
            <DialogDescription>
              Update the configuration value and description.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Key</label>
              <Input 
                value={editingItem.key} 
                disabled 
                className="bg-gray-100"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Value</label>
              <Input 
                value={editingItem.value} 
                onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                type={isSensitiveKey(editingItem.key) ? "password" : "text"}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input 
                value={editingItem.description} 
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button onClick={() => handleUpdateItem(editingItem)}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Render add form for a new configuration item
  const renderAddForm = () => {
    const [formData, setFormData] = useState<ConfigItemFormData>({
      key: '',
      value: '',
      description: '',
    });
    
    return (
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Configuration</DialogTitle>
            <DialogDescription>
              Create a new configuration item with a unique key.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Key</label>
              <Input 
                value={formData.key} 
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g., azure_devops_token"
              />
              <p className="text-xs text-gray-500">
                Use snake_case for consistent naming. Keys are case-sensitive.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Value</label>
              <Input 
                value={formData.value} 
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                type={isSensitiveKey(formData.key) ? "password" : "text"}
                placeholder="Configuration value"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What this configuration is used for"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => handleCreateItem(formData)}
              disabled={!formData.key.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Render delete confirmation dialog
  const renderDeleteDialog = () => {
    return (
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the configuration key "{deleteItemKey}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteItemKey && handleDeleteItem(deleteItemKey)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">System Configuration</h1>
        
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> 
          Add Configuration
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Configuration Settings</CardTitle>
          <CardDescription>
            Manage system-wide configuration settings, API tokens, and environment variables.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search configuration items..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        {searchTerm ? 'No configuration items match your search' : 'No configuration items found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConfigItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.key}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm">
                              {isSensitiveKey(item.key) && !showSensitiveValues[item.key] 
                                ? maskValue(item.value) 
                                : item.value}
                            </span>
                            {isSensitiveKey(item.key) && (
                              <button
                                onClick={() => toggleValueVisibility(item.key)}
                                className="text-gray-500 hover:text-gray-700"
                                title={showSensitiveValues[item.key] ? "Hide value" : "Show value"}
                              >
                                {showSensitiveValues[item.key] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem({
                                key: item.key,
                                value: item.value,
                                description: item.description
                              })}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeleteItemKey(item.key);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            {filteredConfigItems.length} configuration items
          </div>
          <Button variant="outline" onClick={fetchConfigItems}>
            Refresh
          </Button>
        </CardFooter>
      </Card>
      
      {renderEditForm()}
      {renderAddForm()}
      {renderDeleteDialog()}
    </div>
  );
};

export default SystemConfigEditor;
