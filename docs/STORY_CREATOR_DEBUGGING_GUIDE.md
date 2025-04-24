# Story Creator Debugging Guide

This document provides troubleshooting steps for the AI story/feature creator system, particularly for issues related to state transfer between components.

## Common Issues

### State Not Transferred Between Components

One of the most common issues is when the state (generated story data) is not properly passed from the `IdeaToStoryGenerator` component to the `StoryCreatorPage` component after clicking "Continue to Full Editor".

#### Diagnosis

1. **Check Browser Console:** 
   We've added enhanced logging to help diagnose the issue. Open your browser's developer console to see detailed logs about:
   - Navigation state preparation in IdeaToStoryGenerator
   - Navigation attempt
   - StoryCreatorPage initialization and state reception
   - Story state updates in StoryCreatorWizard

2. **Verify Route Configuration:**
   Make sure the routes are properly configured in `src/features/story-creator/routes.tsx` and imported in `App.tsx`.

3. **Test Data Flow:**
   Use the test script at `src/test-story-creator.js` to validate the database structure and routing configuration.

### Debugging Process

1. **Component Initialization:**
   - Both components now log their initialization and state changes
   - Look for `"StoryCreatorPage initializing, location state:"` to verify data is being received
   - Look for `"Initial story from location:"` to see what data was extracted
   - Look for `"StoryCreatorWizard received initialStory:"` to confirm data was passed down

2. **Navigation Process:**
   - The IdeaToStoryGenerator now logs each step of the navigation process
   - Look for `"Navigating to editor with story:"` to see the data being passed
   - Look for `"Navigation state:"` to see the formatted state object
   - Look for `"Navigation called - check if this appears in console"` to verify the navigation was attempted

3. **React Router State:**
   - The enhanced logging shows the complete location object
   - Look for `"Location object:"` to inspect the entire React Router location object

## Running the Test Script

The test script helps verify if your database is properly configured and provides steps to test the data flow:

```bash
node src/test-story-creator.js
```

The script will:
1. Check if the stories table exists in your database
2. Validate the table structure
3. List any existing stories
4. Provide instructions for manual testing of the routing and state transfer

## Fixes Implemented

We've enhanced the following components with debugging capabilities:

1. **IdeaToStoryGenerator.tsx**:
   - Added error checking before navigation
   - Added detailed logging of navigation state
   - Added post-navigation logging

2. **StoryCreatorPage.tsx**:
   - Added initialization and location state logging
   - Improved state extraction with clearer variable names
   - Added effect to track state changes

3. **StoryCreatorWizard.tsx**:
   - Added useEffect to monitor story state changes
   - Added detailed initialization logging

## Next Steps for Troubleshooting

If issues persist after reviewing the logs:

1. **Check for Browser Extensions:**
   - Some browser extensions might interfere with React Router state
   - Try testing in Incognito/Private mode

2. **Verify React Router Version:**
   - Make sure all components are using the same version of React Router

3. **Check for Code Splitting:**
   - If using code splitting/lazy loading, ensure components are properly loaded

4. **Database Connectivity:**
   - Verify Supabase connection is working correctly using the test script

## Feature Flow Diagram

```
┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
│                      │      │                      │      │                      │
│ StoryCreatorLanding  │──┬──►│ IdeaToStoryGenerator │─────►│   StoryCreatorPage   │
│                      │  │   │                      │      │                      │
└──────────────────────┘  │   └──────────────────────┘      └──────────────────────┘
                          │                                           │
                          │                                           │
                          │   ┌──────────────────────┐                │
                          │   │                      │                │
                          └──►│   StoryCreatorPage   │◄───────────────┘
                              │      (Direct)        │
                              │                      │
                              └──────────────────────┘
```

The data flow between `IdeaToStoryGenerator` and `StoryCreatorPage` uses React Router's location state to pass the generated story data.
