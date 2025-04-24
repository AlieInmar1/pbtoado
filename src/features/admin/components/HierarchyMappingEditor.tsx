import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/shadcn/card';
import { Button } from '../../../components/ui/shadcn/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/shadcn/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/shadcn/dialog';
import SimpleAreaPathTab from './hierarchy-mapping/SimpleAreaPathTab';
import { useHierarchyMappings } from '../../../hooks/useHierarchyMappings';
import { 
  HierarchyMappingConfig, 
  PbToAdoMapping, 
  AreaPathMapping, 
  InitiativeEpicMapping,
  UserTeamMapping,
  ComponentProductMapping
} from '../../../lib/api/hierarchyMapping';
import { Plus, Trash2, Save, RefreshCw, Check, X, GripVertical } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

/**
 * Component for editing hierarchy mappings between ProductBoard and Azure DevOps
 */
export const HierarchyMappingEditor: React.FC = () => {
  const { 
    mappings, 
    isLoading, 
    isError, 
    error, 
    saveMapping, 
    isSaving 
  } = useHierarchyMappings();
  
  // State for the currently selected mapping
  const [selectedMapping, setSelectedMapping] = useState<HierarchyMappingConfig | null>(null);
  const [editedMapping, setEditedMapping] = useState<HierarchyMappingConfig | null>(null);
  
  
  // State for auto-fetched users and teams
  const [pbUsers, setPbUsers] = useState<any[]>([]);
  const [pbTeams, setPbTeams] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<Error | null>(null);
  
  // State for auto-fetched initiatives and epics
  const [pbInitiatives, setPbInitiatives] = useState<any[]>([]);
  const [adoEpics, setAdoEpics] = useState<any[]>([]);
  const [isLoadingInitiatives, setIsLoadingInitiatives] = useState<boolean>(false);
  const [initiativesError, setInitiativesError] = useState<Error | null>(null);
  
  // State for suggested mappings
  const [suggestedUserMappings, setSuggestedUserMappings] = useState<UserTeamMapping[]>([]);
  const [suggestedInitiativeMappings, setSuggestedInitiativeMappings] = useState<InitiativeEpicMapping[]>([]);
  
  // Set the first mapping as selected when mappings are loaded
  useEffect(() => {
    if (mappings && mappings.length > 0 && !selectedMapping) {
      setSelectedMapping(mappings[0]);
      setEditedMapping(JSON.parse(JSON.stringify(mappings[0]))); // Deep copy
    }
  }, [mappings, selectedMapping]);
  
  // State for the currently selected tab
  const [activeTab, setActiveTab] = useState<string>('pb-to-ado');
  
  
  // Handle saving the mapping
  const handleSave = () => {
    if (editedMapping) {
      saveMapping(editedMapping);
    }
  };
  
  // Handle adding a new PB to ADO mapping
  const handleAddPbToAdoMapping = () => {
    if (editedMapping) {
      const newMapping: PbToAdoMapping = {
        pb_level: 'feature',
        ado_type: 'Feature',
        description: 'New mapping'
      };
      
      setEditedMapping({
        ...editedMapping,
        pb_to_ado_mappings: [...editedMapping.pb_to_ado_mappings, newMapping]
      });
    }
  };
  
  // Handle removing a PB to ADO mapping
  const handleRemovePbToAdoMapping = (index: number) => {
    if (editedMapping) {
      const newMappings = [...editedMapping.pb_to_ado_mappings];
      newMappings.splice(index, 1);
      
      setEditedMapping({
        ...editedMapping,
        pb_to_ado_mappings: newMappings
      });
    }
  };
  
  // Handle updating a PB to ADO mapping
  const handleUpdatePbToAdoMapping = (index: number, field: keyof PbToAdoMapping, value: string) => {
    if (editedMapping) {
      const newMappings = [...editedMapping.pb_to_ado_mappings];
      newMappings[index] = {
        ...newMappings[index],
        [field]: value
      };
      
      setEditedMapping({
        ...editedMapping,
        pb_to_ado_mappings: newMappings
      });
    }
  };
  
  // Handle adding a new area path mapping
  const handleAddAreaPathMapping = () => {
    if (editedMapping) {
      const newMapping: AreaPathMapping = {
        mapping_type: 'epic',
        business_unit: 'Business Unit',
        product_code: 'Product',
        team: 'Team',
        area_path: 'Area\\Path',
        description: 'New area path mapping'
      };
      
      setEditedMapping({
        ...editedMapping,
        area_path_mappings: [...editedMapping.area_path_mappings, newMapping]
      });
    }
  };
  
  // Handle removing an area path mapping
  const handleRemoveAreaPathMapping = (index: number) => {
    if (editedMapping) {
      const newMappings = [...editedMapping.area_path_mappings];
      newMappings.splice(index, 1);
      
      setEditedMapping({
        ...editedMapping,
        area_path_mappings: newMappings
      });
    }
  };
  
  // Handle updating an area path mapping
  const handleUpdateAreaPathMapping = (index: number, field: keyof AreaPathMapping, value: string) => {
    if (editedMapping) {
      const newMappings = [...editedMapping.area_path_mappings];
      newMappings[index] = {
        ...newMappings[index],
        [field]: value
      };
      
      setEditedMapping({
        ...editedMapping,
        area_path_mappings: newMappings
      });
    }
  };
  
  // Handle updating the mapping name or description
  const handleUpdateMappingInfo = (field: 'name' | 'description', value: string) => {
    if (editedMapping) {
      setEditedMapping({
        ...editedMapping,
        [field]: value
      });
    }
  };
  
  // Handle adding a new initiative-epic mapping
  const handleAddInitiativeEpicMapping = () => {
    if (editedMapping) {
      const newMapping: InitiativeEpicMapping = {
        pb_initiative_id: '',
        pb_initiative_name: '',
        ado_epic_id: 0,
        ado_epic_name: '',
        manually_mapped: true,
        description: 'New initiative-epic mapping'
      };
      
      setEditedMapping({
        ...editedMapping,
        initiative_epic_mappings: [...editedMapping.initiative_epic_mappings, newMapping]
      });
    }
  };
  
  // Handle removing an initiative-epic mapping
  const handleRemoveInitiativeEpicMapping = (index: number) => {
    if (editedMapping) {
      const newMappings = [...editedMapping.initiative_epic_mappings];
      newMappings.splice(index, 1);
      
      setEditedMapping({
        ...editedMapping,
        initiative_epic_mappings: newMappings
      });
    }
  };
  
  // Handle updating an initiative-epic mapping
  const handleUpdateInitiativeEpicMapping = (
    index: number, 
    field: keyof InitiativeEpicMapping, 
    value: string | number | boolean
  ) => {
    if (editedMapping) {
      const newMappings = [...editedMapping.initiative_epic_mappings];
      newMappings[index] = {
        ...newMappings[index],
        [field]: value
      };
      
      setEditedMapping({
        ...editedMapping,
        initiative_epic_mappings: newMappings
      });
    }
  };
  
  // Handle adding a new user team mapping
  const handleAddUserTeamMapping = () => {
    if (editedMapping) {
      const newMapping: UserTeamMapping = {
        user_email: '',
        team: '',
        business_unit: '',
        product_code: '',
        description: 'New user team mapping'
      };
      
      setEditedMapping({
        ...editedMapping,
        user_team_mappings: [...editedMapping.user_team_mappings, newMapping]
      });
    }
  };
  
  // Handle removing a user team mapping
  const handleRemoveUserTeamMapping = (index: number) => {
    if (editedMapping) {
      const newMappings = [...editedMapping.user_team_mappings];
      newMappings.splice(index, 1);
      
      setEditedMapping({
        ...editedMapping,
        user_team_mappings: newMappings
      });
    }
  };
  
  // Handle updating a user team mapping
  const handleUpdateUserTeamMapping = (
    index: number, 
    field: keyof UserTeamMapping, 
    value: string
  ) => {
    if (editedMapping) {
      const newMappings = [...editedMapping.user_team_mappings];
      newMappings[index] = {
        ...newMappings[index],
        [field]: value
      };
      
      setEditedMapping({
        ...editedMapping,
        user_team_mappings: newMappings
      });
    }
  };
  
  // Handle adding a new component product mapping
  const handleAddComponentProductMapping = () => {
    if (editedMapping) {
      const newMapping = {
        component_id: '',
        component_name: '',
        product_id: '',
        product_name: '',
        business_unit: '',
        description: 'New component-product mapping'
      };
      
      setEditedMapping({
        ...editedMapping,
        component_product_mappings: [...editedMapping.component_product_mappings, newMapping]
      });
    }
  };
  
  // Handle removing a component product mapping
  const handleRemoveComponentProductMapping = (index: number) => {
    if (editedMapping) {
      const newMappings = [...editedMapping.component_product_mappings];
      newMappings.splice(index, 1);
      
      setEditedMapping({
        ...editedMapping,
        component_product_mappings: newMappings
      });
    }
  };
  
  // Handle updating a component product mapping
  const handleUpdateComponentProductMapping = (
    index: number, 
    field: keyof ComponentProductMapping, 
    value: string
  ) => {
    if (editedMapping) {
      const newMappings = [...editedMapping.component_product_mappings];
      newMappings[index] = {
        ...newMappings[index],
        [field]: value
      };
      
      setEditedMapping({
        ...editedMapping,
        component_product_mappings: newMappings
      });
    }
  };
  
  // State for filters
  const [pbTypeFilter, setPbTypeFilter] = useState<string>('all');
  const [adoTypeFilter, setAdoTypeFilter] = useState<string>('all');
  const [showMismatchesOnly, setShowMismatchesOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State for selected item and detail dialog
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState<boolean>(false);
  
  // State for column widths
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    pbName: 120,
    pbType: 80,
    pbParent: 120,
    adoId: 60,
    adoName: 120,
    adoType: 80,
    adoAreaPath: 120,
    expectedAdoType: 80,
    expectedAdoParent: 120,
    expectedAreaPath: 120,
    typeMatch: 60,
    parentMatch: 60,
    areaMatch: 60
  });
  
  // State for column resizing
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState<number>(0);
  const [startWidth, setStartWidth] = useState<number>(0);
  
  // Column resize handlers
  const handleResizeStart = (columnId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingColumn(columnId);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnId] || 100);
    
    // Add event listeners for mousemove and mouseup
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };
  
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingColumn) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff); // Minimum width of 50px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }));
  };
  
  const handleResizeEnd = () => {
    setResizingColumn(null);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);
  
  // Handle row click to show detail dialog
  const handleRowClick = (item: any) => {
    setSelectedItem(item);
    setIsDetailDialogOpen(true);
  };
  
  // State for ADO teams
  const [adoTeams, setAdoTeams] = useState<any[]>([]);
  const [isLoadingAdoTeams, setIsLoadingAdoTeams] = useState<boolean>(false);
  const [adoTeamsError, setAdoTeamsError] = useState<Error | null>(null);

  // Function to fetch ProductBoard users and teams
  const fetchPbUsersAndTeams = async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    setIsLoadingAdoTeams(true);
    setAdoTeamsError(null);
    
    try {
      // Fetch ProductBoard features to extract owner emails
      const { data: pbFeatures, error: pbFeaturesError } = await supabase
        .from('productboard_features')
        .select('*');
      
      if (pbFeaturesError) {
        throw new Error(`Error fetching ProductBoard features: ${pbFeaturesError.message}`);
      }
      
      // Extract unique owner emails from features
      const ownerEmailsSet = new Set<string>();
      
      pbFeatures?.forEach((feature: any) => {
        // Extract owner email if available
        if (feature.owner_email) {
          ownerEmailsSet.add(feature.owner_email);
        }
      });
      
      // Convert to array and sort
      const ownerEmails = Array.from(ownerEmailsSet).sort();
      
      // Create user objects
      const users = ownerEmails.map(email => ({
        email,
        name: email.split('@')[0],
        teams: [],
        business_units: [],
        product_codes: []
      }));
      
      setPbUsers(users);
      
      // Fetch ADO teams in parallel
      try {
        const { data: teams, error: teamsError } = await supabase
          .from('ado_teams')
          .select('*');
        
        if (teamsError) {
          throw new Error(`Error fetching ADO teams: ${teamsError.message}`);
        }
        
        setAdoTeams(teams || []);
      } catch (error) {
        console.error('Error fetching ADO teams:', error);
        setAdoTeamsError(error as Error);
      } finally {
        setIsLoadingAdoTeams(false);
      }
      
      // Generate suggested user team mappings
      const suggestedMappings: UserTeamMapping[] = [];
      
      // For each user, try to find a matching ADO team
      users.forEach(user => {
        const userNamePart = user.name.toLowerCase();
        
        // Try to find a matching team by name similarity
        const matchingTeam = adoTeams.find(team => 
          team.name.toLowerCase().includes(userNamePart) || 
          userNamePart.includes(team.name.toLowerCase())
        );
        
        if (matchingTeam) {
          suggestedMappings.push({
            user_email: user.email,
            team: matchingTeam.name,
            business_unit: '',
            product_code: '',
            description: `Auto-suggested mapping based on name similarity`
          });
        }
      });
      
      setSuggestedUserMappings(suggestedMappings);
      
      // If there are suggested mappings and the current mapping doesn't have any user team mappings,
      // we'll show them as suggestions but not automatically add them
      
    } catch (error) {
      console.error('Error fetching ProductBoard users and teams:', error);
      setUsersError(error as Error);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  // Function to fetch ProductBoard initiatives and Azure DevOps epics
  const fetchInitiativesAndEpics = async () => {
    setIsLoadingInitiatives(true);
    setInitiativesError(null);
    
    try {
      // Fetch ProductBoard initiatives
      const { data: initiatives, error: initiativesError } = await supabase
        .from('productboard_initiatives')
        .select('*');
      
      if (initiativesError) {
        throw new Error(`Error fetching ProductBoard initiatives: ${initiativesError.message}`);
      }
      
      // Fetch Azure DevOps epics
      const { data: epics, error: epicsError } = await supabase
        .from('ado_work_items')
        .select('*')
        .eq('type', 'Epic');
      
      if (epicsError) {
        throw new Error(`Error fetching Azure DevOps epics: ${epicsError.message}`);
      }
      
      setPbInitiatives(initiatives || []);
      setAdoEpics(epics || []);
      
      // Generate suggested initiative-epic mappings based on name similarity
      const suggestedMappings: InitiativeEpicMapping[] = [];
      
      initiatives?.forEach(initiative => {
        const initiativeName = initiative.title || initiative.name || '';
        
        // Find epics with similar names
        const matchingEpics = epics?.filter(epic => {
          const epicName = epic.title || epic.name || '';
          return epicName.toLowerCase().includes(initiativeName.toLowerCase()) || 
                 initiativeName.toLowerCase().includes(epicName.toLowerCase());
        });
        
        if (matchingEpics && matchingEpics.length > 0) {
          // Use the first matching epic
          const epic = matchingEpics[0];
          
          suggestedMappings.push({
            pb_initiative_id: initiative.id,
            pb_initiative_name: initiativeName,
            ado_epic_id: epic.id,
            ado_epic_name: epic.title || epic.name || '',
            manually_mapped: false,
            description: 'Auto-suggested mapping based on name similarity'
          });
        }
      });
      
      setSuggestedInitiativeMappings(suggestedMappings);
      
      // If there are suggested mappings and the current mapping doesn't have any initiative-epic mappings,
      // add the suggested mappings to the edited mapping
      if (suggestedMappings.length > 0 && editedMapping && editedMapping.initiative_epic_mappings.length === 0) {
        setEditedMapping({
          ...editedMapping,
          initiative_epic_mappings: suggestedMappings
        });
      }
      
    } catch (error) {
      console.error('Error fetching initiatives and epics:', error);
      setInitiativesError(error as Error);
    } finally {
      setIsLoadingInitiatives(false);
    }
  };
  
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Hierarchy Mapping Configuration</h1>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-2 border-b-transparent border-primary rounded-full"></div>
        </div>
      ) : isError ? (
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
      ) : !editedMapping ? (
        <Card>
          <CardHeader>
            <CardTitle>No Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              No hierarchy mappings found. Please create a new mapping.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={editedMapping.name}
                onChange={(e) => handleUpdateMappingInfo('name', e.target.value)}
                placeholder="Mapping Name"
              />
            </CardTitle>
            <CardDescription>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md"
                value={editedMapping.description || ''}
                onChange={(e) => handleUpdateMappingInfo('description', e.target.value)}
                placeholder="Mapping Description"
                rows={2}
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="pb-to-ado" 
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="pb-to-ado">PB to ADO Types</TabsTrigger>
                <TabsTrigger value="initiative-epic">Initiative/Epic Mapping</TabsTrigger>
                <TabsTrigger value="component-product">Component/Product Mapping</TabsTrigger>
                <TabsTrigger value="user-teams">User Team Mappings</TabsTrigger>
                <TabsTrigger value="enhanced-area-path">Area Path Mappings</TabsTrigger>
              </TabsList>
              
              {/* Component/Product Mapping Tab */}
              <TabsContent value="component-product">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Component/Product Mapping</h3>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddComponentProductMapping}
                        className="flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Mapping
                      </Button>
                    </div>
                  </div>
                  
                  {/* Explanation */}
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                    <h4 className="text-md font-medium mb-2 text-blue-700">About Component/Product Mappings</h4>
                    <p className="text-sm text-gray-600">
                      Component/Product mappings define how ProductBoard components should be mapped to Azure DevOps products.
                      Each mapping connects a ProductBoard component to an ADO product, which helps determine the correct area path
                      for features and stories.
                    </p>
                  </div>
                  
                  {/* Current Mappings */}
                  <div className="mt-4 border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-md font-medium text-gray-800">Current Component/Product Mappings</h4>
                    </div>
                    
                    {editedMapping?.component_product_mappings.length === 0 ? (
                      <div className="text-gray-500 text-sm p-2 bg-gray-50 rounded">
                        No component/product mappings created yet. Click "Add Mapping" to create a new mapping.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ProductBoard Component</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Product</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Unit</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {editedMapping?.component_product_mappings.map((mapping, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 text-xs">
                                  <div className="space-y-1">
                                    <div className="flex items-center">
                                      <span className="font-medium text-gray-500 w-24">ID:</span>
                                      <input
                                        type="text"
                                        className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                        value={mapping.component_id}
                                        onChange={(e) => handleUpdateComponentProductMapping(index, 'component_id', e.target.value)}
                                        placeholder="Component ID"
                                      />
                                    </div>
                                    <div className="flex items-center">
                                      <span className="font-medium text-gray-500 w-24">Name:</span>
                                      <input
                                        type="text"
                                        className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                        value={mapping.component_name}
                                        onChange={(e) => handleUpdateComponentProductMapping(index, 'component_name', e.target.value)}
                                        placeholder="Component Name"
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  <div className="space-y-1">
                                    <div className="flex items-center">
                                      <span className="font-medium text-gray-500 w-24">ID:</span>
                                      <input
                                        type="text"
                                        className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                        value={mapping.product_id}
                                        onChange={(e) => handleUpdateComponentProductMapping(index, 'product_id', e.target.value)}
                                        placeholder="Product ID"
                                      />
                                    </div>
                                    <div className="flex items-center">
                                      <span className="font-medium text-gray-500 w-24">Name:</span>
                                      <input
                                        type="text"
                                        className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                        value={mapping.product_name}
                                        onChange={(e) => handleUpdateComponentProductMapping(index, 'product_name', e.target.value)}
                                        placeholder="Product Name"
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  <input
                                    type="text"
                                    className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                    value={mapping.business_unit || ''}
                                    onChange={(e) => handleUpdateComponentProductMapping(index, 'business_unit', e.target.value)}
                                    placeholder="Business Unit"
                                  />
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  <input
                                    type="text"
                                    className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                    value={mapping.description || ''}
                                    onChange={(e) => handleUpdateComponentProductMapping(index, 'description', e.target.value)}
                                    placeholder="Description"
                                  />
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleRemoveComponentProductMapping(index)}
                                    className="text-red-500 p-1 h-auto"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* Initiative/Epic Mapping Tab */}
              <TabsContent value="initiative-epic">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Initiative/Epic Mapping</h3>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchInitiativesAndEpics}
                        disabled={isLoadingInitiatives}
                        className="flex items-center"
                      >
                        {isLoadingInitiatives ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-primary rounded-full"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Fetch Initiatives/Epics
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Display fetched data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ProductBoard Initiatives */}
                    <div className="border rounded-md p-4">
                      <h4 className="text-md font-medium mb-2 text-blue-700">ProductBoard Initiatives</h4>
                      {isLoadingInitiatives ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="animate-spin h-6 w-6 border-2 border-b-transparent border-blue-600 rounded-full"></div>
                        </div>
                      ) : pbInitiatives.length === 0 ? (
                        <div className="text-gray-500 text-sm p-2">
                          No ProductBoard initiatives found. Click "Fetch Initiatives/Epics" to load data.
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {pbInitiatives.map((initiative) => (
                                <tr key={initiative.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    <span className="font-mono">{initiative.id}</span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    {initiative.title || initiative.name}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-blue-600 p-1 h-auto"
                                      onClick={() => {
                                        // Find if this initiative is already mapped
                                        const existingMapping = editedMapping?.initiative_epic_mappings.find(
                                          m => m.pb_initiative_id === initiative.id
                                        );
                                        
                                        if (!existingMapping && editedMapping) {
                                          // Create a new mapping with just the PB side filled
                                          const newMapping: InitiativeEpicMapping = {
                                            pb_initiative_id: initiative.id,
                                            pb_initiative_name: initiative.title || initiative.name || '',
                                            ado_epic_id: 0,
                                            ado_epic_name: '',
                                            manually_mapped: true,
                                            description: 'Manually created mapping'
                                          };
                                          
                                          setEditedMapping({
                                            ...editedMapping,
                                            initiative_epic_mappings: [...editedMapping.initiative_epic_mappings, newMapping]
                                          });
                                        }
                                      }}
                                    >
                                      Add to Mapping
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    
                    {/* Azure DevOps Epics */}
                    <div className="border rounded-md p-4">
                      <h4 className="text-md font-medium mb-2 text-gray-700">Azure DevOps Epics</h4>
                      {isLoadingInitiatives ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="animate-spin h-6 w-6 border-2 border-b-transparent border-gray-600 rounded-full"></div>
                        </div>
                      ) : adoEpics.length === 0 ? (
                        <div className="text-gray-500 text-sm p-2">
                          No Azure DevOps epics found. Click "Fetch Initiatives/Epics" to load data.
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {adoEpics.map((epic) => (
                                <tr key={epic.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    <span className="font-mono">{epic.id}</span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    {epic.title || epic.name}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-gray-600 p-1 h-auto"
                                      onClick={() => {
                                        // Find if this epic is already mapped
                                        const existingMapping = editedMapping?.initiative_epic_mappings.find(
                                          m => m.ado_epic_id === epic.id
                                        );
                                        
                                        if (!existingMapping && editedMapping) {
                                          // Create a new mapping with just the ADO side filled
                                          const newMapping: InitiativeEpicMapping = {
                                            pb_initiative_id: '',
                                            pb_initiative_name: '',
                                            ado_epic_id: epic.id,
                                            ado_epic_name: epic.title || epic.name || '',
                                            manually_mapped: true,
                                            description: 'Manually created mapping'
                                          };
                                          
                                          setEditedMapping({
                                            ...editedMapping,
                                            initiative_epic_mappings: [...editedMapping.initiative_epic_mappings, newMapping]
                                          });
                                        }
                                      }}
                                    >
                                      Add to Mapping
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Suggested Mappings */}
                  {suggestedInitiativeMappings.length > 0 && (
                    <div className="mt-4 border rounded-md p-4 bg-yellow-50">
                      <h4 className="text-md font-medium mb-2 text-yellow-800">Suggested Mappings</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        These mappings were automatically suggested based on name similarity.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-yellow-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">PB Initiative</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ADO Epic</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {suggestedInitiativeMappings.map((mapping, index) => {
                              // Check if this suggestion is already in the edited mappings
                              const isAlreadyMapped = editedMapping?.initiative_epic_mappings.some(
                                m => m.pb_initiative_id === mapping.pb_initiative_id && 
                                     m.ado_epic_id === mapping.ado_epic_id
                              );
                              
                              return (
                                <tr key={index} className={isAlreadyMapped ? "bg-green-50" : "hover:bg-yellow-50"}>
                                  <td className="px-3 py-2 text-xs">
                                    <div className="font-medium">{mapping.pb_initiative_name}</div>
                                    <div className="text-gray-500 font-mono text-xs">{mapping.pb_initiative_id}</div>
                                  </td>
                                  <td className="px-3 py-2 text-xs">
                                    <div className="font-medium">{mapping.ado_epic_name}</div>
                                    <div className="text-gray-500 font-mono text-xs">{mapping.ado_epic_id}</div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    {isAlreadyMapped ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <Check className="h-3 w-3 mr-1" />
                                        Added
                                      </span>
                                    ) : (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-green-600 p-1 h-auto"
                                        onClick={() => {
                                          if (editedMapping) {
                                            setEditedMapping({
                                              ...editedMapping,
                                              initiative_epic_mappings: [...editedMapping.initiative_epic_mappings, {
                                                ...mapping,
                                                manually_mapped: false
                                              }]
                                            });
                                          }
                                        }}
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Confirm
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Current Mappings */}
                  <div className="mt-4 border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-md font-medium text-gray-800">Current Mappings</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddInitiativeEpicMapping}
                        className="flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Manual Mapping
                      </Button>
                    </div>
                    
                    {editedMapping?.initiative_epic_mappings.length === 0 ? (
                      <div className="text-gray-500 text-sm p-2 bg-gray-50 rounded">
                        No mappings created yet. Add mappings from the lists above or click "Add Manual Mapping".
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PB Initiative</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADO Epic</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {editedMapping?.initiative_epic_mappings.map((mapping, index) => (
                              <tr key={index} className={mapping.manually_mapped ? "bg-blue-50" : ""}>
                                <td className="px-3 py-2 text-xs">
                                  {mapping.pb_initiative_id ? (
                                    <>
                                      <div className="font-medium">{mapping.pb_initiative_name}</div>
                                      <div className="text-gray-500 font-mono text-xs">{mapping.pb_initiative_id}</div>
                                    </>
                                  ) : (
                                    <select
                                      className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                      value=""
                                      onChange={(e) => {
                                        const selectedInitiative = pbInitiatives.find(i => i.id === e.target.value);
                                        if (selectedInitiative && editedMapping) {
                                          const updatedMappings = [...editedMapping.initiative_epic_mappings];
                                          updatedMappings[index] = {
                                            ...updatedMappings[index],
                                            pb_initiative_id: selectedInitiative.id,
                                            pb_initiative_name: selectedInitiative.title || selectedInitiative.name || '',
                                            manually_mapped: true
                                          };
                                          setEditedMapping({
                                            ...editedMapping,
                                            initiative_epic_mappings: updatedMappings
                                          });
                                        }
                                      }}
                                    >
                                      <option value="">-- Select Initiative --</option>
                                      {pbInitiatives.map(initiative => (
                                        <option key={initiative.id} value={initiative.id}>
                                          {initiative.title || initiative.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  {mapping.ado_epic_id ? (
                                    <>
                                      <div className="font-medium">{mapping.ado_epic_name}</div>
                                      <div className="text-gray-500 font-mono text-xs">{mapping.ado_epic_id}</div>
                                    </>
                                  ) : (
                                    <select
                                      className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                      value=""
                                      onChange={(e) => {
                                        const selectedEpic = adoEpics.find(epic => epic.id === parseInt(e.target.value));
                                        if (selectedEpic && editedMapping) {
                                          const updatedMappings = [...editedMapping.initiative_epic_mappings];
                                          updatedMappings[index] = {
                                            ...updatedMappings[index],
                                            ado_epic_id: selectedEpic.id,
                                            ado_epic_name: selectedEpic.title || selectedEpic.name || '',
                                            manually_mapped: true
                                          };
                                          setEditedMapping({
                                            ...editedMapping,
                                            initiative_epic_mappings: updatedMappings
                                          });
                                        }
                                      }}
                                    >
                                      <option value="">-- Select Epic --</option>
                                      {adoEpics.map(epic => (
                                        <option key={epic.id} value={epic.id}>
                                          {epic.title || epic.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">
                                  {mapping.manually_mapped ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Manual
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Auto
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleRemoveInitiativeEpicMapping(index)}
                                    className="text-red-500 p-1 h-auto"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* User Team Mappings Tab */}
              <TabsContent value="user-teams">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">User Team Mappings</h3>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchPbUsersAndTeams}
                        disabled={isLoadingUsers || isLoadingAdoTeams}
                        className="flex items-center"
                      >
                        {isLoadingUsers || isLoadingAdoTeams ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-primary rounded-full"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Fetch Users/Teams
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Display fetched data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ProductBoard Users */}
                    <div className="border rounded-md p-4">
                      <h4 className="text-md font-medium mb-2 text-blue-700">ProductBoard Users</h4>
                      {isLoadingUsers ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="animate-spin h-6 w-6 border-2 border-b-transparent border-blue-600 rounded-full"></div>
                        </div>
                      ) : pbUsers.length === 0 ? (
                        <div className="text-gray-500 text-sm p-2">
                          No ProductBoard users found. Click "Fetch Users/Teams" to load data.
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {pbUsers.map((user) => (
                                <tr key={user.email} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    <span className="font-mono">{user.email}</span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-blue-600 p-1 h-auto"
                                      onClick={() => {
                                        // Find if this user is already mapped
                                        const existingMapping = editedMapping?.user_team_mappings.find(
                                          m => m.user_email === user.email
                                        );
                                        
                                        if (!existingMapping && editedMapping) {
                                          // Create a new mapping with just the user email filled
                                          const newMapping: UserTeamMapping = {
                                            user_email: user.email,
                                            team: '',
                                            business_unit: '',
                                            product_code: '',
                                            description: 'Manually created mapping'
                                          };
                                          
                                          setEditedMapping({
                                            ...editedMapping,
                                            user_team_mappings: [...editedMapping.user_team_mappings, newMapping]
                                          });
                                        }
                                      }}
                                    >
                                      Add to Mapping
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    
                    {/* Azure DevOps Teams */}
                    <div className="border rounded-md p-4">
                      <h4 className="text-md font-medium mb-2 text-gray-700">Azure DevOps Teams</h4>
                      {isLoadingAdoTeams ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="animate-spin h-6 w-6 border-2 border-b-transparent border-gray-600 rounded-full"></div>
                        </div>
                      ) : adoTeams.length === 0 ? (
                        <div className="text-gray-500 text-sm p-2">
                          No Azure DevOps teams found. Click "Fetch Users/Teams" to load data.
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {adoTeams.map((team) => (
                                <tr key={team.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    <span>{team.name}</span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-gray-600 p-1 h-auto"
                                      onClick={() => {
                                        // Find if this team is already mapped
                                        const existingMapping = editedMapping?.user_team_mappings.find(
                                          m => m.team === team.name
                                        );
                                        
                                        if (!existingMapping && editedMapping) {
                                          // Create a new mapping with just the team name filled
                                          const newMapping: UserTeamMapping = {
                                            user_email: '',
                                            team: team.name,
                                            business_unit: '',
                                            product_code: '',
                                            description: 'Manually created mapping'
                                          };
                                          
                                          setEditedMapping({
                                            ...editedMapping,
                                            user_team_mappings: [...editedMapping.user_team_mappings, newMapping]
                                          });
                                        }
                                      }}
                                    >
                                      Add to Mapping
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Suggested Mappings */}
                  {suggestedUserMappings.length > 0 && (
                    <div className="mt-4 border rounded-md p-4 bg-yellow-50">
                      <h4 className="text-md font-medium mb-2 text-yellow-800">Suggested User-Team Mappings</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        These mappings were automatically suggested based on name similarity.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-yellow-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">User Email</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Team</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {suggestedUserMappings.map((mapping, index) => {
                              // Check if this suggestion is already in the edited mappings
                              const isAlreadyMapped = editedMapping?.user_team_mappings.some(
                                m => m.user_email === mapping.user_email && 
                                     m.team === mapping.team
                              );
                              
                              return (
                                <tr key={index} className={isAlreadyMapped ? "bg-green-50" : "hover:bg-yellow-50"}>
                                  <td className="px-3 py-2 text-xs">
                                    <div className="font-mono">{mapping.user_email}</div>
                                  </td>
                                  <td className="px-3 py-2 text-xs">
                                    <div className="font-medium">{mapping.team}</div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                                    {isAlreadyMapped ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <Check className="h-3 w-3 mr-1" />
                                        Added
                                      </span>
                                    ) : (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-green-600 p-1 h-auto"
                                        onClick={() => {
                                          if (editedMapping) {
                                            setEditedMapping({
                                              ...editedMapping,
                                              user_team_mappings: [...editedMapping.user_team_mappings, mapping]
                                            });
                                          }
                                        }}
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Confirm
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Current Mappings */}
                  <div className="mt-4 border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-md font-medium text-gray-800">Current User-Team Mappings</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddUserTeamMapping}
                        className="flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Manual Mapping
                      </Button>
                    </div>
                    
                    {editedMapping?.user_team_mappings.length === 0 ? (
                      <div className="text-gray-500 text-sm p-2 bg-gray-50 rounded">
                        No mappings created yet. Add mappings from the lists above or click "Add Manual Mapping".
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Email</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Unit</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {editedMapping?.user_team_mappings.map((mapping, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 text-xs">
                                  {mapping.user_email ? (
                                    <div className="font-mono">{mapping.user_email}</div>
                                  ) : (
                                    <select
                                      className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                      value=""
                                      onChange={(e) => {
                                        if (editedMapping) {
                                          const updatedMappings = [...editedMapping.user_team_mappings];
                                          updatedMappings[index] = {
                                            ...updatedMappings[index],
                                            user_email: e.target.value
                                          };
                                          setEditedMapping({
                                            ...editedMapping,
                                            user_team_mappings: updatedMappings
                                          });
                                        }
                                      }}
                                    >
                                      <option value="">-- Select User --</option>
                                      {pbUsers.map(user => (
                                        <option key={user.email} value={user.email}>
                                          {user.email}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  {mapping.team ? (
                                    <div className="font-medium">{mapping.team}</div>
                                  ) : (
                                    <select
                                      className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                      value=""
                                      onChange={(e) => {
                                        if (editedMapping) {
                                          const updatedMappings = [...editedMapping.user_team_mappings];
                                          updatedMappings[index] = {
                                            ...updatedMappings[index],
                                            team: e.target.value
                                          };
                                          setEditedMapping({
                                            ...editedMapping,
                                            user_team_mappings: updatedMappings
                                          });
                                        }
                                      }}
                                    >
                                      <option value="">-- Select Team --</option>
                                      {adoTeams.map(team => (
                                        <option key={team.id} value={team.name}>
                                          {team.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  <input
                                    type="text"
                                    className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                    value={mapping.business_unit || ''}
                                    onChange={(e) => handleUpdateUserTeamMapping(index, 'business_unit', e.target.value)}
                                    placeholder="Business Unit"
                                  />
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  <input
                                    type="text"
                                    className="w-full p-1 border border-gray-300 rounded-md text-xs"
                                    value={mapping.product_code || ''}
                                    onChange={(e) => handleUpdateUserTeamMapping(index, 'product_code', e.target.value)}
                                    placeholder="Product Code"
                                  />
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleRemoveUserTeamMapping(index)}
                                    className="text-red-500 p-1 h-auto"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* ProductBoard to ADO Mappings Tab */}
              <TabsContent value="pb-to-ado">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">ProductBoard to ADO Mappings</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddPbToAdoMapping}
                      className="flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Mapping
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ProductBoard Level</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azure DevOps Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {editedMapping.pb_to_ado_mappings.map((mapping, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                className="p-2 border border-gray-300 rounded-md"
                                value={mapping.pb_level}
                                onChange={(e) => handleUpdatePbToAdoMapping(index, 'pb_level', e.target.value as any)}
                              >
                                <option value="initiative">Initiative</option>
                                <option value="feature">Feature</option>
                                <option value="subfeature">Sub-feature (Story)</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                className="p-2 border border-gray-300 rounded-md"
                                value={mapping.ado_type}
                                onChange={(e) => handleUpdatePbToAdoMapping(index, 'ado_type', e.target.value as any)}
                              >
                                <option value="Epic">Epic</option>
                                <option value="Feature">Feature</option>
                                <option value="User Story">User Story</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={mapping.description || ''}
                                onChange={(e) => handleUpdatePbToAdoMapping(index, 'description', e.target.value)}
                                placeholder="Description"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemovePbToAdoMapping(index)}
                                className="text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
              
              {/* Enhanced Area Path Mapping Tab */}
              <TabsContent value="enhanced-area-path">
                <SimpleAreaPathTab 
                  editedMapping={editedMapping}
                  setEditedMapping={setEditedMapping}
                  activeTab={activeTab}
                  handleAddAreaPathMapping={handleAddAreaPathMapping}
                  handleRemoveAreaPathMapping={handleRemoveAreaPathMapping}
                  handleUpdateAreaPathMapping={handleUpdateAreaPathMapping}
                />
              </TabsContent>

            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Mapping
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Detail Dialog */}
      <Dialog 
        open={isDetailDialogOpen} 
        onOpenChange={(open) => {
          setIsDetailDialogOpen(open);
          if (!open) setSelectedItem(null);
        }}
      >
        {selectedItem && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Item Details</DialogTitle>
              <DialogDescription>
                Complete information about the selected mapping item
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* ProductBoard Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-700 border-b pb-2">ProductBoard Information</h3>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">ID</h4>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.pbId}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Name</h4>
                  <p className="text-sm font-medium">{selectedItem.pbName}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Type</h4>
                  <p className="text-sm">
                    {selectedItem.pbType === 'subfeature' ? 'Story' : 
                     selectedItem.pbType.charAt(0).toUpperCase() + selectedItem.pbType.slice(1)}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Parent</h4>
                  <p className="text-sm">{selectedItem.pbParentName || 'None'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Parent ID</h4>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.pbParentId || 'None'}</p>
                </div>
              </div>
              
              {/* Current ADO Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Current Azure DevOps Information</h3>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">ID</h4>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.adoId}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Name</h4>
                  <p className="text-sm font-medium">{selectedItem.adoName}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Type</h4>
                  <p className="text-sm">{selectedItem.adoType}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Parent</h4>
                  <p className="text-sm">{selectedItem.adoParentName || 'None'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Parent ID</h4>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.adoParentId || 'None'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Area Path</h4>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.adoAreaPath}</p>
                </div>
              </div>
              
              {/* Expected ADO Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-yellow-700 border-b pb-2">Expected Azure DevOps Information</h3>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Type</h4>
                  <p className="text-sm">{selectedItem.expectedAdoType}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Parent</h4>
                  <p className="text-sm">{selectedItem.expectedAdoParentName || 'None'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Parent ID</h4>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.expectedAdoParentId || 'None'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Area Path</h4>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.expectedAreaPath}</p>
                </div>
              </div>
              
              {/* Match Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-700 border-b pb-2">Match Status</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Type Match</h4>
                    <div className="flex items-center mt-1">
                      {selectedItem.isTypeMatch ? (
                        <>
                          <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 h-6 w-6 mr-2">
                            <Check className="h-4 w-4" />
                          </span>
                          <span className="text-green-700 font-medium">Match</span>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-800 h-6 w-6 mr-2">
                            <X className="h-4 w-4" />
                          </span>
                          <span className="text-red-700 font-medium">Mismatch</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Parent Match</h4>
                    <div className="flex items-center mt-1">
                      {selectedItem.isParentMatch ? (
                        <>
                          <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 h-6 w-6 mr-2">
                            <Check className="h-4 w-4" />
                          </span>
                          <span className="text-green-700 font-medium">Match</span>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-800 h-6 w-6 mr-2">
                            <X className="h-4 w-4" />
                          </span>
                          <span className="text-red-700 font-medium">Mismatch</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Area Path Match</h4>
                    <div className="flex items-center mt-1">
                      {selectedItem.isAreaPathMatch ? (
                        <>
                          <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 h-6 w-6 mr-2">
                            <Check className="h-4 w-4" />
                          </span>
                          <span className="text-green-700 font-medium">Match</span>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-800 h-6 w-6 mr-2">
                            <X className="h-4 w-4" />
                          </span>
                          <span className="text-red-700 font-medium">Mismatch</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Overall Status</h4>
                    <div className="flex items-center mt-1">
                      {selectedItem.isFullMatch ? (
                        <>
                          <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 h-6 w-6 mr-2">
                            <Check className="h-4 w-4" />
                          </span>
                          <span className="text-green-700 font-medium">Full Match</span>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-800 h-6 w-6 mr-2">
                            <X className="h-4 w-4" />
                          </span>
                          <span className="text-red-700 font-medium">Partial/No Match</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
