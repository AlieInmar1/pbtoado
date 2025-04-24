import React from 'react';
import { Button } from '../../../../components/ui/shadcn/button';
import { Plus, Trash2, RefreshCw, Check } from 'lucide-react';
import { UserTeamMappingTabProps } from './types';
import useUsers from '../../../../hooks/useUsers';
import useProducts from '../../../../hooks/useProducts';

/**
 * UserTeamMappingTab component for managing user team mappings
 */
export const UserTeamMappingTab: React.FC<UserTeamMappingTabProps> = ({ 
  editedMapping,
  setEditedMapping,
  activeTab,
  pbUsers,
  adoTeams,
  isLoadingUsers,
  isLoadingAdoTeams,
  usersError,
  adoTeamsError,
  suggestedUserMappings,
  fetchPbUsersAndTeams,
  handleAddUserTeamMapping,
  handleRemoveUserTeamMapping,
  handleUpdateUserTeamMapping
}) => {
  // Initialize hooks for ProductBoard users and products
  const { users: dbUsers } = useUsers();
  const { products } = useProducts();
  
  // Log the data from hooks for debugging
  React.useEffect(() => {
    console.log('ProductBoard users from DB:', dbUsers);
    console.log('ProductBoard products from DB:', products);
  }, [dbUsers, products]);
  
  if (!editedMapping || activeTab !== 'user-teams') return null;
  
  return (
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
                              const newMapping = {
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
                              const newMapping = {
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
        
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-4">
          <h4 className="text-md font-medium mb-2 text-blue-700">Enhanced Story Mappings</h4>
          <p className="text-sm text-gray-600">
            For stories, you can now select a user, product, and component from ProductBoard and map them to a team in Azure DevOps.
            This allows for more precise control over how stories are mapped between the two systems.
          </p>
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
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="text-xs font-medium text-gray-500 w-16">Product:</span>
                          <select
                            className="w-full p-1 border border-gray-300 rounded-md text-xs"
                            value={mapping.pb_product_id || ''}
                            onChange={(e) => {
                              if (editedMapping) {
                                const updatedMappings = [...editedMapping.user_team_mappings];
                                const selectedProduct = { id: e.target.value, name: e.target.options[e.target.selectedIndex].text };
                                updatedMappings[index] = {
                                  ...updatedMappings[index],
                                  pb_product_id: selectedProduct.id,
                                  pb_product_name: selectedProduct.name,
                                  product_code: selectedProduct.name // For backward compatibility
                                };
                                setEditedMapping({
                                  ...editedMapping,
                                  user_team_mappings: updatedMappings
                                });
                              }
                            }}
                          >
                            <option value="">-- Select Product --</option>
                            {/* Use real products from the useProducts hook */}
                            {products?.map(product => (
                              <option key={product.id} value={product.productboard_id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs font-medium text-gray-500 w-16">Component:</span>
                          <select
                            className="w-full p-1 border border-gray-300 rounded-md text-xs"
                            value={mapping.pb_component_id || ''}
                            onChange={(e) => {
                              if (editedMapping) {
                                const updatedMappings = [...editedMapping.user_team_mappings];
                                const selectedComponent = { id: e.target.value, name: e.target.options[e.target.selectedIndex].text };
                                updatedMappings[index] = {
                                  ...updatedMappings[index],
                                  pb_component_id: selectedComponent.id,
                                  pb_component_name: selectedComponent.name
                                };
                                setEditedMapping({
                                  ...editedMapping,
                                  user_team_mappings: updatedMappings
                                });
                              }
                            }}
                          >
                            <option value="">-- Select Component --</option>
                            <option value="1648">Audit</option>
                            <option value="2032">CDTB</option>
                            <option value="1649">CM</option>
                            <option value="1685">HC Intel</option>
                            <option value="1686">Healthcare</option>
                            <option value="1683">MedEx</option>
                          </select>
                        </div>
                      </div>
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
  );
};

export default UserTeamMappingTab;
