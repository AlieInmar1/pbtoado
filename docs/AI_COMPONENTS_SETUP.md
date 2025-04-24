# Setting Up AI Components in the Grooming System

This guide explains how to set up and use the AI-powered components in the grooming system using your OpenAI API key.

## Overview

The grooming system includes several AI-powered features:

1. **AI Insights Panel** - Displays AI analysis of grooming sessions and stories
2. **Transcript Analysis** - Analyzes grooming session transcripts to extract key points, action items, risks, and suggestions
3. **Story Analysis** - Analyzes user stories to provide feedback on clarity, completeness, testability, and more

These features are implemented using Supabase Edge Functions that call the OpenAI API.

## Prerequisites

- A Supabase account and project
- An OpenAI API key
- Supabase CLI installed (for deploying Edge Functions)

## Setup Steps

### 1. Configure Environment Variables

1. Create a `.env` file in the root directory of the project:
   ```bash
   # Use the example file as a template
   cp supabase/.env.example .env
   ```

2. Edit the `.env` file and add your OpenAI API key and Supabase credentials:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

   You can find your Supabase URL and service role key in the Supabase dashboard under Project Settings > API.

### 2. Deploy Edge Functions

You can deploy the Edge Functions using the provided script:

1. Make sure the script is executable:
   ```bash
   chmod +x scripts/deploy-ai-functions.sh
   ```

2. Run the script:
   ```bash
   ./scripts/deploy-ai-functions.sh
   ```

Alternatively, you can deploy the functions manually:

1. Login to Supabase CLI:
   ```bash
   supabase login
   ```

2. Link your local project to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Deploy the Edge Functions:
   ```bash
   supabase functions deploy analyze-transcript
   supabase functions deploy analyze-story
   ```

### 3. Set Environment Variables in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Settings > Functions
3. Add the following environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Using the AI Features

### Transcript Analysis

1. Create a grooming session
2. Upload a transcript (text file) using the TranscriptUploadModal
3. The system will automatically analyze the transcript and display insights in the AI Insights Panel

### Story Analysis

1. Create or select a story
2. View the story details
3. The AI Insights Panel will display analysis and suggestions for improving the story

## Troubleshooting

If you encounter issues with the AI components:

1. **Check Edge Function Logs**:
   ```bash
   supabase functions logs analyze-transcript
   supabase functions logs analyze-story
   ```

2. **Verify Environment Variables**:
   Ensure that all environment variables are correctly set in both your local `.env` file and in the Supabase dashboard.

3. **Check OpenAI API Key**:
   Verify that your OpenAI API key is valid and has sufficient credits.

4. **Fallback to Mock Data**:
   The system is designed to fall back to mock data if the AI analysis fails. This ensures that the UI remains functional even if there are issues with the OpenAI API or Edge Functions.

## Advanced Configuration

### Changing the OpenAI Model

By default, the system uses the `gpt-4` model for analysis. If you want to use a different model:

1. Open `supabase/functions/analyze-transcript/index.ts` and `supabase/functions/analyze-story/index.ts`
2. Find the `model` parameter in the `openai.createChatCompletion` call
3. Change it to your preferred model (e.g., `gpt-3.5-turbo`)

### Customizing Prompts

You can customize the prompts used for analysis:

1. Open `supabase/functions/analyze-transcript/index.ts` or `supabase/functions/analyze-story/index.ts`
2. Find the `prompt` variable
3. Modify the prompt to suit your needs

## Security Considerations

- The OpenAI API key and Supabase service role key are sensitive credentials. Never commit them to version control.
- The Edge Functions use the service role key, which has full access to your database. Ensure that the functions include proper validation and security checks.
- Consider implementing rate limiting to prevent abuse of the OpenAI API.
