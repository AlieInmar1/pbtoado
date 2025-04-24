# AI Story Creator Troubleshooting Guide

This guide helps troubleshoot issues with the AI integration in the Story Creator system.

## Common Issues and Solutions

### AI Recommendations Not Working

If the AI recommendation panel doesn't generate real suggestions:

1. **Check Edge Function Deployment**
   - Verify that the `analyze-story-content` function is deployed to your Supabase project
   - Run the deployment script: `./scripts/deploy-story-ai-function.sh`

2. **Verify Environment Variables**
   - Make sure your `.env` file contains these variables:
     ```
     OPENAI_API_KEY=your_api_key_here
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```
   - Ensure these variables are also set in the Supabase Dashboard:
     - Go to Supabase Dashboard > Functions > analyze-story-content > Settings
     - Add OPENAI_API_KEY to the environment variables

3. **Check Network Requests**
   - Open your browser's Developer Tools (F12) > Network tab
   - Generate a suggestion in the UI and look for requests to `/functions/v1/analyze-story-content`
   - Check the status (should be 200) and the response content

### Testing the AI Generation API Directly

You can test the AI function directly using curl:

```bash
curl -X POST 'https://your-project-id.supabase.co/functions/v1/analyze-story-content' \
  -H 'Authorization: Bearer your_anon_key' \
  -H 'Content-Type: application/json' \
  -d '{"input": "Create a user story for a feature that allows users to filter content"}'
```

If this works but the UI still doesn't show results, check the browser console for errors.

## AIRecommendationPanel Component

The `AIRecommendationPanel` component has been updated to use real AI generation instead of static mockups. It:

1. Calls the `generateStoryWithAI` function from `aiStoryGenerator.ts`
2. Formats the input based on the current field and story content
3. Displays generated suggestions with Apply buttons

If you notice the Apply buttons not working, ensure the `onSuggestionApply` callback is properly connected to the parent component.

## Logging and Debugging

Add enhanced logging to help identify where issues occur:

```typescript
// In aiStoryGenerator.ts
console.log('[AI] Starting generation with input:', request.input);
// After each major step
console.log('[AI] Function invocation completed');
```

## Redeploying the Function

If you make changes to the Edge Function code, redeploy it using:

```bash
chmod +x ./scripts/deploy-story-ai-function.sh
./scripts/deploy-story-ai-function.sh
```

## CORS and API Access Issues

If you see CORS errors in the console:

1. Check that the `corsHeaders` are properly configured in the Edge Function
2. Verify that your Supabase project allows requests from your frontend's origin
3. Try using the direct fetch fallback approach in `aiStoryGenerator.ts`
