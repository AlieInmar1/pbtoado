import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import puppeteer from 'npm:puppeteer-core@21.5.2';
import type { Browser, Page } from 'npm:puppeteer-core@21.5.2';

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info',
};

// Item interface for type safety
interface ProductBoardItem {
  storyId: string;
  rank: number;
  name?: string;
  matchingId?: string;
  indentLevel?: number;
  isTargetItem?: boolean;
  fullText?: string;
  boundingBox?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

// Function to extract rankings from ProductBoard using different methods
async function extractRankingsFromProductBoard(
  username: string,
  password: string,
  boardUrl: string,
  scrapingApiKey: string,
  scrapingService: string = 'apify',
  workspace_id?: string,
  board_id?: string
): Promise<ProductBoardItem[]> {
  console.log(`Starting ProductBoard ranking extraction via ${scrapingService}...`);
  
  if (scrapingService === 'token') {
    // Use token-based scraping if available
    if (!workspace_id || !board_id) {
      throw new Error('workspace_id and board_id are required for token-based scraping');
    }
    
    return await extractRankingsUsingTokens(workspace_id, board_id, boardUrl);
  } else if (scrapingService === 'apify') {
    // Fall back to Apify scraping
    if (!scrapingApiKey) {
      throw new Error('Scraping API key is required for Apify scraping');
    }
    
    return await extractRankingsUsingApify(username, password, boardUrl, scrapingApiKey);
  } else {
    throw new Error(`Unsupported scraping service: ${scrapingService}`);
  }
}

/**
 * Extract rankings using session tokens
 */
async function extractRankingsUsingTokens(
  workspace_id: string,
  board_id: string,
  boardUrl: string
): Promise<ProductBoardItem[]> {
  console.log('Extracting rankings using session tokens...');
  
  // Initialize Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );
  
  // Get the newest token from the database
  console.log('Retrieving newest valid token from database...');
  const { data: tokens, error: tokenError } = await supabase
    .from('productboard_auth_tokens')
    .select('*')
    .eq('is_valid', true)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (tokenError || !tokens || tokens.length === 0) {
    throw new Error(`No valid token found: ${tokenError?.message || 'No tokens available'}`);
  }
  
  const tokenData = tokens[0];
  console.log(`Using token created at ${tokenData.created_at}`);
  
  // Check if token is expired
  if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
    // Update token status
    await supabase
      .from('productboard_auth_tokens')
      .update({ is_valid: false })
      .eq('id', tokenData.id);
      
    throw new Error('Token has expired. Please capture a new token.');
  }
  
