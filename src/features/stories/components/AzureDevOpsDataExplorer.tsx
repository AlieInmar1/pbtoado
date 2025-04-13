import React, { useState, useMemo, ErrorInfo, Component } from 'react';
import { useAzureDevOpsHierarchy } from '../../../hooks/useAzureDevOpsHierarchy';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/shadcn/card';
import { Button } from '../../../components/ui/shadcn/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/shadcn/tabs';
import { RefreshCw, ChevronRight, ChevronDown, X, Filter, AlertTriangle } from 'lucide-react';

// Error boundary to catch rendering errors
class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Error Rendering Component
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500 mb-4">
              {this.state.error?.message || "An unknown error occurred"}
            </p>
            <Button 
              variant="outline" 
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Wrap the main component with ErrorBoundary
export const AzureDevOpsDataExplorer: React.FC = () => {
  return (
    <ErrorBoundary>
      <AzureDevOpsDataExplorerContent />
    </ErrorBoundary>
  );
};

// Main component content
const AzureDevOpsDataExplorerContent: React.FC = () => {
  const { 
    hierarchy, 
    areaPaths, 
    teams, 
    teamAreaPaths, 
    workItemTypes,
    isLoading, 
    error, 
    refetch 
  } = useAzureDevOpsHierarchy();
  
  // State for expanded items in the tree view
  const [expandedEpics, setExpandedEpics] = useState<Record<string, boolean>>({});
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  
  // State for area path filtering
  const [selectedAreaPath, setSelectedAreaPath] = useState<string>('');
  
  // Filter stories based on area path
  const filteredHierarchy = useMemo(() => {
    if (!hierarchy || !selectedAreaPath) {
      return hierarchy; // Return unfiltered hierarchy if no filter or no data
    }
    
    // Create a map of story IDs that match the filter
    const matchingStoryIds = new Set<number>();
    hierarchy.stories.forEach((story: any) => {
      // Try to get fields from raw_data if fields is missing
      const fields = story?.fields || (story?.raw_data && story.raw_data.fields) || null;
      const areaPath = fields?.['System.AreaPath'] || story?.area_path || null;
      
      // Safely check if story has fields and the area path matches
      if (story && areaPath === selectedAreaPath) {
        matchingStoryIds.add(story.id);
      }
    });

    // Get features that have at least one matching story
    const featuresWithMatchingStories: Record<number, any> = {};
    for (const [featureId, feature] of Object.entries(hierarchy.features)) {
      // Use explicit typing to avoid TypeScript spread errors
      const featureObj = feature as Record<string, any>;
      const featureWithFilteredStories = {
        id: featureObj.id,
        fields: featureObj.fields,
        relations: featureObj.relations,
        stories: featureObj.stories?.filter((storyId: number) => matchingStoryIds.has(storyId)) || []
      };
      
      if (featureWithFilteredStories.stories.length > 0) {
        featuresWithMatchingStories[Number(featureId)] = featureWithFilteredStories;
      }
    }
    
    // Get epics that have at least one matching feature
    const epicsWithMatchingFeatures: Record<number, any> = {};
    for (const [epicId, epic] of Object.entries(hierarchy.epics)) {
      // Use explicit typing to avoid TypeScript spread errors
      const epicObj = epic as Record<string, any>;
      const epicWithFilteredFeatures = {
        id: epicObj.id,
        fields: epicObj.fields,
        relations: epicObj.relations,
        features: epicObj.features?.filter((featureId: number) => 
          featuresWithMatchingStories[featureId]
        ) || []
      };
      
      if (epicWithFilteredFeatures.features.length > 0) {
        epicsWithMatchingFeatures[Number(epicId)] = epicWithFilteredFeatures;
      }
    }
    
    // Return a safe copy with our filtered epic and feature records
    return hierarchy ? {
      ...hierarchy,
      epics: epicsWithMatchingFeatures,
      features: featuresWithMatchingStories,
      // Keep original stories array, we'll filter during rendering
    } : null;
  }, [hierarchy, selectedAreaPath]);
  
  // Toggle expanded state for an epic
  const toggleEpic = (epicId: string) => {
    setExpandedEpics(prev => ({
      ...prev,
      [epicId]: !prev[epicId]
    }));
  };
  
  // Toggle expanded state for a feature
  const toggleFeature = (featureId: string) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Azure DevOps Data Explorer</h1>
        <div className="flex items-center gap-4">
          {/* Area Path Filter */}
          <div className="relative inline-block min-w-[250px]">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-1 text-gray-500" />
              <select
                className="border border-gray-300 rounded-md py-1 px-3 pr-8 appearance-none bg-white text-gray-700 w-full"
                value={selectedAreaPath}
                onChange={(e) => setSelectedAreaPath(e.target.value)}
                disabled={isLoading || areaPaths.length === 0}
              >
                <option value="">All Area Paths</option>
                {areaPaths.map((areaPath: any) => (
                  <option key={areaPath.id} value={areaPath.path}>
                    {areaPath.path}
                  </option>
                ))}
              </select>
              {selectedAreaPath && (
                <button 
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedAreaPath('')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/stories'}
          >
            Back to Stories
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/stories/azure-devops'}
          >
            View Basic Explorer
          </Button>
          <Button 
            variant="default"
            disabled={isLoading}
            onClick={() => refetch()}
          >
            {isLoading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>
      
      {error ? (
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
      ) : (
        <Tabs defaultValue="hierarchy">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
            <TabsTrigger value="areaPaths">Area Paths</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="workItemTypes">Work Item Types</TabsTrigger>
            <TabsTrigger value="rawData">Raw Data</TabsTrigger>
          </TabsList>
          
          {/* Hierarchy Tab */}
          <TabsContent value="hierarchy">
            <Card>
              <CardHeader>
                <CardTitle>Work Item Hierarchy</CardTitle>
                <CardDescription>
                  Epics → Features → User Stories
                  {selectedAreaPath && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Filtered by: {selectedAreaPath}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin h-8 w-8 border-2 border-b-transparent border-primary rounded-full"></div>
                  </div>
                ) : !filteredHierarchy ? (
                  <div className="text-gray-500 p-4">
                    No hierarchy data available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.values(filteredHierarchy.epics).map((epic: any) => (
                      <div key={epic.id} className="border rounded-md overflow-hidden">
                        <div 
                          className="flex items-center p-3 bg-gray-50 cursor-pointer"
                          onClick={() => toggleEpic(epic.id)}
                        >
                          {expandedEpics[epic.id] ? (
                            <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
                          )}
                          <div className="flex-1">
                            {/* Try to get fields from raw_data if fields is missing */}
                            {(() => {
                              // Extract fields from raw_data if available
                              const fields = epic.fields || (epic.raw_data && epic.raw_data.fields) || null;
                              
                              if (!fields) {
                                return <div className="font-medium text-red-700">Missing Epic Fields</div>;
                              }
                              
                              return (
                                <>
                                  <div className="font-medium">{fields['System.Title'] || epic.title || 'Untitled Epic'}</div>
                                  <div className="text-sm text-gray-500">
                                    Epic • {fields['System.State'] || epic.state || 'Unknown State'} • {fields['System.AreaPath'] || epic.area_path || 'Unknown Area Path'}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {epic.features?.length || 0} features
                          </div>
                        </div>
                        
                        {expandedEpics[epic.id] && (
                          <div className="pl-8 pr-3 py-2 border-t">
                            {epic.features?.length > 0 ? (
                              <div className="space-y-2">
                                {epic.features.map((featureId: number) => {
                                  const feature = hierarchy.features[featureId];
                                  if (!feature) return null;
                                  
                                  return (
                                    <div key={feature.id} className="border rounded-md overflow-hidden">
                                      <div 
                                        className="flex items-center p-3 bg-gray-50 cursor-pointer"
                                        onClick={() => toggleFeature(feature.id)}
                                      >
                                        {expandedFeatures[feature.id] ? (
                                          <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
                                        )}
                                        <div className="flex-1">
                                          {/* Try to get fields from raw_data if fields is missing */}
                                          {(() => {
                                            // Extract fields from raw_data if available
                                            const fields = feature.fields || (feature.raw_data && feature.raw_data.fields) || null;
                                            
                                            if (!fields) {
                                              return <div className="font-medium text-red-700">Missing Feature Fields</div>;
                                            }
                                            
                                            return (
                                              <>
                                                <div className="font-medium">{fields['System.Title'] || feature.title || 'Untitled Feature'}</div>
                                                <div className="text-sm text-gray-500">
                                                  Feature • {fields['System.State'] || feature.state || 'Unknown State'} • {fields['System.AreaPath'] || feature.area_path || 'Unknown Area Path'}
                                                </div>
                                              </>
                                            );
                                          })()}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {feature.stories?.length || 0} stories
                                        </div>
                                      </div>
                                      
                                      {expandedFeatures[feature.id] && (
                                        <div className="pl-8 pr-3 py-2 border-t">
                                          {feature.stories?.length > 0 ? (
                                            <div className="space-y-2">
                                              {feature.stories.map((storyId: number) => {
                                                const story = hierarchy.stories.find((s: any) => s.id === storyId);
                                                
                                                // Try to get fields from raw_data if fields is missing
                                                const fields = story?.fields || (story?.raw_data && story.raw_data.fields) || null;
                                                
                                                if (!story || !fields) {
                                                  console.warn(`Story data or fields not found for ID: ${storyId}`, story);
                                                  return (
                                                    <div key={`missing-${storyId}`} className="p-3 border rounded-md border-dashed border-red-300 bg-red-50">
                                                      <div className="font-medium text-red-700">Incomplete Story Data (ID: {storyId})</div>
                                                      <div className="text-sm text-red-500">This story might be missing fields or is inaccessible.</div>
                                                    </div>
                                                  );
                                                }
                                                
                                                return (
                                                  <div key={story.id} className="p-3 border rounded-md">
                                                    <div className="font-medium">{fields['System.Title'] || story.title || 'Untitled Story'}</div>
                                                    <div className="text-sm text-gray-500">
                                                      User Story • {fields['System.State'] || story.state || 'Unknown State'} • {fields['System.AreaPath'] || story.area_path || 'Unknown Area Path'}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div className="text-gray-500 p-2">
                                              No stories found
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-gray-500 p-2">
                                No features found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Area Paths Tab */}
          <TabsContent value="areaPaths">
            <Card>
              <CardHeader>
                <CardTitle>Area Paths</CardTitle>
                <CardDescription>
                  All area paths in the project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin h-8 w-8 border-2 border-b-transparent border-primary rounded-full"></div>
                  </div>
                ) : areaPaths.length === 0 ? (
                  <div className="text-gray-500 p-4">
                    No area paths found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {areaPaths.map((areaPath: any) => (
                          <tr key={areaPath.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {areaPath.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {areaPath.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {areaPath.path}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Teams Tab */}
          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle>Teams</CardTitle>
                <CardDescription>
                  All teams in the project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin h-8 w-8 border-2 border-b-transparent border-primary rounded-full"></div>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="text-gray-500 p-4">
                    No teams found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teams.map((team: any) => (
                          <tr key={team.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {team.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {team.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {team.description || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Work Item Types Tab */}
          <TabsContent value="workItemTypes">
            <Card>
              <CardHeader>
                <CardTitle>Work Item Types</CardTitle>
                <CardDescription>
                  Available work item types in the project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin h-8 w-8 border-2 border-b-transparent border-primary rounded-full"></div>
                  </div>
                ) : workItemTypes.length === 0 ? (
                  <div className="text-gray-500 p-4">
                    No work item types found
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {workItemTypes.map((type: any) => (
                      <div key={type.id} className="p-4 border rounded-md">
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-gray-500">
                          {type.description || 'No description'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Raw Data Tab */}
          <TabsContent value="rawData">
            <Card>
              <CardHeader>
                <CardTitle>Raw Data</CardTitle>
                <CardDescription>
                  Raw JSON data from Azure DevOps (for debugging)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="hierarchyData">
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="hierarchyData">Hierarchy</TabsTrigger>
                    <TabsTrigger value="areaPathsData">Area Paths</TabsTrigger>
                    <TabsTrigger value="teamsData">Teams</TabsTrigger>
                    <TabsTrigger value="workItemTypesData">Work Item Types</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="hierarchyData">
                    <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                      <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded">
                        <h4 className="font-medium text-yellow-800">Hierarchy Structure Debug Info:</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Epics: {hierarchy ? Object.keys(hierarchy.epics).length : 0} | 
                          Features: {hierarchy ? Object.keys(hierarchy.features).length : 0} | 
                          Stories: {hierarchy ? hierarchy.stories.length : 0}
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          First Epic Fields: {hierarchy && Object.values(hierarchy.epics).length > 0 
                            ? (Object.values(hierarchy.epics)[0] as any).fields 
                              ? 'Has fields' 
                              : 'Missing fields' 
                            : 'No epics'}
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          First Epic Features: {hierarchy && Object.values(hierarchy.epics).length > 0 
                            ? ((Object.values(hierarchy.epics)[0] as any).features?.length || 0) + ' features'
                            : 'No features'}
                        </p>
                        {hierarchy && Object.values(hierarchy.epics).length > 0 && (Object.values(hierarchy.epics)[0] as any).features?.length > 0 && (
                          <p className="text-sm text-yellow-700 mt-1">
                            First Feature: {
                              (() => {
                                const firstEpic = Object.values(hierarchy.epics)[0] as any;
                                const firstFeatureId = firstEpic.features[0];
                                const firstFeature = hierarchy.features[firstFeatureId];
                                return firstFeature 
                                  ? `ID: ${firstFeature.id}, Has fields: ${firstFeature.fields ? 'Yes' : 'No'}, Stories: ${firstFeature.stories?.length || 0}`
                                  : 'Not found';
                              })()
                            }
                          </p>
                        )}
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                          <h4 className="font-medium text-red-800">Hierarchy Relationships:</h4>
                          <p className="text-sm text-red-700 mt-1">
                            featureToEpic: {hierarchy && hierarchy.featureToEpic ? Object.keys(hierarchy.featureToEpic).length : 0} mappings
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            storyToFeature: {hierarchy && hierarchy.storyToFeature ? Object.keys(hierarchy.storyToFeature).length : 0} mappings
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            First 3 epics with features: {
                              (() => {
                                if (!hierarchy || !hierarchy.epics) return 'No epics';
                                
                                const epicsWithFeatures = Object.values(hierarchy.epics)
                                  .filter((epic: any) => epic.features && epic.features.length > 0)
                                  .slice(0, 3)
                                  .map((epic: any) => `Epic ${epic.id}: ${epic.features.length} features`);
                                
                                return epicsWithFeatures.length > 0 
                                  ? epicsWithFeatures.join(', ') 
                                  : 'None found';
                              })()
                            }
                          </p>
                        </div>
                      </div>
                      <pre className="text-xs">
                        {JSON.stringify(hierarchy, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="areaPathsData">
                    <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                      <pre className="text-xs">
                        {JSON.stringify(areaPaths, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="teamsData">
                    <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                      <pre className="text-xs">
                        {JSON.stringify(teams, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="workItemTypesData">
                    <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                      <pre className="text-xs">
                        {JSON.stringify(workItemTypes, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
