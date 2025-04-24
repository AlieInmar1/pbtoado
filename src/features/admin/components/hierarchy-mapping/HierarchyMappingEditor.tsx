look at the grooming import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../../components/ui/shadcn/card';
import { Tabs, TabsContent } from '../../../../components/ui/shadcn/tabs';
import { Button } from '../../../../components/ui/shadcn/button';
import { ExternalLink } from 'lucide-react';
import { useHierarchyMappings } from '../../../../hooks/useHierarchyMappings';
import { HierarchyMappingConfig } from '../../../../lib/api/hierarchyMapping';
import { supabase } from '../../../../lib/supabase';
import { useNavigate } from 'react-router-dom';

// Import shared components
import MappingHeader from './MappingHeader';
import SaveFooter from './SaveFooter';
import TabNavigation from './TabNavigation';
import StateComponents from './StateComponents';
import DetailDialog from './DetailDialog';

// Import tab components
import PbToAdoMappingTab from './PbToAdoMappingTab';
import SimpleAreaPathTab from './SimpleAreaPathTab';
import InitiativeEpicMappingTab from './InitiativeEpicMappingTab';
import UserTeamMappingTab from './UserTeamMappingTab';
import ComponentProductMappingTab from './ComponentProductMappingTab';

/**
 * Component for editing hierarchy mappings between ProductBoard and Azure DevOps
 */