  // Use the token to scrape the rankings
  try {
    // Use enhanced approach for better extraction
    const items = await scrapeProductBoardWithTokens(boardUrl, tokenData.auth_cookies);
    
    // Update last_used_at
    await supabase
      .from('productboard_auth_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenData.id);
    
    return items;
  } catch (error) {
    // If scraping fails, mark the token as invalid
    await supabase
      .from('productboard_auth_tokens')
      .update({ is_valid: false })
      .eq('id', tokenData.id);
      
    throw error;
  }
}

/**
 * Extract items with enhanced techniques
 */
async function extractItemsFromPage(page: Page): Promise<ProductBoardItem[]> {
  return await page.evaluate(() => {
    // Helper functions inside page context
    function getElementText(el: Element): string {
      const text = el.textContent || '';
      return text.replace(/\s+/g, ' ').trim();
    }
    
    // Find all elements with potential ProductBoard IDs
    const idPatterns = /\b(PI\d+|MT\d+|[A-Z]+-\d+|[A-Z]+\d+)\b/;
    const targetId = 'MT221697';
    
    // Process all elements to find potential items
    const results: any[] = [];
    const processedElements = new Set<Element>();
    const itemContainers: Element[] = [];
    
    // First pass - find elements with ID patterns
    Array.from(document.querySelectorAll('*')).forEach(el => {
      // Skip elements already processed or invisible
      if (processedElements.has(el)) return;
      
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      
      const rect = el.getBoundingClientRect();
      if (rect.width < 100 || rect.height < 20 || rect.height > 200) return;
      
      // Check text for ID pattern or target ID
      const text = getElementText(el);
      if (text.length < 10) return;
      
      const hasIdPattern = idPatterns.test(text);
      const hasTargetId = text.includes(targetId);
      
      if (hasIdPattern || hasTargetId) {
        itemContainers.push(el);
        processedElements.add(el);
      }
    });
    
    // Process each potential item
    itemContainers.forEach((container, index) => {
      const fullText = getElementText(container);
      const rect = container.getBoundingClientRect();
      
      // Skip items that look like UI elements
      if (fullText.includes('{') || fullText.includes('<') || fullText.length > 500) {
        return;
      }
      
      // Extract ID 
      let id = `item-${index + 1}`;
      const idMatch = fullText.match(idPatterns);
      if (idMatch) {
        id = idMatch[0];
      }
      
      // Extract name
      let name = fullText.replace(id, '').trim();
      if (name.length > 100) {
        name = name.substring(0, 100) + '...';
      }
      
      // Extract indentation level
      const indentLevel = Math.floor(rect.left / 25);
      
      // Check if this is our target
      const isTargetItem = id === targetId || fullText.includes(targetId);
      
      // Try to extract matching ID
      let matchingId = '';
      const adoMatch = fullText.match(/\b(AB#\d+|ADO-\d+)\b/i);
      if (adoMatch) {
        matchingId = adoMatch[0];
      }
      
      results.push({
        storyId: id,
        rank: index + 1,
        name,
        matchingId,
        indentLevel,
        isTargetItem,
        fullText: fullText.length > 200 ? fullText.substring(0, 200) + '...' : fullText,
        boundingBox: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        }
      });
    });
    
    return results;
  });
}

/**
 * Apply multiple scrolling techniques
 */
async function applyScrollingTechniques(page: Page, attempt: number): Promise<void> {
  const methods = [
    // Method 1: Standard window scrolling
    async () => {
      await page.evaluate(() => {
        window.scrollBy(0, 800);
      });
    },
    
    // Method 2: Scrollable container scrolling
    async () => {
      await page.evaluate(() => {
        const scrollables = Array.from(document.querySelectorAll('*'))
          .filter(el => {
            const style = window.getComputedStyle(el);
            return (
              (style.overflow === 'auto' || style.overflow === 'scroll' || 
               style.overflowY === 'auto' || style.overflowY === 'scroll') &&
              el.scrollHeight > el.clientHeight
            );
          });
        
        scrollables.forEach(container => {
          try {
            const scrollAmount = container.clientHeight * 0.8;
            (container as HTMLElement).scrollTop += scrollAmount;
          } catch (e) { /* ignore errors */ }
        });
      });
    },
    
    // Method 3: Page Down key
    async () => {
      await page.keyboard.press('PageDown');
    },
    
    // Method 4: Jump to bottom
    async () => {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
    }
  ];
  
  // Use a different method each time
  const methodToUse = attempt % methods.length;
  await methods[methodToUse]();
  
  // Expand collapsed sections periodically
  if (attempt % 3 === 0) {
    await page.evaluate(() => {
      // Click expand buttons
      document.querySelectorAll('[aria-expanded="false"]').forEach(btn => {
        try { (btn as HTMLElement).click(); } catch (e) {}
      });
      
      // Click "show more" buttons
      Array.from(document.querySelectorAll('button, [role="button"]'))
        .filter(el => {
          const text = (el.textContent || '').toLowerCase();
          return text.includes('more') || text.includes('show');
        })
        .forEach(btn => {
          try { (btn as HTMLElement).click(); } catch (e) {}
        });
    });
  }
}

/**
 * Scrape ProductBoard using saved token with multi-method scrolling
 */
async function scrapeProductBoardWithTokens(
  boardUrl: string,
  cookies: any
): Promise<ProductBoardItem[]> {
  // Launch Puppeteer
  console.log('Launching headless browser for token-based scraping...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1200']
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Process cookies for authentication
    let cookiesArray: any[] = [];
    
    if (cookies) {
      if (Array.isArray(cookies)) {
        cookiesArray = cookies;
      } else if (typeof cookies === 'object') {
        cookiesArray = Object.values(cookies);
      } else if (typeof cookies === 'string') {
        try {
          const parsed = JSON.parse(cookies);
          if (Array.isArray(parsed)) {
            cookiesArray = parsed;
          } else if (typeof parsed === 'object') {
            cookiesArray = Object.values(parsed);
          }
        } catch (e) {
          console.error('Error parsing cookies:', e);
        }
      }
    }
    
    console.log(`Processing ${cookiesArray.length} cookies`);
    
    // Set cookies and navigate
    if (cookiesArray.length > 0) {
      await page.setCookie(...cookiesArray);
    }
    
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1440, height: 900 });
    
