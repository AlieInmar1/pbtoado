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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: handleCors(req) });
  }

  try {
    const { api_key } = await req.json();

    if (!api_key) {
      throw new Error('API key is required');
    }

    if (!api_key.startsWith('sk-')) {
      throw new Error('Invalid API key format. Key should start with "sk-"');
    }

    // Test API connectivity using fetch
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 5,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to connect to OpenAI');
    }

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
    console.error('OpenAI test error:', error);
    
    let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Enhance error message for common issues
    if (errorMessage.includes('Failed to fetch')) {
      errorMessage = 'Network error: Unable to connect to OpenAI API. Please check your internet connection.';
    } else if (errorMessage.includes('401')) {
      errorMessage = 'Invalid API key. Please check your OpenAI API key.';
    } else if (errorMessage.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please try again later or check your API quota.';
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false
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
