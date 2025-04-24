import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestPayload {
  pbStoryUrl: string;
  adoProjectName: string;
  adoStoryId: string;
}

interface AuthTokenData {
  cookies: Record<string, any>[];
  local_storage: Record<string, any>;
}

// Helper function to create Supabase client with Service Role Key
function createAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getLatestAuthTokens(supabaseAdmin: SupabaseClient): Promise<AuthTokenData> {
  console.log('Fetching latest Productboard auth tokens...');
  const { data, error } = await supabaseAdmin
    .from('productboard_auth_tokens')
    .select('cookies, local_storage')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching auth tokens:', error);
    throw new Error(`Failed to fetch Productboard auth tokens: ${error.message}`);
  }
  if (!data) {
    throw new Error('No Productboard auth tokens found in the database.');
  }
  console.log('Successfully fetched auth tokens.');
  return data as AuthTokenData;
}

async function runApifyActor(actorId: string, input: any): Promise<any> {
  const apifyToken = Deno.env.get('APIFY_TOKEN');
  if (!apifyToken) {
    throw new Error('Missing APIFY_TOKEN environment variable.');
  }

  const apiUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}&waitForFinish=120`; // Wait up to 120 seconds

  console.log(`Calling Apify Actor: ${actorId}...`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    console.log(`Apify API response status: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Apify API error response:', errorBody);
      throw new Error(`Apify API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    console.log('Apify Actor run finished.');

    // Check Apify run status (e.g., SUCCEEDED, FAILED, TIMED_OUT)
    if (result?.data?.status !== 'SUCCEEDED') {
        console.error('Apify Actor run did not succeed:', result?.data?.status);
        // Attempt to fetch the actor run's dataset items (output) even on failure, if available
        const output = await fetchActorOutput(actorId, result?.data?.id, apifyToken);
        throw new Error(`Apify Actor run failed or timed out. Status: ${result?.data?.status}. Output: ${JSON.stringify(output)}`);
    }

    // Fetch the output from the dataset
    const output = await fetchActorOutput(actorId, result?.data?.id, apifyToken);
    return output;

  } catch (error) {
    console.error('Error calling Apify Actor:', error);
    throw new Error(`Failed to run Apify actor: ${error.message}`);
  }
}

// Helper to fetch Actor output from its default dataset
async function fetchActorOutput(actorId: string, runId: string, apifyToken: string): Promise<any> {
    if (!runId) {
        console.warn('Cannot fetch actor output without run ID.');
        return { success: false, message: 'Apify run ID not available.' };
    }
    const datasetUrl = `https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items?token=${apifyToken}`;
    console.log(`Fetching output from dataset for run ${runId}...`);
    try {
        const response = await fetch(datasetUrl);
        if (!response.ok) {
            console.error(`Failed to fetch dataset items: ${response.status}`);
            return { success: false, message: `Failed to fetch Apify output: ${response.status}` };
        }
        const items = await response.json();
        // Assuming the actor pushes a single object with { success, message } using Actor.setValue('OUTPUT', ...)
        // which lands in the default dataset.
        if (items && items.length > 0) {
            console.log('Successfully fetched actor output.');
            return items[0]; // Return the first (and likely only) item
        } else {
            console.warn('Apify Actor run dataset is empty.');
            return { success: false, message: 'Apify Actor run produced no output.' };
        }
    } catch (error) {
        console.error('Error fetching Apify dataset:', error);
        return { success: false, message: `Error fetching Apify output: ${error.message}` };
    }
}


serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: RequestPayload = await req.json();
    console.log('Received payload:', payload);

    if (!payload.pbStoryUrl || !payload.adoProjectName || !payload.adoStoryId) {
      throw new Error('Missing required fields in request payload.');
    }

    const supabaseAdmin = createAdminClient();
    const authData = await getLatestAuthTokens(supabaseAdmin);

    const actorInput = {
      pbStoryUrl: payload.pbStoryUrl,
      adoProjectName: payload.adoProjectName,
      adoStoryId: payload.adoStoryId,
      pbCookies: authData.cookies,
      pbLocalStorage: authData.local_storage,
    };

    const actorId = 'alexandra.cohen/pb-ado-linker'; // Your Actor ID
    const actorResult = await runApifyActor(actorId, actorInput);

    console.log('Apify Actor Result:', actorResult);

    // Check the structure of the result from the actor
    if (typeof actorResult !== 'object' || actorResult === null || typeof actorResult.success !== 'boolean') {
        console.error('Unexpected result format from Apify Actor:', actorResult);
        throw new Error('Received unexpected result format from Apify Actor.');
    }

    if (!actorResult.success) {
        // Actor itself reported failure
        throw new Error(actorResult.message || 'Apify Actor reported failure without a specific message.');
    }

    // Success
    return new Response(
      JSON.stringify({ message: actorResult.message || 'Successfully triggered Apify Actor.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in Supabase function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500, // Use 500 for internal server errors
      }
    );
  }
});

console.log('Supabase function pb-link-via-ui-node (Apify version) initialized.');