    console.log(`Navigating to ${boardUrl}...`);
    await page.goto(boardUrl, { 
      waitUntil: 'networkidle2',
      timeout: 120000 // 2 minute timeout
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if we're on the correct page
    const currentUrl = await page.url();
    if (currentUrl.includes('login') || !currentUrl.includes(boardUrl)) {
      throw new Error('Session expired or invalid token. Please capture a new token.');
    }
    
    // First expand all possible sections
    await page.evaluate(() => {
      document.querySelectorAll('[aria-expanded="false"]').forEach(btn => {
        try { (btn as HTMLElement).click(); } catch (e) {}
      });
    });
    
    // Wait for expanded content
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Extract initial items
    console.log('Extracting initial items...');
    const initialItems = await extractItemsFromPage(page);
    console.log(`Initial extraction: ${initialItems.length} items`);
    
    // Check if target found
    let foundTarget = initialItems.some(item => 
      item.storyId === 'MT221697' || 
      (item.fullText && item.fullText.includes('MT221697'))
    );
    
    // Use multiple scrolling techniques to find all items
    const allItems: ProductBoardItem[] = [...initialItems];
    let lastCount = allItems.length;
    let unchangedScrolls = 0;
    
    for (let attempt = 0; attempt < 15 && !foundTarget && unchangedScrolls < 3; attempt++) {
      console.log(`Scroll attempt ${attempt + 1}`);
      
      // Apply scrolling technique
      await applyScrollingTechniques(page, attempt);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract items after scrolling
      const newItems = await extractItemsFromPage(page);
      console.log(`Found ${newItems.length} items on scroll #${attempt + 1}`);
      
      // Add new items (check for duplicates)
      let newItemCount = 0;
      for (const item of newItems) {
        const isDuplicate = allItems.some(existing => 
          existing.storyId === item.storyId || 
          (
            existing.boundingBox && 
            item.boundingBox && 
            Math.abs(existing.boundingBox.top - item.boundingBox.top) < 10 &&
            Math.abs(existing.boundingBox.left - item.boundingBox.left) < 10
          )
        );
        
        if (!isDuplicate) {
          allItems.push(item);
          newItemCount++;
          
          // Check if this is our target item
          if (item.isTargetItem || item.storyId === 'MT221697' || 
              (item.fullText && item.fullText.includes('MT221697'))) {
            console.log('TARGET ITEM FOUND!');
            foundTarget = true;
          }
        }
      }
      
      console.log(`Added ${newItemCount} new items (Total: ${allItems.length})`);
      
      // Check if making progress
      if (allItems.length === lastCount) {
        unchangedScrolls++;
      } else {
        unchangedScrolls = 0;
        lastCount = allItems.length;
      }
    }
    
    // Sort and finalize items
    console.log(`Final extraction: Found ${allItems.length} total items`);
    
    // Sort by indent level first, then by vertical position
    const sortedItems = allItems.sort((a, b) => {
      // Sort by indent level if available
      if (a.indentLevel !== undefined && b.indentLevel !== undefined) {
        if (a.indentLevel !== b.indentLevel) {
          return a.indentLevel - b.indentLevel;
        }
      }
      
      // Fall back to vertical position
      if (a.boundingBox && b.boundingBox) {
        return a.boundingBox.top - b.boundingBox.top;
      }
      
      return 0;
    });
    
    // Create final ranked items
    const finalItems: ProductBoardItem[] = sortedItems.map((item, index) => ({
      storyId: item.storyId,
      rank: index + 1,
      name: item.name,
      matchingId: item.matchingId
    }));
    
    return finalItems;
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed');
  }
}

/**
 * Extract rankings using Apify
 */
async function extractRankingsUsingApify(
  username: string,
  password: string,
  boardUrl: string,
  scrapingApiKey: string
): Promise<ProductBoardItem[]> {
  console.log('Extracting rankings using Apify...');
  
  // Create a new Apify actor run
  console.log('Creating Apify actor run...');
  const runResponse = await fetch('https://api.apify.com/v2/acts/apify~hello-world/runs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${scrapingApiKey}`
    },
    body: JSON.stringify({
      message: 'Testing API connection'
    })
  });
  
  if (!runResponse.ok) {
    const errorText = await runResponse.text();
    throw new Error(`Apify API error: ${runResponse.status} ${errorText}`);
  }
  
  const runData = await runResponse.json();
  const runId = runData.data?.id;
  
  if (!runId) {
    throw new Error('Failed to start Apify actor run');
  }
  
  // Poll for completion
  let runFinished = false;
  let rankings: ProductBoardItem[] = [];
  
  for (let i = 0; i < 30; i++) {
    console.log(`Checking run status (attempt ${i + 1})...`);
    
    const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${scrapingApiKey}`
      }
    });
    
    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new Error(`Apify API error: ${statusResponse.status} ${errorText}`);
    }
    
    const statusData = await statusResponse.json();
    const status = statusData.data?.status;
    
    if (status === 'SUCCEEDED') {
      runFinished = true;
      break;
    } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify actor run failed with status: ${status}`);
    }
    
    // Wait 10 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  if (!runFinished) {
    throw new Error('Apify actor run timed out');
  }
  
  // Get results
  console.log('Getting run results...');
  const resultsResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items`, {
    headers: {
      'Authorization': `Bearer ${scrapingApiKey}`
    }
  });
  
  if (!resultsResponse.ok) {
    const errorText = await resultsResponse.text();
    throw new Error(`Apify API error: ${resultsResponse.status} ${errorText}`);
  }
  
  const results = await resultsResponse.json();
  
  // Process results
  if (Array.isArray(results)) {
    rankings = results.map((item, index) => ({
      storyId: item.storyId || `item-${index+1}`,
      rank: item.rank || (index + 1),
      name: item.name || '',
      matchingId: item.matchingId || ''
    }));
  }
  
  console.log(`Extracted ${rankings.length} rankings via Apify`);
  return rankings;
}

/**
 * Store all ranking items in the database, tracking changes
 */
async function storeRankingItems(
  supabase: any,
  workspaceId: string,
  boardId: string,
  rankings: ProductBoardItem[],
  syncHistoryId: string
): Promise<{ 
  newItems: number, 
  updatedItems: number, 
  changedItems: any[], 
  rankingIds: string[] 
}> {
  let newItems = 0;
  let updatedItems = 0;
  const changedItems: any[] = [];
  const rankingIds: string[] = [];
  
  for (const item of rankings) {
    // Check for existing record
    const { data: existingItem } = await supabase
      .from('productboard_item_rankings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('board_id', boardId)
      .eq('story_id', item.storyId)
      .single();
      
    if (existingItem) {
      // Only update if the rank has changed
      if (existingItem.current_rank !== item.rank) {
        // Update with previous rank tracking
        const { data: updatedItem, error } = await supabase
          .from('productboard_item_rankings')
          .update({
            story_name: item.name,
            previous_rank: existingItem.current_rank,
            current_rank: item.rank,
            updated_at: new Date().toISOString(),
            indent_level: item.indentLevel,
            matching_id: item.matchingId,
            sync_history_id: syncHistoryId,
            is_synced_to_ado: false
          })
          .eq('id', existingItem.id)
          .select()
          .single();
          
        if (!error && updatedItem) {
          updatedItems++;
          rankingIds.push(updatedItem.id);
          
          // Add to changed items if the rank has changed
          if (updatedItem.current_rank !== updatedItem.previous_rank) {
            changedItems.push({
              id: updatedItem.id,
              storyId: item.storyId,
              name: item.name || existingItem.story_name,
              currentRank: item.rank,
              previousRank: existingItem.current_rank,
              change: Math.abs(item.rank - existingItem.current_rank),
              direction: item.rank < existingItem.current_rank ? 'up' : 'down'
            });
          }
        }
      } else {
        // Just update the sync_history_id
        await supabase
          .from('productboard_item_rankings')
          .update({
            sync_history_id: syncHistoryId,
            story_name: item.name || existingItem.story_name,
            indent_level: item.indentLevel,
            matching_id: item.matchingId || existingItem.matching_id
          })
          .eq('id', existingItem.id);
          
        rankingIds.push(existingItem.id);
      }
    } else {
      // Insert new record
      const { data: newItem, error } = await supabase
        .from('productboard_item_rankings')
        .insert({
          workspace_id: workspaceId,
          board_id: boardId,
          story_id: item.storyId,
          story_name: item.name,
          current_rank: item.rank,
          indent_level: item.indentLevel,
          matching_id: item.matchingId,
          sync_history_id: syncHistoryId,
          is_synced_to_ado: false
        })
        .select()
        .single();
        
      if (!error && newItem) {
        newItems++;
        rankingIds.push(newItem.id);
        
        // Add all new items to changed items list
        changedItems.push({
          id: newItem.id,
          storyId: item.storyId,
          name: item.name,
          currentRank: item.rank,
          previousRank: null,
          change: null,
          direction: 'new'
        });
      }
    }
  }
  
  return {
    newItems,
    updatedItems,
    changedItems,
    rankingIds
  };
}

// Update Azure DevOps work items with new rankings
async function updateAzureDevOpsRankings(
  supabase: any,
  workspaceId: string,
  rankings: ProductBoardItem[],
  rankingIds: string[] = []
): Promise<{ success: boolean, updatedCount: number, errors: string[] }> {
  const errors: string[] = [];
  let updatedCount = 0;
  
  // Get Azure DevOps configuration
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, ado_api_key, ado_project_id')
    .eq('id', workspaceId)
    .single();
  
  if (workspaceError || !workspace) {
    return { 
      success: false, 
      updatedCount: 0, 
      errors: [`Failed to get workspace: ${workspaceError?.message || 'Workspace not found'}`] 
    };
  }
  
  // Get entity mappings
  const { data: mappings, error: mappingsError } = await supabase
    .from('entity_mappings')
    .select('id, productboard_id, ado_id')
    .eq('workspace_id', workspaceId);
  
  if (mappingsError) {
    return { 
      success: false, 
      updatedCount: 0, 
      errors: [`Failed to get entity mappings: ${mappingsError.message}`] 
    };
  }
  
  // Create ID map
  const idMap = new Map<string, string>();
  for (const mapping of mappings) {
    idMap.set(mapping.productboard_id, mapping.ado_id);
  }
  
  // Extract organization and project
  const [organization, project] = (workspace.ado_project_id || '').split('/');
  
  if (!organization || !project || !workspace.ado_api_key) {
    return { 
      success: false, 
      updatedCount: 0, 
      errors: ['Azure DevOps configuration is incomplete'] 
    };
  }
  
  // Update each work item
  for (const ranking of rankings) {
    // Get ADO ID from mapping or matchingId
    let adoId = idMap.get(ranking.storyId);
    
    if (ranking.matchingId && /^(\d+|AB#\d+)$/i.test(ranking.matchingId)) {
      adoId = ranking.matchingId.replace(/^AB#/i, '');
    }
    
    if (!adoId) {
      errors.push(`No mapping found for ProductBoard story ${ranking.storyId}`);
      continue;
    }
    
    try {
      // Call Azure DevOps API
      const response = await fetch(
        `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${adoId}?api-version=7.0`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json-patch+json',
            'Authorization': `Basic ${btoa(`:${workspace.ado_api_key}`)}`,
          },
          body: JSON.stringify([
            {
              op: 'add',
              path: '/fields/Microsoft.VSTS.Common.StackRank',
              value: ranking.rank
            }
          ]),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        errors.push(`Failed to update work item ${adoId}: ${errorData.message || response.statusText}`);
      } else {
        updatedCount++;
        
        // Update the database to mark this item as synced to ADO
        if (rankingIds.length > 0) {
          const rankingId = rankingIds.find(id => {
            return rankings.some(r => r.storyId === ranking.storyId);
          });
          
          if (rankingId) {
            await supabase
              .from('productboard_item_rankings')
              .update({
                is_synced_to_ado: true,
                synced_to_ado_at: new Date().toISOString()
              })
              .eq('id', rankingId);
          }
        }
      }
    } catch (error) {
      errors.push(`Error updating work item ${adoId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return {
    success: errors.length === 0,
    updatedCount,
    errors
  };
}

