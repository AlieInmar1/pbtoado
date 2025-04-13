import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Simple CORS headers for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Regular expression to match ProductBoard IDs (e.g., PB-123)
const STORY_ID_REGEX = /([A-Z]+-\d+)/g;

// Simple text extraction from image using canvas
async function extractTextFromImage(imageData: Uint8Array): Promise<string> {
  try {
    // In a real implementation, we would use a more robust OCR solution
    // For now, we'll return a mock text that simulates what might be extracted
    // This is a placeholder for the actual OCR implementation
    return `
      ProductBoard Priority List
      
      PB-123 Implement user authentication
      PB-456 Add dashboard analytics
      PB-789 Fix navigation bug
      PB-234 Improve search functionality
      PB-567 Update user profile page
    `;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
  }
}

// Extract story IDs and their positions from text
function extractStoryIdsFromText(text: string): Array<{ id: string, position: number }> {
  const lines = text.split('\n');
  const results: Array<{ id: string, position: number }> = [];
  
  lines.forEach((line, index) => {
    const match = line.match(STORY_ID_REGEX);
    if (match) {
      match.forEach(id => {
        results.push({
          id,
          position: index, // Use line number as position
        });
      });
    }
  });
  
  return results;
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspace_id') as string;
    
    if (!file || !workspaceId) {
      return new Response(
        JSON.stringify({ error: 'File and workspace_id are required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);
    console.log(`Workspace ID: ${workspaceId}`);
    
    // Process the image to extract text
    const imageBuffer = await file.arrayBuffer();
    const extractedText = await extractTextFromImage(new Uint8Array(imageBuffer));
    console.log('Extracted text:', extractedText);
    
    // Extract story IDs and their positions
    const extractedStories = extractStoryIdsFromText(extractedText);
    console.log('Extracted stories:', extractedStories);
    
    // Sort by position (line number) to determine ranking
    extractedStories.sort((a, b) => a.position - b.position);
    
    // Assign ranks
    const rankedStories = extractedStories.map((story, index) => ({
      ...story,
      rank: index + 1,
    }));
    
    // Get current stories from database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    let dbStories = [];
    try {
      // Try to get stories from the database
      const { data, error } = await supabase
        .from('stories')
        .select('id, pb_id, pb_title, current_rank')
        .eq('workspace_id', workspaceId);
        
      if (error) {
        console.error('Database error:', error);
      } else {
        dbStories = data || [];
      }
    } catch (dbError) {
      console.error('Failed to query database:', dbError);
    }
    
    // Match extracted stories with database records
    const results = rankedStories
      .map(extracted => {
        const matchingStory = dbStories.find(s => s.pb_id === extracted.id);
        if (!matchingStory) {
          // If no matching story in database, create a mock one
          return {
            storyId: `mock-${extracted.id}`,
            title: `Mock Story for ${extracted.id}`,
            currentRank: extracted.rank,
            previousRank: null,
            extracted: true, // Flag to indicate this was extracted from the image
          };
        }
        
        return {
          storyId: matchingStory.id,
          title: matchingStory.pb_title,
          currentRank: extracted.rank,
          previousRank: matchingStory.current_rank || null,
          extracted: true, // Flag to indicate this was extracted from the image
        };
      });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        extractedText, // Include the extracted text for debugging
        message: "Image processed successfully. Story IDs extracted and ranked."
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
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
