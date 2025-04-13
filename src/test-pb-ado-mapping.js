/**
 * Test script to validate the mapping between ProductBoard and Azure DevOps
 * 
 * This script:
 * 1. Fetches ProductBoard features and sub-features
 * 2. Fetches Azure DevOps work items that have ProductBoard IDs
 * 3. Applies our mapping logic to see if it would place them in the correct hierarchy
 * 4. Outputs the results for validation
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Default mapping configuration (same as in hierarchyMapping.ts)
const DEFAULT_MAPPING = {
  pb_to_ado_mappings: [
    {
      pb_level: 'initiative',
      ado_type: 'Epic',
      description: 'Map ProductBoard Initiatives to Azure DevOps Epics'
    },
    {
      pb_level: 'feature',
      ado_type: 'Feature',
      description: 'Map ProductBoard Features to Azure DevOps Features'
    },
    {
      pb_level: 'subfeature',
      ado_type: 'User Story',
      description: 'Map ProductBoard Sub-features (Stories) to Azure DevOps User Stories'
    }
  ],
  area_path_mappings: [
    {
      business_unit: 'Healthcare',
      product_code: 'Platform',
      team: 'Skunkworks',
      area_path: 'Healthcare\\Teams\\Skunkworks',
      description: 'Map Healthcare Platform Skunkworks team items'
    }
  ]
};

// Helper function to get ADO type for PB level
function getAdoTypeForPbLevel(pbLevel) {
  const mapping = DEFAULT_MAPPING.pb_to_ado_mappings.find(m => m.pb_level === pbLevel);
  if (!mapping) {
    // Default mappings if not found
    switch (pbLevel) {
      case 'initiative':
        return 'Epic';
      case 'feature':
        return 'Feature';
      case 'subfeature':
        return 'User Story';
      default:
        return 'User Story';
    }
  }
  return mapping.ado_type;
}

// Helper function to get area path for item
function getAreaPathForItem(businessUnit, productCode, team) {
  const mapping = DEFAULT_MAPPING.area_path_mappings.find(m => 
    m.business_unit === businessUnit && 
    m.product_code === productCode && 
    m.team === team
  );
  
  if (!mapping) {
    // Try partial matches
    const partialMapping = DEFAULT_MAPPING.area_path_mappings.find(m => 
      m.business_unit === businessUnit && 
      m.product_code === productCode
    );
    
    if (partialMapping) {
      return partialMapping.area_path;
    }
    
    const businessUnitMapping = DEFAULT_MAPPING.area_path_mappings.find(m => 
      m.business_unit === businessUnit
    );
    
    if (businessUnitMapping) {
      return businessUnitMapping.area_path;
    }
    
    return DEFAULT_MAPPING.area_path_mappings[0]?.area_path || 'Unknown';
  }
  
  return mapping.area_path;
}

async function main() {
  try {
    console.log('Starting PB-ADO mapping test...');
    
    // 1. Fetch ProductBoard features and sub-features
    console.log('\nFetching ProductBoard features...');
    const { data: pbFeatures, error: pbError } = await supabase
      .from('productboard_features')
      .select('*');
    
    if (pbError) {
      throw new Error(`Error fetching ProductBoard features: ${pbError.message}`);
    }
    
    console.log(`Found ${pbFeatures.length} ProductBoard features`);
    
    // 2. Fetch Azure DevOps work items that have ProductBoard IDs
    console.log('\nFetching Azure DevOps work items with ProductBoard IDs...');
    const { data: adoItems, error: adoError } = await supabase
      .from('ado_work_items')
      .select('*')
      .not('productboard_id', 'is', null);
    
    if (adoError) {
      throw new Error(`Error fetching Azure DevOps work items: ${adoError.message}`);
    }
    
    console.log(`Found ${adoItems.length} Azure DevOps work items with ProductBoard IDs`);
    
    // 3. Build a map of ProductBoard IDs to Azure DevOps work items
    const pbIdToAdoItem = {};
    adoItems.forEach(item => {
      if (item.productboard_id) {
        pbIdToAdoItem[item.productboard_id] = item;
      }
    });
    
    // 4. Analyze the mapping
    console.log('\nAnalyzing mapping...');
    
    // Count by type
    const pbTypeCount = {
      initiative: 0,
      feature: 0,
      subfeature: 0
    };
    
    const adoTypeCount = {
      Epic: 0,
      Feature: 0,
      'User Story': 0,
      Other: 0
    };
    
    // Count matches and mismatches
    let matchCount = 0;
    let mismatchCount = 0;
    const mismatches = [];
    
    // Analyze each ProductBoard feature
    pbFeatures.forEach(pbFeature => {
      // Determine PB level
      const pbLevel = pbFeature.feature_type === 'subfeature' ? 'subfeature' : 'feature';
      pbTypeCount[pbLevel]++;
      
      // Get the expected ADO type based on our mapping
      const expectedAdoType = getAdoTypeForPbLevel(pbLevel);
      
      // Check if this PB feature has a corresponding ADO item
      const adoItem = pbIdToAdoItem[pbFeature.productboard_id];
      if (adoItem) {
        const actualAdoType = adoItem.type;
        
        // Count ADO type
        if (['Epic', 'Feature', 'User Story'].includes(actualAdoType)) {
          adoTypeCount[actualAdoType]++;
        } else {
          adoTypeCount.Other++;
        }
        
        // Check if the mapping matches
        if (expectedAdoType === actualAdoType) {
          matchCount++;
        } else {
          mismatchCount++;
          mismatches.push({
            pbId: pbFeature.productboard_id,
            pbName: pbFeature.name,
            pbLevel,
            expectedAdoType,
            actualAdoType,
            adoId: adoItem.id
          });
        }
      }
    });
    
    // 5. Output the results
    console.log('\n--- ProductBoard Type Counts ---');
    Object.entries(pbTypeCount).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
    
    console.log('\n--- Azure DevOps Type Counts ---');
    Object.entries(adoTypeCount).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
    
    console.log('\n--- Mapping Results ---');
    console.log(`Total mapped items: ${matchCount + mismatchCount}`);
    console.log(`Matches: ${matchCount}`);
    console.log(`Mismatches: ${mismatchCount}`);
    
    // Create a table of all mappings
    console.log('\n--- Mapping Table ---');
    console.log('| ProductBoard ID | ProductBoard Name | PB Type | ADO ID | ADO Type | Expected ADO Type | Match |');
    console.log('|----------------|------------------|---------|--------|----------|------------------|-------|');
    
    // Collect all mapped items
    const mappedItems = [];
    
    pbFeatures.forEach(pbFeature => {
      const pbLevel = pbFeature.feature_type === 'subfeature' ? 'subfeature' : 'feature';
      const expectedAdoType = getAdoTypeForPbLevel(pbLevel);
      const adoItem = pbIdToAdoItem[pbFeature.productboard_id];
      
      if (adoItem) {
        const actualAdoType = adoItem.type;
        const isMatch = expectedAdoType === actualAdoType;
        
        mappedItems.push({
          pbId: pbFeature.productboard_id,
          pbName: pbFeature.name,
          pbLevel,
          adoId: adoItem.id,
          actualAdoType,
          expectedAdoType,
          isMatch
        });
      }
    });
    
    // Sort by PB level and then by name
    mappedItems.sort((a, b) => {
      if (a.pbLevel !== b.pbLevel) {
        // Sort by level: initiative, feature, subfeature
        const levelOrder = { initiative: 0, feature: 1, subfeature: 2 };
        return levelOrder[a.pbLevel] - levelOrder[b.pbLevel];
      }
      // Then sort by name
      return a.pbName.localeCompare(b.pbName);
    });
    
    // Print the table
    mappedItems.forEach(item => {
      console.log(`| ${item.pbId.substring(0, 8)}... | ${item.pbName.substring(0, 15).padEnd(15)} | ${item.pbLevel.padEnd(7)} | ${item.adoId} | ${item.actualAdoType.padEnd(8)} | ${item.expectedAdoType.padEnd(15)} | ${item.isMatch ? '✅' : '❌'} |`);
    });
    
    // Print mismatches in detail
    if (mismatches.length > 0) {
      console.log('\n--- Mismatches Detail ---');
      mismatches.forEach(mismatch => {
        console.log(`PB: ${mismatch.pbName} (${mismatch.pbId}, ${mismatch.pbLevel})`);
        console.log(`ADO: ${mismatch.adoId} (${mismatch.actualAdoType})`);
        console.log(`Expected ADO type: ${mismatch.expectedAdoType}`);
        console.log('---');
      });
    }
    
    // 6. Analyze parent-child relationships
    console.log('\n--- Parent-Child Relationship Analysis ---');
    
    // Build a map of PB features by ID
    const pbFeaturesById = {};
    pbFeatures.forEach(feature => {
      pbFeaturesById[feature.productboard_id] = feature;
    });
    
    // Count parent-child relationships
    let pbParentChildCount = 0;
    let adoParentChildCount = 0;
    let matchingParentChildCount = 0;
    
    // For each PB feature with a parent
    pbFeatures.filter(f => f.parent_id).forEach(pbFeature => {
      pbParentChildCount++;
      
      // Get the parent PB feature
      const parentPbFeature = pbFeatures.find(f => f.productboard_id === pbFeature.parent_id);
      if (!parentPbFeature) return;
      
      // Get the ADO items for both the feature and its parent
      const adoItem = pbIdToAdoItem[pbFeature.productboard_id];
      const parentAdoItem = pbIdToAdoItem[parentPbFeature.productboard_id];
      
      if (adoItem && parentAdoItem) {
        // Check if the ADO items have a parent-child relationship
        if (adoItem.parent_id === parentAdoItem.id) {
          adoParentChildCount++;
          matchingParentChildCount++;
        }
      }
    });
    
    console.log(`PB parent-child relationships: ${pbParentChildCount}`);
    console.log(`ADO parent-child relationships: ${adoParentChildCount}`);
    console.log(`Matching parent-child relationships: ${matchingParentChildCount}`);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the main function
main();
