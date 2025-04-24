import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../../../../components/ui/shadcn/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/shadcn/card';
import { ArrowLeft, RefreshCw, Search, Filter, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHierarchyMappings } from '../../../../hooks/useHierarchyMappings';
import { supabase } from '../../../../lib/supabase';

// Define the types for our data
interface PbItem {
  id: string;
  name: string;
  level: string;
  description?: string;
  owner_email?: string;
  parent_id?: string;
  parent_name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface AdoItem {
  id: number;
  title: string;
  type: string;
  state: string;
  area_path?: string;
  iteration_path?: string;
  assigned_to_name?: string;
  created_date?: string;
  changed_date?: string;
  productboard_id?: string;
  parent_id?: number;
}

// Define the type for mapping results
interface MappingResult {
  // ProductBoard data
  pbId: string;
  pbName: string;
  pbType: string;
  
  // Azure DevOps data
  adoId: number;
  adoName: string;
  adoType: string;
  
  // Match information
  matchType: 'full' | 'partial' | 'none';
  matchSource: 'ado-with-pb' | 'ado-without-pb' | 'pb-without-ado';
  typeMatch: boolean;
  parentMatch: boolean;
  areaMatch: boolean;
  
  // URLs for external links
  pbUrl?: string;
  adoUrl?: string;
}

// Define the type for data view categories
type DataCategory = 'all' | 'ado-with-pb' | 'ado-without-pb' | 'pb-without-ado';

/**
 * A completely standalone page for mapping results
 * This is not part of the tab system and has its own route
 */
export const MappingResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { mappings, isLoading: isMappingsLoading } = useHierarchyMappings();
  
  // State for mapping results
  const [mappingResults, setMappingResults] = useState<MappingResult[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);
  const [resultsError, setResultsError] = useState<Error | null>(null);
  
