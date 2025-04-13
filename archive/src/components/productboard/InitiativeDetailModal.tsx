import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  CodeBracketIcon, 
  DocumentTextIcon, 
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  PuzzlePieceIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { ProductBoardClient, ProductBoardInitiative, ProductBoardFeature, ProductBoardObjective } from '../../lib/api/productboard';

interface InitiativeWithFeatures extends ProductBoardInitiative {
  features?: ProductBoardFeature[];
  objectives?: ProductBoardObjective[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

type TabType = 'overview' | 'features' | 'objectives' | 'raw' | 'raw_data';

interface InitiativeDetailModalProps {
  initiative: InitiativeWithFeatures | null;
  isOpen: boolean;
  onClose: () => void;
  showRawJson: boolean;
  setShowRawJson: (show: boolean) => void;
  onParentClick?: (parentId: string, parentType: string) => void;
  onFeatureClick?: (feature: ProductBoardFeature) => void;
  client?: ProductBoardClient | null;
}

export function InitiativeDetailModal({ 
  initiative, 
  isOpen, 
  onClose, 
  showRawJson, 
  setShowRawJson,
  onParentClick,
  onFeatureClick,
  client
}: InitiativeDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoadingObjectives, setIsLoadingObjectives] = useState(false);
  const [objectives, setObjectives] = useState<ProductBoardObjective[]>([]);
  const [objectivesError, setObjectivesError] = useState<string | null>(null);
  
  // Raw API response data for debugging
  const [rawFeaturesResponse, setRawFeaturesResponse] = useState<any>(null);
  const [rawObjectivesResponse, setRawObjectivesResponse] = useState<any>(null);
  const [featuresApiInfo, setFeaturesApiInfo] = useState<{
    url: string;
    timestamp: string;
    status?: number;
    error?: string;
  } | null>(null);
  const [objectivesApiInfo, setObjectivesApiInfo] = useState<{
    url: string;
    timestamp: string;
    status?: number;
    error?: string;
  } | null>(null);

  // Reset state when modal is opened or initiative changes
  useEffect(() => {
    if (isOpen && initiative) {
      // Set default tab
      setActiveTab(showRawJson ? 'raw' : 'overview');
      
      // Reset objectives state
      setObjectives([]);
      setObjectivesError(null);
      setIsLoadingObjectives(false);
      
      // Clear any cached objectives in the initiative object to force a fresh load
      if (initiative.objectives) {
        initiative.objectives = undefined;
      }
    }
  }, [isOpen, initiative, showRawJson]);

  // Load features when the modal is opened with an initiative
  useEffect(() => {
    const loadFeaturesForInitiative = async () => {
      if (isOpen && initiative && client && !initiative.features) {
        try {
          console.log(`Loading features for initiative ${initiative.id}`);
          
          // Record API call start time
          const startTime = new Date();
          
          // Create URL for tracking
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-productboard-initiative-features`;
          
          // Update API info before the call
          setFeaturesApiInfo({
            url,
            timestamp: startTime.toISOString(),
          });
          
          // Make the API call
          const response = await fetch(
            url,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                api_key: client.getApiKey(),
                initiative_id: initiative.id
              }),
            }
          );
          
          // Parse the response
          const data = await response.json();
          
          // Store the raw response
          setRawFeaturesResponse(data);
          
          // Update API info with status
          setFeaturesApiInfo(prev => ({
            ...prev!,
            status: response.status,
            error: data.error || undefined,
          }));
          
          console.log(`Raw features response:`, data);
          
          if (!response.ok || !data.success) {
            throw new Error(data.error || `Failed to fetch features for initiative ${initiative.id}`);
          }
          
          const features = data.data.data || [];
          console.log(`Loaded ${features.length} features for initiative ${initiative.id}`);
          
          // Update the initiative object with the features
          if (initiative) {
            initiative.features = features;
          }
        } catch (error) {
          console.error(`Error loading features for initiative ${initiative.id}:`, error);
          
          // Update API info with error
          setFeaturesApiInfo(prev => ({
            ...prev!,
            error: error instanceof Error ? error.message : String(error),
          }));
        }
      }
    };
    
    loadFeaturesForInitiative();
  }, [isOpen, initiative, client]);

  // Load objectives when objectives tab is selected
  useEffect(() => {
    if (activeTab === 'objectives' && initiative && client && !isLoadingObjectives) {
      setIsLoadingObjectives(true);
      setObjectivesError(null);
      
      console.log(`Loading objectives for initiative ${initiative.id}`);
      
      // Record API call start time
      const startTime = new Date();
      
      // Create URL for tracking
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-productboard-objectives`;
      
      // Update API info before the call
      setObjectivesApiInfo({
        url,
        timestamp: startTime.toISOString(),
      });
      
      // Make the API call
      fetch(
        url,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            api_key: client.getApiKey(),
            initiative_id: initiative.id
          }),
        }
      )
      .then(response => {
        // Store the status code
        const status = response.status;
        
        // Parse the response
        return response.json().then(data => ({ data, status }));
      })
      .then(({ data, status }) => {
        // Store the raw response
        setRawObjectivesResponse(data);
        
        // Update API info with status
        setObjectivesApiInfo(prev => ({
          ...prev!,
          status,
          error: data.error || undefined,
        }));
        
        console.log(`Raw objectives response:`, data);
        
        if (!status || status >= 400 || !data.success) {
          throw new Error(data.error || `Failed to fetch objectives for initiative ${initiative.id}`);
        }
        
        const fetchedObjectives = data.data.data || [];
        console.log(`Loaded ${fetchedObjectives.length} objectives for initiative ${initiative.id}`);
        
        setObjectives(fetchedObjectives);
        
        // Also update the initiative object with the objectives
        if (initiative) {
          initiative.objectives = fetchedObjectives;
        }
      })
      .catch(error => {
        console.error('Error fetching objectives:', error);
        setObjectivesError(error.message || 'Failed to fetch objectives');
        
        // Update API info with error
        setObjectivesApiInfo(prev => ({
          ...prev!,
          error: error instanceof Error ? error.message : String(error),
        }));
      })
      .finally(() => {
        setIsLoadingObjectives(false);
      });
    }
  }, [activeTab, initiative, client, isLoadingObjectives]);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'raw') {
      setShowRawJson(true);
    } else if (showRawJson) {
      setShowRawJson(false);
    }
  };

  if (!initiative) return null;

  // Helper function to extract the correct data from the initiative object
  const extractInitiativeData = (initiative: any) => {
    // Check if the initiative data is nested inside a data property
    if (initiative.data && typeof initiative.data === 'object') {
      // Create a merged object with data properties at the top level
      // but preserve any top-level properties that don't conflict
      const { data, ...rest } = initiative;
      return {
        ...data,
        // Preserve top-level properties if they don't exist in data
        ...Object.fromEntries(
          Object.entries(rest).filter(([key]) => data[key] === undefined)
        )
      };
    }
    
    // If not nested, return the initiative as is
    return initiative;
  };

  // Extract the initiative data
  const initiativeData = extractInitiativeData(initiative);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Initiative Details: {initiativeData.name}
                  </Dialog.Title>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowRawJson(!showRawJson)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                    >
                      {showRawJson ? (
                        <>
                          <DocumentTextIcon className="h-3 w-3 mr-1" />
                          Formatted View
                        </>
                      ) : (
                        <>
                          <CodeBracketIcon className="h-3 w-3 mr-1" />
                          Raw JSON
                        </>
                      )}
                    </button>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-4">
                  <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button
                      onClick={() => handleTabChange('overview')}
                      className={`${
                        activeTab === 'overview'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <InformationCircleIcon className="h-4 w-4 mr-1" />
                      Overview
                    </button>
                    <button
                      onClick={() => handleTabChange('features')}
                      className={`${
                        activeTab === 'features'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <PuzzlePieceIcon className="h-4 w-4 mr-1" />
                      Features {initiativeData.features ? `(${initiativeData.features.length})` : ''}
                    </button>
                    <button
                      onClick={() => handleTabChange('objectives')}
                      className={`${
                        activeTab === 'objectives'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <FlagIcon className="h-4 w-4 mr-1" />
                      Objectives {initiative.objectives ? `(${initiative.objectives.length})` : ''}
                    </button>
                    <button
                      onClick={() => handleTabChange('raw')}
                      className={`${
                        activeTab === 'raw'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <CodeBracketIcon className="h-4 w-4 mr-1" />
                      Raw JSON
                    </button>
                    <button
                      onClick={() => handleTabChange('raw_data')}
                      className={`${
                        activeTab === 'raw_data'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      Raw API Data
                    </button>
                  </nav>
                </div>

                <div className="mt-2">
                  {activeTab === 'raw_data' ? (
                    // Raw API Data tab
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Features API Call</h4>
                        {featuresApiInfo ? (
                          <div className="space-y-2">
                            <div className="bg-gray-100 p-2 rounded text-xs">
                              <p><span className="font-semibold">URL:</span> {featuresApiInfo.url}</p>
                              <p><span className="font-semibold">Timestamp:</span> {featuresApiInfo.timestamp}</p>
                              <p><span className="font-semibold">Status:</span> {featuresApiInfo.status || 'N/A'}</p>
                              {featuresApiInfo.error && (
                                <p className="text-red-600"><span className="font-semibold">Error:</span> {featuresApiInfo.error}</p>
                              )}
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60">
                              <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                                {rawFeaturesResponse ? JSON.stringify(rawFeaturesResponse, null, 2) : 'No data available'}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No features API data available. Try clicking the Features tab to load data.</p>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Objectives API Call</h4>
                        {objectivesApiInfo ? (
                          <div className="space-y-2">
                            <div className="bg-gray-100 p-2 rounded text-xs">
                              <p><span className="font-semibold">URL:</span> {objectivesApiInfo.url}</p>
                              <p><span className="font-semibold">Timestamp:</span> {objectivesApiInfo.timestamp}</p>
                              <p><span className="font-semibold">Status:</span> {objectivesApiInfo.status || 'N/A'}</p>
                              {objectivesApiInfo.error && (
                                <p className="text-red-600"><span className="font-semibold">Error:</span> {objectivesApiInfo.error}</p>
                              )}
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60">
                              <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                                {rawObjectivesResponse ? JSON.stringify(rawObjectivesResponse, null, 2) : 'No data available'}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No objectives API data available. Try clicking the Objectives tab to load data.</p>
                        )}
                      </div>
                      
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          <span className="font-semibold">Note:</span> This tab shows the raw API responses from ProductBoard. 
                          If you're not seeing any data, try clicking the Features and Objectives tabs first to trigger the API calls.
                        </p>
                      </div>
                    </div>
                  ) : activeTab === 'raw' ? (
                    // Raw JSON view
                    <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify(initiative, null, 2)}
                      </pre>
                    </div>
                  ) : activeTab === 'features' ? (
                    // Features tab
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Linked Features</h4>
                      {!initiativeData.features || initiativeData.features.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No features linked to this initiative</p>
                      ) : (
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {initiativeData.features.map((feature: ProductBoardFeature) => (
                                <tr 
                                  key={feature.id} 
                                  className="hover:bg-gray-50 cursor-pointer"
                                  onClick={() => onFeatureClick && onFeatureClick(feature)}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <p className="text-sm text-indigo-600">{feature.id}</p>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-900">{feature.name}</p>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      {typeof feature.status === 'object' && feature.status !== null 
                                        ? ((feature.status as any).name || 'Unknown') 
                                        : (feature.status || 'Unknown')}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-500">{feature.type || '-'}</p>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : activeTab === 'objectives' ? (
                    // Objectives tab
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Linked Objectives</h4>
                      
                      {isLoadingObjectives ? (
                        <div className="flex justify-center items-center py-8">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Loading objectives...</span>
                        </div>
                      ) : objectivesError ? (
                        <div className="text-red-500 text-sm py-4">
                          Error loading objectives: {objectivesError}
                        </div>
                      ) : !initiative.objectives || initiative.objectives.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No objectives linked to this initiative</p>
                      ) : (
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeframe</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {initiative.objectives.map((objective: ProductBoardObjective) => (
                                <tr key={objective.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <p className="text-sm text-indigo-600">{objective.id}</p>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-900">{objective.name}</p>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      {objective.status || 'Unknown'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-500">{objective.timeframe || '-'}</p>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {objective.progress !== undefined ? (
                                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-indigo-600 h-2.5 rounded-full" 
                                          style={{ width: `${objective.progress}%` }}
                                        ></div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500">-</p>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Overview tab (default)
                    <div className="space-y-4">
                      {/* Basic Information */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">ID</p>
                            <p className="text-sm text-gray-900">{initiativeData.id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Name</p>
                            <p className="text-sm text-gray-900">{initiativeData.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <p className="text-sm text-gray-900">
                              {typeof initiativeData.status === 'object' && initiativeData.status !== null 
                                ? ((initiativeData.status as any).name || 'Unknown') 
                                : (initiativeData.status || 'Unknown')}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500">Description</p>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{initiativeData.description || 'No description'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Parent Information */}
                      {initiativeData.parent && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Parent Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Parent ID</p>
                              {onParentClick ? (
                                <button 
                                  onClick={() => onParentClick(initiativeData.parent.id, 'initiative')}
                                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                                >
                                  {initiativeData.parent.id}
                                  <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                                </button>
                              ) : (
                                <p className="text-sm text-gray-900">{initiativeData.parent.id}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Parent Name</p>
                              <p className="text-sm text-gray-900">{initiativeData.parent.name || 'Unknown'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Children Information */}
                      {initiativeData.children && initiativeData.children.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Child Initiatives</h4>
                          <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {initiativeData.children.map((child: { id: string; name: string }) => (
                                  <tr key={child.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {onParentClick ? (
                                        <button 
                                          onClick={() => onParentClick(child.id, 'initiative')}
                                          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                                        >
                                          {child.id}
                                          <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                                        </button>
                                      ) : (
                                        <p className="text-sm text-gray-900">{child.id}</p>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <p className="text-sm text-gray-900">{child.name}</p>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* Features Information */}
                      {initiativeData.features && initiativeData.features.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Linked Features</h4>
                          <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {initiativeData.features.map((feature: ProductBoardFeature) => (
                                  <tr 
                                    key={feature.id} 
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => onFeatureClick && onFeatureClick(feature)}
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <p className="text-sm text-indigo-600">{feature.id}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <p className="text-sm text-gray-900">{feature.name}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {typeof feature.status === 'object' && feature.status !== null 
                                          ? ((feature.status as any).name || 'Unknown') 
                                          : (feature.status || 'Unknown')}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* Dates */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Dates</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Created At</p>
                            <p className="text-sm text-gray-900">
                              {initiativeData.created_at 
                                ? new Date(initiativeData.created_at).toLocaleString() 
                                : 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Updated At</p>
                            <p className="text-sm text-gray-900">
                              {initiativeData.updated_at 
                                ? new Date(initiativeData.updated_at).toLocaleString() 
                                : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Additional Fields */}
                      {Object.entries(initiativeData)
                        .filter(([key]) => !['id', 'name', 'description', 'status', 'parent', 'children', 'features', 'isExpanded', 'isLoading', 'created_at', 'updated_at'].includes(key))
                        .length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Fields</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(initiativeData)
                              .filter(([key]) => !['id', 'name', 'description', 'status', 'parent', 'children', 'features', 'isExpanded', 'isLoading', 'created_at', 'updated_at'].includes(key))
                              .map(([key, value]) => (
                                <div key={key} className="col-span-2">
                                  <p className="text-xs text-gray-500">{key}</p>
                                  <p className="text-sm text-gray-900">
                                    {typeof value === 'object' 
                                      ? JSON.stringify(value, null, 2) 
                                      : String(value)}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