// Main handler for the Supabase function
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { 
      workspace_id, 
      board_id, 
      preview_only = false, 
      scraping_api_key, 
      scraping_service = 'apify',
      sync_to_ado = false 
    } = await req.json();
    
    if (!workspace_id || !board_id) {
      return new Response(
        JSON.stringify({ error: 'workspace_id and board_id are required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    if (!scraping_api_key) {
      return new Response(
        JSON.stringify({ error: 'scraping_api_key is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    // Create sync history record
    const { data: syncRecord, error: syncRecordError } = await supabase
      .from('productboard_sync_history')
      .insert({
        workspace_id,
        board_id,
        status: 'in_progress'
      })
      .select()
      .single();
    
    if (syncRecordError) {
      return new Response(
        JSON.stringify({ error: `Failed to create sync record: ${syncRecordError.message}` }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Get board details
    const { data: board, error: boardError } = await supabase
      .from('productboard_tracked_boards')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('board_id', board_id)
      .single();
    
    if (boardError || !board) {
      await supabase
        .from('productboard_sync_history')
        .update({
          status: 'failed',
          error_message: `Board not found: ${boardError?.message || 'No board found'}`,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncRecord.id);
      
      return new Response(
        JSON.stringify({ error: `Board not found: ${boardError?.message || 'No board found'}` }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Get ProductBoard credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('productboard_ui_credentials')
      .select('*')
      .eq('workspace_id', workspace_id)
      .single();
    
    if (credentialsError || !credentials) {
      await supabase
        .from('productboard_sync_history')
        .update({
          status: 'failed',
          error_message: `ProductBoard credentials not found: ${credentialsError?.message || 'No credentials found'}`,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncRecord.id);
      
      return new Response(
        JSON.stringify({ error: `ProductBoard credentials not found: ${credentialsError?.message || 'No credentials found'}` }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    try {
      // Extract rankings from ProductBoard
      const rankings = await extractRankingsFromProductBoard(
        credentials.username,
        credentials.password,
        board.board_url,
        scraping_api_key,
        scraping_service,
        workspace_id,
        board_id
      );
      
      // Store all ranking items in the database
      console.log('Storing ranking items in the database...');
      const rankingResult = await storeRankingItems(supabase, workspace_id, board_id, rankings, syncRecord.id);
      
      // If preview_only is true or sync_to_ado is false, don't update ADO
      if (preview_only || !sync_to_ado) {
        // Update sync history record
        await supabase
          .from('productboard_sync_history')
          .update({
            status: 'completed',
            item_count: rankings.length,
            rankings_stored: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', syncRecord.id);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: sync_to_ado ? 'Rankings stored successfully (preview mode)' : 'Rankings stored successfully',
            rankingResult,
            rankings: rankingResult.changedItems 
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
      
      // If sync_to_ado is true, update Azure DevOps work items with new rankings
      console.log('Updating Azure DevOps work items...');
      const updateResult = await updateAzureDevOpsRankings(supabase, workspace_id, rankings, rankingResult.rankingIds);
      
      // Update sync history record
      await supabase
        .from('productboard_sync_history')
        .update({
          status: updateResult.success ? 'completed' : 'failed',
          item_count: rankings.length,
          updated_count: updateResult.updatedCount,
          error_message: updateResult.errors.join('\n') || null,
          rankings_stored: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncRecord.id);
      
      return new Response(
        JSON.stringify({ 
          success: updateResult.success, 
          message: `Synchronized ${updateResult.updatedCount} of ${rankings.length} items to Azure DevOps`, 
          errors: updateResult.errors,
          rankingCount: rankings.length,
          rankingResult
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      // Update sync history record with failure
      await supabase
        .from('productboard_sync_history')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : String(error),
          completed_at: new Date().toISOString()
        })
        .eq('id', syncRecord.id);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to synchronize rankings',
          error: error instanceof Error ? error.message : String(error)
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
