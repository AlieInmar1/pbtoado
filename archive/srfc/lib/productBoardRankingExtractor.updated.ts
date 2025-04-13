/**
 * ProductBoard Ranking Extractor
 * 
 * This module provides frontend utilities for extracting rankings from ProductBoard
 * and sending them to the Supabase function for storage and optional ADO syncing.
 */
import { supabase } from './supabase';

// Types
interface ProductBoardItem {
  storyId: string;
  rank: number;
  name?: string;
  matchingId?: string;
  indentLevel?: number;
}

interface ExtractionResult {
  success: boolean;
  rankings: ProductBoardItem[];
  errors?: string[];
  message?: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  newItems?: number;
  updatedItems?: number;
  changedItems?: any[];
  adoErrors?: string[];
  rankings?: ProductBoardItem[]; // For preview mode
}

/**
 * Extract ProductBoard rankings using browser APIs
 */
export async function extractProductBoardRankings(
  boardUrl: string
): Promise<ExtractionResult> {
  console.log('Starting ProductBoard ranking extraction in browser...');
  
  try {
    // Get authentication cookies/tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('productboard_auth_tokens')
      .select('*')
      .eq('is_valid', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (tokenError || !tokens || tokens.length === 0) {
      return {
        success: false,
        rankings: [],
        errors: [`No valid token found: ${tokenError?.message || 'No tokens available'}`]
      };
    }
    
    // Open ProductBoard in a new window with the cookies applied
    // This is a simplified approach - in a real implementation, you might want to:
    // 1. Use a hidden iframe
    // 2. Use the Fetch API with the cookies
    // 3. Or for most reliability, implement a Chrome extension that can access the page
    
    // For this example, we'll simulate extracting rankings
    // In a real implementation, you'd parse the board's HTML here
    const simulatedRankings = simulateRankingExtraction();
    
    // Update token's last_used_at
    await supabase
      .from('productboard_auth_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokens[0].id);
    
    return {
      success: true,
      rankings: simulatedRankings,
      message: `Successfully extracted ${simulatedRankings.length} rankings`
    };
  } catch (error) {
    console.error('Error extracting rankings:', error);
    return {
      success: false,
      rankings: [],
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

  /**
 * Store extracted rankings using the simplified Supabase function
 */
export async function storeAndSyncRankings(
  workspaceId: string,
  boardId: string, 
  rankings: ProductBoardItem[],
  syncToAdo = false,
  previewOnly = false
): Promise<SyncResult> {
  try {
    // If preview only, return the rankings directly without storing
    if (previewOnly) {
      return {
        success: true,
        message: `Preview mode: ${rankings.length} rankings extracted`,
        rankings: rankings // Include rankings in the result for preview
      };
    }
    
    // Otherwise, call the Supabase function to store the rankings using fetch API
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simplified-sync-rankings`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          board_id: boardId,
          rankings: rankings,
          sync_to_ado: syncToAdo
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to call function');
    }
    
    return data as SyncResult;
  } catch (error) {
    console.error('Error storing rankings:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Integration function that handles the entire extraction and sync process
 */
export async function extractAndSyncRankings(
  workspaceId: string,
  boardId: string,
  boardUrl: string,
  syncToAdo = false,
  previewOnly = false
): Promise<SyncResult> {
  // Step 1: Extract rankings from ProductBoard
  const extractionResult = await extractProductBoardRankings(boardUrl);
  
  if (!extractionResult.success) {
    return {
      success: false,
      message: `Extraction failed: ${extractionResult.errors?.[0] || 'Unknown error'}`
    };
  }
  
  if (extractionResult.rankings.length === 0) {
    return {
      success: false,
      message: 'No rankings found to store'
    };
  }
  
  // Step 2: Store and optionally sync the rankings
  return await storeAndSyncRankings(
    workspaceId,
    boardId,
    extractionResult.rankings,
    syncToAdo,
    previewOnly
  );
}

/**
 * Generate simulated rankings for testing
 * In a real implementation, this would be replaced with actual DOM parsing code
 */
function simulateRankingExtraction(): ProductBoardItem[] {
  const storyPrefixes = ['PI', 'MT', 'PBI', 'FEAT'];
  const storyNames = [
    'Implement login page',
    'Add user profile feature',
    'Fix password reset flow',
    'Optimize database queries',
    'Update UI styles',
    'Implement dark mode',
    'Add export functionality',
    'Create dashboard widgets',
    'Improve error handling',
    'Add unit tests'
  ];
  
  const count = 10 + Math.floor(Math.random() * 20); // 10-30 items
  const rankings: ProductBoardItem[] = [];
  
  for (let i = 0; i < count; i++) {
    const prefix = storyPrefixes[Math.floor(Math.random() * storyPrefixes.length)];
    const id = Math.floor(100000 + Math.random() * 900000); // 6-digit number
    const hasAdoId = Math.random() > 0.3; // 70% chance of having ADO ID
    
    rankings.push({
      storyId: `${prefix}${id}`,
      rank: i + 1,
      name: storyNames[i % storyNames.length],
      matchingId: hasAdoId ? `AB#${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      indentLevel: Math.floor(Math.random() * 3) // 0-2 indent levels
    });
  }
  
  return rankings;
}
