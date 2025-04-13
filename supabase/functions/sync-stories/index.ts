import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { z } from 'npm:zod@3.22.4';
import axios from 'npm:axios@1.6.7';

// Helper function to map ProductBoard status to internal status
function mapProductBoardStatus(pbStatus: string): string {
  // Map ProductBoard status to your app's status
  const statusMap: Record<string, string> = {
    'new': 'open',
    'in-progress': 'in_progress',
    'done': 'done',
    // Add other status mappings as needed
  };
  return statusMap[pbStatus] || 'open';
}

// Helper function to determine the level of a feature
function determineLevel(feature: any): 'epic' | 'feature' | 'story' {
  // Logic to determine the level based on ProductBoard feature properties
  if (feature.parent === null) {
    return 'epic';
  } else if (feature.children?.length > 0) {
    return 'feature';
  }
  return 'story';
}

// Dynamic CORS configuration
const handleCors = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
};

const SyncRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  direction: z.enum(['push', 'pull', 'both']),
  storyIds: z.array(z.string().uuid()).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: handleCors(req) });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { workspaceId, direction, storyIds } = SyncRequestSchema.parse(body);

    // Get workspace configuration
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Get system-wide configuration for ProductBoard API key
    const { data: configs } = await supabase
      .from('configurations')
      .select('*')
      .is('workspace_id', null);
    
    const systemConfig = configs?.[0] || {};
    
    // Get workspace-specific configuration
    const { data: workspaceConfig } = await supabase
      .from('configurations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();
    
    // Use system-wide ProductBoard API key if available, otherwise use workspace-specific key
    const productboardApiKey = systemConfig.productboard_api_key || workspace.pb_api_key;
    
    if (!productboardApiKey) {
      throw new Error('ProductBoard API key not configured');
    }

    // Create sync log entry
    const { data: syncLog } = await supabase
      .from('sync_logs')
      .insert({
        workspace_id: workspaceId,
        action: `sync_${direction}`,
        status: 'in_progress',
      })
      .select()
      .single();

    try {
      // Get stories to sync
      const storiesQuery = supabase
        .from('stories')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (storyIds) {
        storiesQuery.in('id', storyIds);
      }

      const { data: stories } = await storiesQuery;

      // Perform sync based on direction
      if (direction === 'push' || direction === 'both') {
        // Push to Azure DevOps
        for (const story of stories || []) {
          if (story.sync_status !== 'conflict') {
            await supabase
              .from('stories')
              .update({
                sync_status: 'synced',
                ado_id: `ADO-${Date.now()}`, // Simulated ADO ID
                ado_title: story.pb_title,
              })
              .eq('id', story.id);
          }
        }
      }

      if (direction === 'pull' || direction === 'both') {
        // Pull from ProductBoard
        try {
          // Initialize ProductBoard client
          const pbClient = {
            baseUrl: 'https://api.productboard.com',
            headers: {
              'X-Version': '1',
              'Authorization': `Bearer ${productboardApiKey}`,
              'Content-Type': 'application/json',
            }
          };
          
          // Get features from ProductBoard for the specified board
          const response = await axios.get(`${pbClient.baseUrl}/features`, {
            headers: pbClient.headers,
            params: { board_id: workspace.pb_board_id }
          });
          
          const features = response.data.data || [];
          
          // Process each feature
          for (const feature of features) {
            // Map ProductBoard feature to Story model
            const storyData = {
              workspace_id: workspaceId,
              pb_id: feature.id,
              pb_title: feature.name,
              description: feature.description || null,
              status: mapProductBoardStatus(feature.status),
              level: determineLevel(feature),
              product_line: feature.product?.name || null,
              sync_status: 'synced',
            };
            
            // Check if story already exists
            const { data: existingStory } = await supabase
              .from('stories')
              .select('*')
              .eq('workspace_id', workspaceId)
              .eq('pb_id', feature.id)
              .single();
            
            if (existingStory) {
              // Update existing story
              await supabase
                .from('stories')
                .update({
                  ...storyData,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingStory.id);
            } else {
              // Create new story
              await supabase
                .from('stories')
                .insert(storyData);
            }
          }
        } catch (error) {
          console.error('Error syncing with ProductBoard:', error);
          throw new Error(`ProductBoard sync failed: ${error.message}`);
        }
      }

      // Update sync log
      await supabase
        .from('sync_logs')
        .update({
          status: 'completed',
        })
        .eq('id', syncLog.id);

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...handleCors(req),
          },
        }
      );
    } catch (error) {
      // Update sync log with error
      await supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', syncLog.id);

      throw error;
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...handleCors(req),
        },
      }
    );
  }
});
