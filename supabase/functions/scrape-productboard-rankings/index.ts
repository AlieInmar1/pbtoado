import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { config } from '../supabase/config.ts';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

// Constants
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const TIMEOUT = 60000; // 60 seconds timeout

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info',
};

interface RequestBody {
  rankingsUrl: string;
  cookiesJson: string;
  boardId?: string;
  workspaceId?: number;
}

interface RankingItem {
  id: string;
  rank: number;
  title?: string;
  text?: string;
  description?: string;
  score?: number | null;
  position?: { x: number; y: number };
  column?: string;
  columnIndex?: number;
  positionInColumn?: number;
  selector?: string;
}

/**
 * Main handler for the Supabase function
 */
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Parse the request body
    const body: RequestBody = await req.json();

    // Validate required fields
    if (!body.rankingsUrl || !body.cookiesJson) {
      return new Response(
        JSON.stringify({ error: 'rankingsUrl and cookiesJson are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Create a Supabase client
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse cookies string to JSON
    let cookies;
    try {
      cookies = JSON.parse(body.cookiesJson);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid cookies JSON format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Scrape the rankings
    console.log(`Scraping ProductBoard rankings from: ${body.rankingsUrl}`);
    const scrapedData = await scrapeProductBoardRankings(body.rankingsUrl, cookies);

    // Format the data for storage
    const formattedData = formatRankingData(scrapedData, body.boardId, body.workspaceId);

    // Store the scraped data in Supabase
    if (formattedData.length > 0) {
      const { data: storedData, error } = await supabaseAdmin
        .from('productboard_rankings')
        .upsert(formattedData, { onConflict: 'feature_id, board_id' })
        .select();

      if (error) {
        console.error('Error storing rankings in Supabase:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to store rankings in database', details: error }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      console.log(`Successfully stored ${formattedData.length} ranking items in Supabase`);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Successfully scraped and stored ${formattedData.length} ranking items`,
          data: storedData 
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No ranking items found to store' 
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
  } catch (error) {
    console.error('Error in scrape-productboard-rankings function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

/**
 * Scrape ProductBoard rankings using Puppeteer with saved cookies
 */
async function scrapeProductBoardRankings(rankingsUrl: string, cookies: any[]) {
  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Set a realistic viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Set user agent to look like a normal browser
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    // Set the cookies for authentication
    await page.setCookie(...cookies);
    
    // Navigate to the rankings page
    console.log(`Navigating to: ${rankingsUrl}`);
    await page.goto(rankingsUrl, { 
      timeout: TIMEOUT,
      waitUntil: 'networkidle2' 
    });
    
    // Check if authentication was successful
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl !== rankingsUrl) {
      console.error(`Authentication failed. Redirected to ${currentUrl}`);
      throw new Error('Authentication failed. Session cookies may have expired.');
    }
    
    // Wait for the content to load
    await page.waitForTimeout(5000);
    
    // Extract ranking data based on page type
    console.log('Extracting ranking data...');
    const rankings = await extractRankings(page);
    
    return rankings;
  } finally {
    // Close the browser
    await browser.close();
  }
}

/**
 * Extract rankings data from the page
 */
async function extractRankings(page: any) {
  // First, try to identify the type of ranking page we're on
  const pageType = await determinePageType(page);
  console.log(`Detected page type: ${pageType}`);
  
  // Initialize storage for rankings
  const rankings = {
    items: [],
    metadata: {
      url: page.url(),
      timestamp: new Date().toISOString(),
      title: await page.title(),
      pageType
    }
  };
  
  // Extract the items based on the page type
  switch (pageType) {
    case 'prioritization-view':
      rankings.items = await extractPrioritizationItems(page);
      break;
    case 'board-view':
      rankings.items = await extractBoardViewItems(page);
      break;
    case 'standard-list':
      rankings.items = await extractStandardListItems(page);
      break;
    default:
      // Generic extraction as fallback
      rankings.items = await extractGenericItems(page);
  }
  
  console.log(`Extracted ${rankings.items.length} ranked items`);
  return rankings;
}

/**
 * Determine the type of ProductBoard page we're on
 */
async function determinePageType(page: any): Promise<string> {
  // Check for various page type indicators
  const indicators = await page.evaluate(() => {
    const boardView = document.querySelector('.board-view, .kanban-view, [data-test="board-view"]');
    const prioritizationView = document.querySelector('.prioritization-view, [data-test="prioritization-view"]');
    const listView = document.querySelector('.list-view, [data-test="list-view"]');
    
    // Try to get page header text which often includes view type
    const headerText = document.querySelector('h1, .page-header')?.textContent || '';
    
    return {
      hasBoardView: !!boardView,
      hasPrioritizationView: !!prioritizationView,
      hasListView: !!listView,
      headerText
    };
  });
  
  // Determine the page type based on indicators
  if (indicators.hasPrioritizationView || indicators.headerText.toLowerCase().includes('prioritization')) {
    return 'prioritization-view';
  } else if (indicators.hasBoardView || indicators.headerText.toLowerCase().includes('board')) {
    return 'board-view';
  } else if (indicators.hasListView || indicators.headerText.toLowerCase().includes('list')) {
    return 'standard-list';
  } else {
    // Default to generic if we can't determine
    return 'generic';
  }
}

/**
 * Extract items from a prioritization view
 */
async function extractPrioritizationItems(page: any): Promise<RankingItem[]> {
  return await page.evaluate(() => {
    // Prioritization views often have different elements
    const selectors = [
      '.feature-card', 
      '.priority-item',
      '[data-test="priority-item"]',
      '.pb-feature-card',
      '.prioritization-item'
    ];
    
    // Find the first selector that returns items
    let items = [];
    let usedSelector = '';
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} items with selector: ${selector}`);
        items = Array.from(elements);
        usedSelector = selector;
        break;
      }
    }
    
    // If no items found, try generic approach with table rows or grid items
    if (items.length === 0) {
      const rowSelectors = [
        'tr', '.row', '[role="row"]'
      ];
      
      for (const selector of rowSelectors) {
        const elements = document.querySelectorAll(selector);
        // Skip the first row if it might be a header
        if (elements.length > 1) {
          items = Array.from(elements).slice(1);
          usedSelector = selector;
          break;
        }
      }
    }
    
    // Extract data from the items
    return items.map((el, index) => {
      const text = el.textContent || '';
      
      // Try to extract ID
      let id = `item-${index + 1}`;
      const idMatch = text.match(/([A-Z]+-\d+|[A-Z]+\d+|#\d+)/);
      if (idMatch) {
        id = idMatch[0].replace(/^#/, '');
      }
      
      // Try to get score/value if available
      let score = null;
      const scoreElements = el.querySelectorAll('[class*="score"], [class*="value"], [class*="priority"]');
      for (const scoreEl of scoreElements) {
        const scoreText = scoreEl.textContent.trim();
        const scoreMatch = scoreText.match(/\d+(\.\d+)?/);
        if (scoreMatch) {
          score = parseFloat(scoreMatch[0]);
          break;
        }
      }
      
      // Extra for prioritization view - try to detect X and Y positions
      // This can give us the 2D position on a prioritization matrix
      const rect = el.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      
      return {
        id,
        rank: index + 1,
        text: text.trim().substring(0, 200),
        score,
        position,
        selector: usedSelector
      };
    });
  });
}

/**
 * Extract items from a board view (Kanban style)
 */
async function extractBoardViewItems(page: any): Promise<RankingItem[]> {
  return await page.evaluate(() => {
    // Board views typically have columns and cards within columns
    // First try to identify columns
    const columnSelectors = [
      '.column', '.board-column', '.lane', 
      '[data-test="column"]', '[data-test="lane"]'
    ];
    
    let columns = [];
    let columnSelector = '';
    
    for (const selector of columnSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        columns = Array.from(elements);
        columnSelector = selector;
        break;
      }
    }
    
    // If we found columns, extract items from each column
    if (columns.length > 0) {
      console.log(`Found ${columns.length} columns with selector: ${columnSelector}`);
      
      // Extract all items from all columns
      const allItems = [];
      
      columns.forEach((column, columnIndex) => {
        // Try to get column name
        const columnName = column.querySelector('h3, h4, .column-title, .lane-title')?.textContent.trim() || `Column ${columnIndex + 1}`;
        
        // Find items in this column
        const cardSelectors = [
          '.card', '.board-card', '.feature-card',
          '[data-test="card"]', '[data-test="feature-card"]'
        ];
        
        let columnItems = [];
        
        for (const selector of cardSelectors) {
          const cards = column.querySelectorAll(selector);
          if (cards.length > 0) {
            columnItems = Array.from(cards);
            break;
          }
        }
        
        // Process each item in the column
        columnItems.forEach((card, cardIndex) => {
          const text = card.textContent || '';
          
          // Try to extract ID
          let id = `item-c${columnIndex + 1}-${cardIndex + 1}`;
          const idMatch = text.match(/([A-Z]+-\d+|[A-Z]+\d+|#\d+)/);
          if (idMatch) {
            id = idMatch[0].replace(/^#/, '');
          }
          
          allItems.push({
            id,
            rank: (columnIndex * 1000) + cardIndex + 1, // Create a rank that preserves column order
            text: text.trim().substring(0, 200),
            column: columnName,
            columnIndex: columnIndex + 1,
            positionInColumn: cardIndex + 1,
          });
        });
      });
      
      return allItems;
    }
    
    // If columns approach didn't work, fall back to generic item extraction
    return [];
  });
}

/**
 * Extract items from a standard list view
 */
async function extractStandardListItems(page: any): Promise<RankingItem[]> {
  return await page.evaluate(() => {
    // Try various selectors for list items
    const selectors = [
      '.feature-list-item',
      '.pb-feature-card', 
      '[data-test="feature-card"]',
      '[data-test="feature-list-item"]',
      'tr.feature-row',
      'tr:not(.header-row)',
      '.card',
      '.item',
      'li'
    ];
    
    // Find the first selector that returns items
    let items = [];
    let usedSelector = '';
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} items with selector: ${selector}`);
        items = Array.from(elements);
        usedSelector = selector;
        break;
      }
    }
    
    // If no items found with standard selectors, try a more generic approach
    if (items.length === 0) {
      // Look for anything that looks like a card
      const candidates = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          // Basic size check
          const rect = el.getBoundingClientRect();
          return rect.width > 100 && rect.height > 30;
        });
      
      if (candidates.length > 0) {
        items = candidates;
        usedSelector = 'generic';
      }
    }
    
    // Extract data from the items
    return items.map((el, index) => {
      // Get the text content
      const text = el.textContent || '';
      
      // Try to extract ID using patterns
      let id = `item-${index + 1}`;
      const idMatch = text.match(/([A-Z]+-\d+|[A-Z]+\d+|#\d+)/);
      if (idMatch) {
        id = idMatch[0].replace(/^#/, '');
      }
      
      // Try to extract title - look for heading elements first
      let title = '';
      const headingEl = el.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="heading"]');
      if (headingEl) {
        title = headingEl.textContent.trim();
      } else {
        // Otherwise take the first line or substring as title
        title = text.split('\n')[0].trim() || text.substring(0, 50).trim();
      }
      
      // Try to extract description - take text after title
      let description = '';
      if (text.length > title.length) {
        description = text.substring(text.indexOf(title) + title.length).trim();
        // Limit description length
        if (description.length > 200) {
          description = description.substring(0, 200) + '...';
        }
      }
      
      return {
        id,
        rank: index + 1,
        title,
        description,
        selector: usedSelector
      };
    });
  });
}

/**
 * Generic extraction as a fallback method
 */
async function extractGenericItems(page: any): Promise<RankingItem[]> {
  return await page.evaluate(() => {
    // Try to find any elements that look like cards or list items
    const candidates = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        // Skip tiny elements, headers, and navigation
        const rect = el.getBoundingClientRect();
        
        // Skip elements that are too small
        if (rect.width < 100 || rect.height < 30) return false;
        
        // Skip if it's likely a header, navigation, or button
        const tag = el.tagName.toLowerCase();
        if (['header', 'nav', 'button', 'a'].includes(tag)) return false;
        
        // Skip if it has only a few characters of text
        const text = el.textContent || '';
        if (text.length < 10) return false;
        
        return true;
      })
      // Sort by vertical position to maintain order
      .sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectA.top - rectB.top;
      });
    
    // Extract data from candidates
    return candidates.map((el, index) => {
      const text = el.textContent || '';
      
      // Try to extract ID
      let id = `item-${index + 1}`;
      const idMatch = text.match(/([A-Z]+-\d+|[A-Z]+\d+|#\d+)/);
      if (idMatch) {
        id = idMatch[0].replace(/^#/, '');
      }
      
      return {
        id,
        rank: index + 1,
        text: text.trim().substring(0, 200)
      };
    });
  });
}

/**
 * Format raw scraped data into the structure expected by the productboard_rankings table
 */
function formatRankingData(scrapedData: any, boardId?: string, workspaceId?: number) {
  // Ensure we have items to process
  if (!scrapedData.items || !Array.isArray(scrapedData.items) || scrapedData.items.length === 0) {
    console.warn('No items found in scraped data');
    return [];
  }
  
  // Format the timestamp
  const timestamp = new Date().toISOString();
  
  // Format each item for the database
  return scrapedData.items.map((item: RankingItem) => {
    // Base record structure
    const record: any = {
      feature_id: item.id,
      rank: item.rank,
      scraping_method: 'session_tokens',
      last_updated: timestamp,
    };
    
    // Add optional fields if they exist
    if (boardId) record.board_id = boardId;
    if (workspaceId) record.workspace_id = workspaceId;
    
    // Add item title or text
    record.title = item.title || item.text || '';
    
    // Add description if available
    if (item.description) record.description = item.description;
    
    // Add score if available
    if (item.score !== null && item.score !== undefined) record.score = item.score;
    
    // Add position data for 2D prioritization views
    if (item.position) {
      record.position_x = item.position.x;
      record.position_y = item.position.y;
    }
    
    // Add board view data if available
    if (item.column) {
      record.column_name = item.column;
      record.column_index = item.columnIndex;
      record.position_in_column = item.positionInColumn;
    }
    
    // Add metadata about the page type
    record.page_type = scrapedData.metadata?.pageType || 'unknown';
    
    return record;
  });
}
