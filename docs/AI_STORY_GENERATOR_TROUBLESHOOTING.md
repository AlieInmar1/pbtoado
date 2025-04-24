# AI Story Generator Troubleshooting Guide

## Issue Summary

The AI story generation functions were returning default/mock data instead of using real AI-generated content. This happened because:

1. The Edge Functions were using mock implementations instead of actually calling OpenAI's API
2. The OpenAI API key wasn't being properly passed to the functions
3. Import statements in the Deno Edge Functions needed fixing

## Fixes Implemented

We've made the following changes to enable real AI-powered story generation:

### 1. Updated the `generate-story-from-idea` Edge Function

- Added real OpenAI API integration with proper error handling
- Implemented fallback to mock data if the API call fails
- Improved the prompt engineering for better story generation
- Added parsing logic to extract structured data from the AI response
- Fixed import statements to use proper Deno modules

### 2. Updated the Deployment Script

- Enhanced `scripts/deploy-idea-to-story-function.sh` to properly set environment variables
- Added automatic OpenAI API key extraction from the `.env` file
- Added clear error messages and warnings when the API key is missing
- Improved local testing instructions

## How to Use the AI Story Generator

### Setting Up

1. Make sure your OpenAI API key is properly set in your `.env` file:
   ```
   OPENAI_API_KEY=your-openai-api-key
   ```

2. Deploy the updated Edge Function:
   ```bash
   chmod +x scripts/deploy-idea-to-story-function.sh
   ./scripts/deploy-idea-to-story-function.sh
   ```

3. Verify the function has been deployed and the API key is set:
   ```bash
   supabase functions list
   ```

### Testing the Story Generator

You can test the function locally before using it in the application:

```bash
supabase functions serve generate-story-from-idea --no-verify-jwt --env-file .env
```

Then in another terminal:

```bash
curl -X POST http://localhost:54321/functions/v1/generate-story-from-idea \
  -H "Content-Type: application/json" \
  -d '{"idea":"A feature that helps teams organize and track their work items", "domain":"product", "audience":"enterprise", "priority":"high"}'
```

### Understanding the Response

The function will return a JSON object with the following structure:

```json
{
  "title": "Enterprise Team Workload Management",
  "description": "This feature provides teams with a clear, visual way to organize and track work items...",
  "acceptance_criteria": "• Teams can create and customize work item categories\n• ...",
  "investment_category": "Product Enhancement",
  "reach_score": 80,
  "impact_score": 80,
  "confidence_score": 60,
  "effort_score": 2.5,
  "timeframe": "Q2 2025",
  "tags": ["enterprise", "productivity", "teams", "tracking"],
  "customer_need_description": "Enterprise teams need better visibility into their work distribution..."
}
```

### Troubleshooting

If you encounter issues:

1. **Check your OpenAI API key**: Make sure it's valid and has sufficient quota
2. **Examine logs**: Run `supabase logs` to see any error messages
3. **Test with mock data**: Even without an API key, you should get structured mock data
4. **Check network connectivity**: The Edge Function needs to be able to reach the OpenAI API

## Additional Notes

- The stories are generated using GPT-4o (when available)
- Response parsing is designed to handle variations in AI output format
- If the API fails or is not configured, the system will fall back to predefined mock data
- The mock data provides a reasonable structure but lacks the contextual understanding of the AI

For more advanced customization of the prompts, see the `generateStoryWithAI` function in `supabase/functions/generate-story-from-idea/index.ts`.
