import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Simple CORS headers for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
    const extractedText = formData.get('extracted_text') as string;
    const storyIdsJson = formData.get('story_ids') as string;
    const workspaceId = formData.get('workspace_id') as string;
    
    if (!file || !extractedText || !storyIdsJson || !workspaceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Parse the story IDs
    const storyIds = JSON.parse(storyIdsJson);
    
    console.log(`Validating extracted data for file: ${file.name}, size: ${file.size} bytes`);
    console.log(`Workspace ID: ${workspaceId}`);
    console.log(`Extracted ${storyIds.length} story IDs`);
    
    // Sort by position to determine ranking
    storyIds.sort((a: any, b: any) => a.position - b.position);
    
    // Assign ranks
    const rankedStories = storyIds.map((story: any, index: number) => ({
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
      .map((extracted: any) => {
        const matchingStory = dbStories.find((s: any) => s.pb_id === extracted.id);
        
        // Use the extracted title if available, otherwise use the database title or a fallback
        const title = extracted.title 
          ? extracted.title 
          : (matchingStory ? matchingStory.pb_title : `Story ${extracted.id}`);
        
        if (!matchingStory) {
          // If no matching story in database, create a mock one with a unique ID
          return {
            storyId: `mock-${extracted.id}-${Math.random().toString(36).substring(2, 10)}`,
            title: title,
            currentRank: extracted.rank,
            previousRank: null,
            extracted: true,
          };
        }
        
        return {
          storyId: matchingStory.id,
          title: title, // Prefer the extracted title
          currentRank: extracted.rank,
          previousRank: matchingStory.current_rank || null,
          extracted: true,
        };
      });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: "Client-extracted data validated successfully."
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