  // State for filters
  const [dataCategory, setDataCategory] = useState<DataCategory>('all');
  const [showMismatchesOnly, setShowMismatchesOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Function to fetch ProductBoard features
  const fetchPbFeatures = async (): Promise<PbItem[]> => {
    try {
      console.log('Fetching ProductBoard features from Supabase...');
      const { data, error } = await supabase
        .from('productboard_features')
        .select('*');
      
      if (error) {
        console.error('Supabase error fetching ProductBoard features:', error);
        throw error;
      }
      
      console.log(`Retrieved ${data?.length || 0} ProductBoard features from Supabase`);
      
      if (!data || data.length === 0) {
        console.warn('No ProductBoard features found in the database');
        return [];
      }
      
      // Log the first item for debugging
      if (data[0]) {
        console.log('First ProductBoard feature:', JSON.stringify(data[0], null, 2));
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching ProductBoard features:', error);
      // Return empty array instead of throwing to prevent component from crashing
      return [];
    }
  };
  
  // Function to fetch Azure DevOps work items
  const fetchAdoWorkItems = async (): Promise<AdoItem[]> => {
    try {
      console.log('Fetching ADO work items from Supabase...');
      console.log('Supabase client:', supabase);
      
      // First, try a simple count query to test basic access
      console.log('Testing basic access with count query...');
      const countResult = await supabase
        .from('ado_work_items')
        .select('*', { count: 'exact', head: true });
      
      console.log('Count query result:', countResult);
      
      if (countResult.error) {
        console.error('Error with count query:', countResult.error);
        // Try a more minimal query
        console.log('Trying minimal query with limited fields...');
        const minimalResult = await supabase
          .from('ado_work_items')
          .select('id, title, type')
          .limit(5);
        
        console.log('Minimal query result:', minimalResult);
        
        if (minimalResult.error) {
          console.error('Even minimal query failed:', minimalResult.error);
          throw minimalResult.error;
        }
        
        // If minimal query works but full query doesn't, use the minimal data
        if (minimalResult.data && minimalResult.data.length > 0) {
          console.log('Using minimal data as fallback');
          return minimalResult.data.map(item => ({
            id: item.id,
            title: item.title || 'Unknown Title',
            type: item.type || 'Unknown Type',
            state: 'Unknown',
            productboard_id: undefined
          }));
        }
      }
      
      // If count query worked, proceed with full query
      console.log('Proceeding with full query...');
      const { data, error } = await supabase
        .from('ado_work_items')
        .select('*');
      
      if (error) {
        console.error('Supabase error fetching ADO work items:', error);
        throw error;
      }
      
      console.log(`Retrieved ${data?.length || 0} ADO work items from Supabase`);
      
      if (!data || data.length === 0) {
        console.warn('No ADO work items found in the database');
        return [];
      }
      
      // Log the first item for debugging
      if (data[0]) {
        console.log('First ADO work item:', JSON.stringify(data[0], null, 2));
      }
      
      // Process the data to extract ProductBoard IDs from raw_data
      const processedItems = (data || []).map(item => {
        let productboardId = undefined;
        
        // Try to extract ProductBoard ID from raw_data if available
        if (item.raw_data && item.raw_data.relations) {
          const pbLink = item.raw_data.relations.find((r: any) => 
            r.rel === 'Hyperlink' && 
            r.url && 
            r.url.includes('productboard.com')
          );
          
          if (pbLink) {
            const match = pbLink.url.match(/features\/([a-f0-9-]+)/);
            productboardId = match ? match[1] : undefined;
          }
        }
        
        // Use the extracted ID or the existing one, ensuring it's a string or undefined
        const finalId = productboardId || item.productboard_id;
        
        return {
          ...item,
          productboard_id: finalId
        };
      });
      
      console.log(`Processed ${processedItems.length} ADO work items`);
      return processedItems;
    } catch (error) {
      console.error('Error fetching Azure DevOps work items:', error);
      // Return empty array instead of throwing to prevent component from crashing
      return [];
    }
  };
  
  // Helper function to normalize names for comparison
  const normalizeName = (name: string): string => {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  };
  
  // Helper function to calculate similarity between two strings (0-1)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = normalizeName(str1);
    const s2 = normalizeName(str2);
    
    // Exact match
    if (s1 === s2) return 1;
    
    // One contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      const longerLength = Math.max(s1.length, s2.length);
      const shorterLength = Math.min(s1.length, s2.length);
      return shorterLength / longerLength;
    }
    
    // Calculate Levenshtein distance (simplified)
    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return 1;
    
    // Count matching characters
    let matches = 0;
    const minLength = Math.min(s1.length, s2.length);
    for (let i = 0; i < minLength; i++) {
      if (s1[i] === s2[i]) matches++;
    }
    
    return matches / maxLength;
  };
  
