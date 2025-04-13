import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

// Dynamic CORS configuration
const handleCors = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };
};

// Project details interface
interface ProjectDetails {
  id: string;
  name: string;
  url: string;
}

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: handleCors(req) 
    });
  }

  try {
    // Parse request body
    const requestBody = await req.json();
    console.log('Request received with organization, project, and API key');
    
    const { organization, project, api_key } = requestBody;
    
    // Validate minimal required parameters
    if (!organization || !api_key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters: organization or api_key',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...handleCors(req),
          },
        }
      );
    }

    // FIRST, verify organization exists using organization-level endpoint
    // This is the correct endpoint according to Azure DevOps API docs
    const orgBaseUrl = `https://dev.azure.com/${organization}/_apis`;
    const url = `${orgBaseUrl}/projects?api-version=7.0`;
    
    console.log(`Azure DevOps API URL: ${url}`);
    
    // Create Basic Auth header with PAT token using `:token` format - exactly like the client
    const credentials = `:${api_key}`;
    const encodedCredentials = encode(new TextEncoder().encode(credentials));
    const authHeader = `Basic ${encodedCredentials}`;
    console.log('Auth header created');
    
    // Make the API request
    console.log('Sending request to Azure DevOps API...');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Azure DevOps API response status: ${response.status}`);
    
    // For debugging, get the response as text first
    const responseText = await response.text();
    console.log('Response length:', responseText.length);
    console.log('Response preview:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    // Check if we got HTML instead of JSON (sign of auth failure)
    const isHtmlResponse = responseText.includes('<!DOCTYPE') || 
                          responseText.includes('<html');
    
    if (isHtmlResponse) {
      console.log('Received HTML response - authentication failed');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication failed. Please check your Personal Access Token.',
          details: {
            status: response.status,
            responseType: 'html',
            preview: responseText.substring(0, 100) + '...',
          },
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...handleCors(req),
          },
        }
      );
    }
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Successfully parsed JSON response');
    } catch (e) {
      console.log('Response is not valid JSON');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid response format from Azure DevOps API',
          details: {
            status: response.status,
            responsePreview: responseText.substring(0, 200),
          },
        }),
        {
          status: 500, 
          headers: {
            'Content-Type': 'application/json',
            ...handleCors(req),
          },
        }
      );
    }
    
    // Check for auth errors
    if (response.status === 401 || response.status === 403) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication failed. Please check your Personal Access Token.',
          details: {
            status: response.status,
            message: data.message || 'Invalid authorization credentials',
          },
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...handleCors(req),
          },
        }
      );
    }
    
    // For other non-auth errors at organization level
    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.message || `Request failed with status ${response.status}`,
          details: {
            status: response.status,
            data: data,
          },
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            ...handleCors(req),
          },
        }
      );
    }
    
    // At this point, we've verified that the organization exists and the PAT is valid
    
    // SECOND, if project was provided, validate it exists in the organization
    if (project) {
      // Check if the project exists in the list of projects
      const projects = data.value || [];
      const projectExists = projects.some((p: any) => 
        p.name?.toLowerCase() === project.toLowerCase() || 
        p.id?.toLowerCase() === project.toLowerCase()
      );
      
      if (!projectExists) {
        // Return available projects so the UI can show options
        const availableProjects = projects.map((p: any) => p.name);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: `Project '${project}' not found in organization '${organization}'`,
            details: {
              availableProjects: availableProjects,
            },
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...handleCors(req),
            },
          }
        );
      }
    }
    
    // Success response - authentication works and project exists if specified
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully connected to Azure DevOps',
        details: {
          organization: organization,
          project: project,
          availableProjects: data.value ? data.value.map((p: any) => p.name) : []
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...handleCors(req),
        },
      }
    );
  } catch (error) {
    // General error handler
    console.error('Error in Azure DevOps test function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        stack: error instanceof Error ? error.stack : undefined,
      }),
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