export const HierarchyMappingEditor: React.FC = () => {
  const navigate = useNavigate();
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
  const [adoTeams, setAdoTeams] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [isLoadingAdoTeams, setIsLoadingAdoTeams] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<Error | null>(null);
  const [adoTeamsError, setAdoTeamsError] = useState<Error | null>(null);
  
  // State for auto-fetched initiatives and epics
  const [pbInitiatives, setPbInitiatives] = useState<any[]>([]);
  const [adoEpics, setAdoEpics] = useState<any[]>([]);
  const [isLoadingInitiatives, setIsLoadingInitiatives] = useState<boolean>(false);
  const [initiativesError, setInitiativesError] = useState<Error | null>(null);
  
  // State for suggested mappings
  const [suggestedUserMappings, setSuggestedUserMappings] = useState<any[]>([]);
  const [suggestedInitiativeMappings, setSuggestedInitiativeMappings] = useState<any[]>([]);
  
  // State for the currently selected tab
  const [activeTab, setActiveTab] = useState<string>('pb-to-ado');
  
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
  
  // Set the first mapping as selected when mappings are loaded
  useEffect(() => {
    if (mappings && mappings.length > 0 && !selectedMapping) {
      setSelectedMapping(mappings[0]);
      setEditedMapping(JSON.parse(JSON.stringify(mappings[0]))); // Deep copy
    }
  }, [mappings, selectedMapping]);
  
  // Handle saving the mapping
  const handleSave = () => {
    if (editedMapping) {
      saveMapping(editedMapping);
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
  
  // PbToAdoMapping handlers
  const handleAddPbToAdoMapping = () => {
    if (editedMapping) {
      const newMapping: { pb_level: 'feature' | 'initiative' | 'subfeature', ado_type: 'Feature' | 'Epic' | 'User Story', description: string } = {
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
  
  const handleUpdatePbToAdoMapping = (index: number, field: any, value: string) => {
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
  
  // AreaPathMapping handlers
  const handleAddAreaPathMapping = () => {
    if (editedMapping) {
      const newMapping: { mapping_type: 'epic' | 'feature' | 'story', business_unit: string, product_code: string, team: string, area_path: string, description: string } = {
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
  
  const handleUpdateAreaPathMapping = (index: number, field: any, value: string) => {
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
  
  // InitiativeEpicMapping handlers
  const handleAddInitiativeEpicMapping = () => {
    if (editedMapping) {
      const newMapping = {
        pb_initiative_id: '',
        pb_initiative_name: '',
        ado_epic_id: 0,
        ado_epic_name: '',
        ado_business_unit: '',
        manually_mapped: true,
        description: 'New initiative-epic mapping'
      };
      
      setEditedMapping({
        ...editedMapping,
        initiative_epic_mappings: [...editedMapping.initiative_epic_mappings, newMapping]
      });
    }
  };
  
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
  
  const handleUpdateInitiativeEpicMapping = (
    index: number, 
    field: any, 
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
  
  // UserTeamMapping handlers
  const handleAddUserTeamMapping = () => {
    if (editedMapping) {
      const newMapping = {
        user_email: '',
        team: '',
        business_unit: '',
        product_code: '',
        pb_product_id: '',
        pb_product_name: '',
        pb_component_id: '',
        pb_component_name: '',
        description: 'New user team mapping'
      };
      
      setEditedMapping({
        ...editedMapping,
        user_team_mappings: [...editedMapping.user_team_mappings, newMapping]
      });
    }
  };
  
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
  
  const handleUpdateUserTeamMapping = (
    index: number, 
    field: any, 
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
  
  // ComponentProductMapping handlers
  const handleAddComponentProductMapping = () => {
    if (editedMapping) {
      const newMapping = {
        component_id: '',
        component_name: '',
        product_id: '',
        product_name: '',
        business_unit: '',
        ado_product: '',
        description: 'New component-product mapping'
      };
      
      setEditedMapping({
        ...editedMapping,
        component_product_mappings: [...editedMapping.component_product_mappings, newMapping]
      });
    }
  };
  
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
  
  const handleUpdateComponentProductMapping = (
    index: number, 
    field: any, 
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
      
    } catch (error) {
      console.error('Error fetching initiatives and epics:', error);
      setInitiativesError(error as Error);
    } finally {
      setIsLoadingInitiatives(false);
    }
  };
  
  // Load users and teams when the user team mapping tab is selected
  useEffect(() => {
    if (activeTab === 'user-team' && !isLoadingUsers && pbUsers.length === 0) {
      fetchPbUsersAndTeams();
    }
  }, [activeTab, isLoadingUsers, pbUsers.length]);
  
  // Load initiatives and epics when the initiative-epic mapping tab is selected
  useEffect(() => {
    if (activeTab === 'initiative-epic' && !isLoadingInitiatives && pbInitiatives.length === 0) {
      fetchInitiativesAndEpics();
    }
  }, [activeTab, isLoadingInitiatives, pbInitiatives.length]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Hierarchy Mapping Configuration</h1>
      </div>
      
      {/* Loading and Error States */}
      <StateComponents 
        isLoading={isLoading} 
        isError={isError} 
        error={error} 
      />
      
      {!isLoading && !isError && !editedMapping ? (
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
      ) : !isLoading && !isError && editedMapping && (
        <Card>
          <CardHeader>
            <MappingHeader 
              editedMapping={editedMapping} 
              handleUpdateMappingInfo={handleUpdateMappingInfo} 
            />
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="pb-to-ado" 
              onValueChange={setActiveTab}
            >
              <TabNavigation 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
              />
              
              {/* ProductBoard to ADO Mappings Tab */}
              <TabsContent value="pb-to-ado">
                <PbToAdoMappingTab 
                  editedMapping={editedMapping}
                  setEditedMapping={setEditedMapping}
                  activeTab={activeTab}
                  handleAddPbToAdoMapping={handleAddPbToAdoMapping}
                  handleRemovePbToAdoMapping={handleRemovePbToAdoMapping}
                  handleUpdatePbToAdoMapping={handleUpdatePbToAdoMapping}
                />
              </TabsContent>
              
              
              {/* Initiative/Epic Mapping Tab */}
              <TabsContent value="initiative-epic">
                <InitiativeEpicMappingTab 
                  editedMapping={editedMapping}
                  setEditedMapping={setEditedMapping}
                  activeTab={activeTab}
                  pbInitiatives={pbInitiatives}
                  adoEpics={adoEpics}
                  isLoadingInitiatives={isLoadingInitiatives}
                  initiativesError={initiativesError}
                  suggestedInitiativeMappings={suggestedInitiativeMappings}
                  handleAddInitiativeEpicMapping={handleAddInitiativeEpicMapping}
                  handleRemoveInitiativeEpicMapping={handleRemoveInitiativeEpicMapping}
                  handleUpdateInitiativeEpicMapping={handleUpdateInitiativeEpicMapping}
                  fetchInitiativesAndEpics={fetchInitiativesAndEpics}
                />
              </TabsContent>
              
              {/* User/Team Mapping Tab */}
              <TabsContent value="user-team">
                <UserTeamMappingTab 
                  editedMapping={editedMapping}
                  setEditedMapping={setEditedMapping}
                  activeTab={activeTab}
                  pbUsers={pbUsers}
                  adoTeams={adoTeams}
                  isLoadingUsers={isLoadingUsers}
                  isLoadingAdoTeams={isLoadingAdoTeams}
                  usersError={usersError}
                  adoTeamsError={adoTeamsError}
                  suggestedUserMappings={suggestedUserMappings}
                  handleAddUserTeamMapping={handleAddUserTeamMapping}
                  handleRemoveUserTeamMapping={handleRemoveUserTeamMapping}
                  handleUpdateUserTeamMapping={handleUpdateUserTeamMapping}
                  fetchPbUsersAndTeams={fetchPbUsersAndTeams}
                />
              </TabsContent>
              
              {/* Component/Product Mapping Tab */}
              <TabsContent value="component-product">
                <ComponentProductMappingTab 
                  editedMapping={editedMapping}
                  setEditedMapping={setEditedMapping}
                  activeTab={activeTab}
                  handleAddComponentProductMapping={handleAddComponentProductMapping}
                  handleRemoveComponentProductMapping={handleRemoveComponentProductMapping}
                  handleUpdateComponentProductMapping={handleUpdateComponentProductMapping}
                />
              </TabsContent>
              
              {/* Area Path Mapping Tab */}
              <TabsContent value="area-paths">
                <SimpleAreaPathTab 
                  editedMapping={editedMapping}
                  setEditedMapping={setEditedMapping}
                  activeTab={activeTab}
                />
              </TabsContent>
            </Tabs>
            
            {/* View Mapping Results Button */}
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => navigate('/admin/mapping-results')}
                className="flex items-center gap-2"
              >
                View Mapping Results <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <SaveFooter 
              handleSave={handleSave} 
              isSaving={isSaving} 
            />
          </CardFooter>
        </Card>
      )}
      
      {/* Detail Dialog */}
      <DetailDialog 
        isDetailDialogOpen={isDetailDialogOpen}
        setIsDetailDialogOpen={setIsDetailDialogOpen}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
      />
    </div>
  );
};

export default HierarchyMappingEditor;