  // Function to generate mapping results from real data
  const generateMappingResults = async (): Promise<MappingResult[]> => {
    if (!mappings || mappings.length === 0) {
      console.log('No mappings available, cannot generate mapping results');
      return [];
    }
    
    // Use the first mapping configuration
    const mapping = mappings[0];
    console.log('Using mapping configuration:', mapping);
    
    try {
      // Fetch data from Supabase
      console.log('Fetching data from Supabase...');
      const [pbFeatures, adoWorkItems] = await Promise.all([
        fetchPbFeatures(),
        fetchAdoWorkItems()
      ]);
      
      console.log(`Data fetched: ${pbFeatures.length} PB features, ${adoWorkItems.length} ADO work items`);
      
      // Create maps for faster lookups
      const pbMap = new Map<string, PbItem>();
      pbFeatures.forEach(feature => pbMap.set(feature.id, feature));
      
      const adoMap = new Map<number, AdoItem>();
      adoWorkItems.forEach(item => adoMap.set(item.id, item));
      
      // Create name-based lookup maps
      const pbNameMap = new Map<string, PbItem[]>();
      pbFeatures.forEach(feature => {
        if (!feature.name) return;
        
        const normalizedName = normalizeName(feature.name);
        if (!pbNameMap.has(normalizedName)) {
          pbNameMap.set(normalizedName, []);
        }
        pbNameMap.get(normalizedName)!.push(feature);
      });
      
      // Track which PB items are matched
      const matchedPbIds = new Set<string>();
      
      const results: MappingResult[] = [];
      
      // Process all ADO items and try to match them by name
      adoWorkItems.forEach(adoItem => {
        if (!adoItem.title) {
          // Skip items without a title
          results.push({
            // PB data (minimal)
            pbId: '',
            pbName: 'No PB Item',
            pbType: 'none',
            
            // ADO data
            adoId: adoItem.id,
            adoName: adoItem.title || 'Unnamed Work Item',
            adoType: adoItem.type || 'Unknown',
            
            // Match information
            matchType: 'none',
            matchSource: 'ado-without-pb',
            typeMatch: false,
            parentMatch: false,
            areaMatch: false,
            
            // URLs
            adoUrl: `https://dev.azure.com/inmar/Healthcare/_workitems/edit/${adoItem.id}`
          });
          return;
        }
        
        const adoNormalizedName = normalizeName(adoItem.title);
        
        // Try to find an exact match first
        let matchedPbItem: PbItem | null = null;
        let matchSimilarity = 0;
        let matchSource: 'ado-with-pb' | 'ado-without-pb' = 'ado-without-pb';
        
        // Check if we have an exact name match
        if (pbNameMap.has(adoNormalizedName)) {
          const candidates = pbNameMap.get(adoNormalizedName)!;
          if (candidates.length > 0) {
            matchedPbItem = candidates[0]; // Take the first match for now
            matchSimilarity = 1;
            matchSource = 'ado-with-pb';
          }
        }
        
        // If no exact match, try fuzzy matching
        if (!matchedPbItem) {
          let bestSimilarity = 0.7; // Threshold for considering a match
          
          pbFeatures.forEach(pbItem => {
            if (!pbItem.name) return;
            
            const similarity = calculateSimilarity(adoItem.title, pbItem.name);
            if (similarity > bestSimilarity) {
              bestSimilarity = similarity;
              matchedPbItem = pbItem;
              matchSimilarity = similarity;
              matchSource = 'ado-with-pb';
            }
          });
        }
        
        if (matchedPbItem) {
          // We found a match by name
          matchedPbIds.add(matchedPbItem.id);
          
          // Determine expected ADO type based on PB level
          const pbLevel = matchedPbItem.level || 'feature';
          const pbToAdoMapping = mapping.pb_to_ado_mappings.find(m => m.pb_level === pbLevel);
          const expectedAdoType = pbToAdoMapping?.ado_type || 'Feature';
          
          // Determine if types match
          const typeMatch = adoItem.type === expectedAdoType;
          
          // Determine if parent hierarchy matches (simplified)
          const parentMatch = false; // Simplified for now
          
          // Determine if area path matches (simplified)
          const areaMatch = true; // Simplified for now
          
          // Overall match type based on similarity
          const matchType = matchSimilarity >= 0.9 ? 'full' : 'partial';
          
          results.push({
            // PB data
            pbId: matchedPbItem.id,
            pbName: matchedPbItem.name || 'Unnamed Feature',
            pbType: matchedPbItem.level || 'feature',
            
            // ADO data
            adoId: adoItem.id,
            adoName: adoItem.title || 'Unnamed Work Item',
            adoType: adoItem.type || 'Unknown',
            
            // Match information
            matchType,
            matchSource,
            typeMatch,
            parentMatch,
            areaMatch,
            
            // URLs
            pbUrl: `https://inmar.productboard.com/entity-detail/features/${matchedPbItem.id}`,
            adoUrl: `https://dev.azure.com/inmar/Healthcare/_workitems/edit/${adoItem.id}`
          });
        } else {
          // No match found by name
          results.push({
            // PB data (minimal)
            pbId: '',
            pbName: 'No PB Item',
            pbType: 'none',
            
            // ADO data
            adoId: adoItem.id,
            adoName: adoItem.title || 'Unnamed Work Item',
            adoType: adoItem.type || 'Unknown',
            
            // Match information
            matchType: 'none',
            matchSource: 'ado-without-pb',
            typeMatch: false,
            parentMatch: false,
            areaMatch: false,
            
            // URLs
            adoUrl: `https://dev.azure.com/inmar/Healthcare/_workitems/edit/${adoItem.id}`
          });
        }
      });
      
      // Process PB items without ADO matches
      pbFeatures.forEach(pbItem => {
        if (!matchedPbIds.has(pbItem.id)) {
          results.push({
            // PB data
            pbId: pbItem.id,
            pbName: pbItem.name || 'Unnamed Feature',
            pbType: pbItem.level || 'feature',
            
            // ADO data (minimal)
            adoId: 0,
            adoName: 'No ADO Item',
            adoType: 'none',
            
            // Match information
            matchType: 'none',
            matchSource: 'pb-without-ado',
            typeMatch: false,
            parentMatch: false,
            areaMatch: false,
            
            // URLs
            pbUrl: `https://inmar.productboard.com/entity-detail/features/${pbItem.id}`
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error('Error generating mapping results:', error);
      throw error;
    }
  };
  
  // Function to fetch mapping results
  const fetchMappingResults = useCallback(async () => {
    console.log('Fetching mapping results...');
    setIsLoadingResults(true);
    setResultsError(null);
    
    try {
      // Generate real mapping results
      const results = await generateMappingResults();
      
      setMappingResults(results);
      console.log('Mapping results fetched successfully:', results);
    } catch (error) {
      console.error('Error fetching mapping results:', error);
      setResultsError(error as Error);
    } finally {
      setIsLoadingResults(false);
    }
  }, [mappings]);
  
  // Fetch mapping results when mappings are loaded
  useEffect(() => {
    if (!isMappingsLoading && mappings && mappings.length > 0) {
      fetchMappingResults();
    }
  }, [isMappingsLoading, mappings, fetchMappingResults]);
  
  // Calculate statistics for mapping results
  const statistics = useMemo(() => {
    // Match counts
    const fullMatches = mappingResults.filter(r => r.matchType === 'full').length;
    const partialMatches = mappingResults.filter(r => r.matchType === 'partial').length;
    const noMatches = mappingResults.filter(r => r.matchType === 'none').length;
    
    // PB counts by type
    const pbItems = mappingResults.filter(r => r.matchSource === 'ado-with-pb' || r.matchSource === 'pb-without-ado');
    const pbInitiatives = pbItems.filter(r => r.pbType === 'initiative').length;
    const pbFeatures = pbItems.filter(r => r.pbType === 'feature').length;
    const pbSubfeatures = pbItems.filter(r => r.pbType === 'subfeature').length;
    const pbTotal = pbItems.length;
    
    // ADO counts by type
    const adoItems = mappingResults.filter(r => r.matchSource === 'ado-with-pb' || r.matchSource === 'ado-without-pb');
    const adoEpics = adoItems.filter(r => r.adoType === 'Epic').length;
    const adoFeatures = adoItems.filter(r => r.adoType === 'Feature').length;
    const adoStories = adoItems.filter(r => r.adoType === 'User Story').length;
    const adoTotal = adoItems.length;
    
    return {
      matches: { full: fullMatches, partial: partialMatches, none: noMatches },
      pb: { initiatives: pbInitiatives, features: pbFeatures, subfeatures: pbSubfeatures, total: pbTotal },
      ado: { epics: adoEpics, features: adoFeatures, stories: adoStories, total: adoTotal }
    };
  }, [mappingResults]);
  
  // Update the AdminPage statistics when data is loaded
  useEffect(() => {
    if (!isLoadingResults && !resultsError && mappingResults.length > 0) {
      // Update match counts
      const fullMatchesEl = document.getElementById('full-matches-count');
      const partialMatchesEl = document.getElementById('partial-matches-count');
      const noMatchesEl = document.getElementById('no-matches-count');
      
      if (fullMatchesEl) fullMatchesEl.textContent = statistics.matches.full.toString();
      if (partialMatchesEl) partialMatchesEl.textContent = statistics.matches.partial.toString();
      if (noMatchesEl) noMatchesEl.textContent = statistics.matches.none.toString();
      
      // Update PB counts
      const pbInitiativesEl = document.getElementById('pb-initiatives-count');
      const pbFeaturesEl = document.getElementById('pb-features-count');
      const pbSubfeaturesEl = document.getElementById('pb-subfeatures-count');
      const pbTotalEl = document.getElementById('pb-total-count');
      
      if (pbInitiativesEl) pbInitiativesEl.textContent = statistics.pb.initiatives.toString();
      if (pbFeaturesEl) pbFeaturesEl.textContent = statistics.pb.features.toString();
      if (pbSubfeaturesEl) pbSubfeaturesEl.textContent = statistics.pb.subfeatures.toString();
      if (pbTotalEl) pbTotalEl.textContent = statistics.pb.total.toString();
      
      // Update ADO counts
      const adoEpicsEl = document.getElementById('ado-epics-count');
      const adoFeaturesEl = document.getElementById('ado-features-count');
      const adoStoriesEl = document.getElementById('ado-stories-count');
      const adoTotalEl = document.getElementById('ado-total-count');
      
      if (adoEpicsEl) adoEpicsEl.textContent = statistics.ado.epics.toString();
      if (adoFeaturesEl) adoFeaturesEl.textContent = statistics.ado.features.toString();
      if (adoStoriesEl) adoStoriesEl.textContent = statistics.ado.stories.toString();
      if (adoTotalEl) adoTotalEl.textContent = statistics.ado.total.toString();
    }
  }, [isLoadingResults, resultsError, mappingResults, statistics]);
  
  // Apply filters to mapping results
  const filteredResults = useMemo(() => {
    return mappingResults.filter(result => {
      // Filter by data category
      if (dataCategory !== 'all' && result.matchSource !== dataCategory) {
        return false;
      }
      
      // Filter by mismatches only
      if (showMismatchesOnly && result.matchType === 'full') {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (result.pbName && result.pbName.toLowerCase().includes(query)) ||
          (result.adoName && result.adoName.toLowerCase().includes(query)) ||
          (result.pbId && result.pbId.toLowerCase().includes(query)) ||
          (result.adoId && result.adoId.toString().includes(query))
        );
      }
      
      return true;
    });
  }, [mappingResults, dataCategory, showMismatchesOnly, searchQuery]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </Button>
        <h1 className="text-2xl font-semibold">Mapping Results</h1>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hierarchy Mapping Results</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchMappingResults}
              disabled={isLoadingResults}
              className="flex items-center gap-1"
            >
              {isLoadingResults ? 'Loading...' : 'Refresh Results'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="text-lg font-medium mb-3">Filters</h3>
            
            {/* Data Category Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Category
              </label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={dataCategory === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setDataCategory('all')}
                >
                  All Items
                </Button>
                <Button 
                  variant={dataCategory === 'ado-with-pb' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setDataCategory('ado-with-pb')}
                >
                  ADO with PB
                </Button>
                <Button 
                  variant={dataCategory === 'ado-without-pb' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setDataCategory('ado-without-pb')}
                >
                  ADO without PB
                </Button>
                <Button 
                  variant={dataCategory === 'pb-without-ado' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setDataCategory('pb-without-ado')}
                >
                  PB without ADO
                </Button>
              </div>
            </div>
            
            <div className="mt-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showMismatchesOnly}
                  onChange={(e) => setShowMismatchesOnly(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Show mismatches only</span>
              </label>
            </div>
            
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="w-full p-2 pl-8 border border-gray-300 rounded-md"
                />
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Statistics Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="text-lg font-medium mb-3">Mapping Statistics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-3 rounded-md border border-green-100">
                <div className="text-sm text-gray-500">Full Matches</div>
                <div className="text-xl font-semibold">{statistics.matches.full}</div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100">
                <div className="text-sm text-gray-500">Partial Matches</div>
                <div className="text-xl font-semibold">{statistics.matches.partial}</div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-md border border-red-100">
                <div className="text-sm text-gray-500">No Matches</div>
                <div className="text-xl font-semibold">{statistics.matches.none}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-md font-medium mb-2 text-blue-800">ProductBoard Items</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-2 rounded-md border border-blue-100">
                    <div className="text-sm text-gray-500">Initiatives</div>
                    <div className="text-lg font-semibold">{statistics.pb.initiatives}</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-md border border-blue-100">
                    <div className="text-sm text-gray-500">Features</div>
                    <div className="text-lg font-semibold">{statistics.pb.features}</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-md border border-blue-100">
                    <div className="text-sm text-gray-500">Sub-features</div>
                    <div className="text-lg font-semibold">{statistics.pb.subfeatures}</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-md border border-blue-100">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-lg font-semibold">{statistics.pb.total}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-2 text-purple-800">Azure DevOps Items</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-purple-50 p-2 rounded-md border border-purple-100">
                    <div className="text-sm text-gray-500">Epics</div>
                    <div className="text-lg font-semibold">{statistics.ado.epics}</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-md border border-purple-100">
                    <div className="text-sm text-gray-500">Features</div>
                    <div className="text-lg font-semibold">{statistics.ado.features}</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-md border border-purple-100">
                    <div className="text-sm text-gray-500">User Stories</div>
                    <div className="text-lg font-semibold">{statistics.ado.stories}</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-md border border-purple-100">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-lg font-semibold">{statistics.ado.total}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  try {
                    console.log('Testing Supabase connection...');
                    // Use the correct syntax for counting records
                    const { count: pbCount, error: pbError } = await supabase
                      .from('productboard_features')
                      .select('*', { count: 'exact', head: true });
                    
                    console.log('PB count result:', pbCount, pbError);
                    
                    const { count: adoCount, error: adoError } = await supabase
                      .from('ado_work_items')
                      .select('*', { count: 'exact', head: true });
                    
                    console.log('ADO count result:', adoCount, adoError);
                    
                    alert(`PB Count: ${pbCount || 'Error'}\nADO Count: ${adoCount || 'Error'}\nCheck console for details`);
                  } catch (err) {
                    console.error('Connection test error:', err);
                    alert(`Connection test error: ${err}`);
                  }
                }}
              >
                Test Connection
              </Button>
            </div>
          </div>
          
          {/* Results Content */}
          {resultsError ? (
            <div className="bg-red-50 p-4 rounded-md border border-red-100">
              <p className="text-red-500">
                Error: {resultsError.message || 'An error occurred while fetching mapping results'}
              </p>
              <pre className="text-xs mt-2 p-2 bg-red-50 overflow-auto max-h-40">
                {resultsError.stack || 'No stack trace available'}
              </pre>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchMappingResults}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : isLoadingResults ? (
            <div className="bg-blue-50 p-8 rounded-md border border-blue-100 flex flex-col items-center justify-center">
              <p className="text-blue-500 text-lg">Loading mapping results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-md border border-gray-200 text-center">
              <p className="text-gray-500 mb-2">
                No mapping results match your filters.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setDataCategory('all');
                  setShowMismatchesOnly(false);
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Showing {filteredResults.length} of {mappingResults.length} results
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left border border-gray-200">PB ID</th>
                      <th className="p-2 text-left border border-gray-200">PB Name</th>
                      <th className="p-2 text-left border border-gray-200">PB Type</th>
                      <th className="p-2 text-left border border-gray-200">ADO ID</th>
                      <th className="p-2 text-left border border-gray-200">ADO Name</th>
                      <th className="p-2 text-left border border-gray-200">ADO Type</th>
                      <th className="p-2 text-left border border-gray-200">Match</th>
                      <th className="p-2 text-left border border-gray-200">Links</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-2 border border-gray-200">
                          {result.pbId ? result.pbId.substring(0, 8) + '...' : ''}
                        </td>
                        <td className="p-2 border border-gray-200">{result.pbName}</td>
                        <td className="p-2 border border-gray-200">{result.pbType}</td>
                        <td className="p-2 border border-gray-200">
                          {result.adoId > 0 ? result.adoId : ''}
                        </td>
                        <td className="p-2 border border-gray-200">{result.adoName}</td>
                        <td className="p-2 border border-gray-200">{result.adoType}</td>
                        <td className="p-2 border border-gray-200">
                          {result.matchType === 'full' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Full Match
                            </span>
                          ) : result.matchType === 'partial' ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              Partial Match
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              No Match
                            </span>
                          )}
                        </td>
                        <td className="p-2 border border-gray-200">
                          <div className="flex space-x-2">
                            {result.pbUrl && (
                              <a 
                                href={result.pbUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                                title="Open in ProductBoard"
                              >
                                <div className="flex items-center">
                                  PB <ExternalLink className="h-3 w-3 ml-1" />
                                </div>
                              </a>
                            )}
                            {result.adoUrl && (
                              <a 
                                href={result.adoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                                title="Open in Azure DevOps"
                              >
                                <div className="flex items-center">
                                  ADO <ExternalLink className="h-3 w-3 ml-1" />
                                </div>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// No default export needed, using named export
