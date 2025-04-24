# Grooming System Enhancements

This document outlines the enhancements made to the grooming system to support editable discussion points, decisions, and questions.

## Overview

The grooming system has been enhanced to allow users to edit and delete discussion points, decisions, and questions during grooming sessions. This provides a more flexible and interactive experience for teams during grooming sessions.

## Changes Made

### Database Changes

A new migration file (`0015_add_decisions_questions_to_session_stories.sql`) has been created to add the following columns to the `session_stories` table:

- `decisions` (JSONB): Stores an array of decisions made during the grooming session for a story
- `questions` (JSONB): Stores an array of questions raised during the grooming session for a story

The `discussion_points` column already existed in the database schema.

### TypeScript Interface Updates

The following interfaces in `src/types/grooming.ts` have been updated:

- `SessionStory`: Added `discussion_points`, `decisions`, and `questions` properties
- `UpdateSessionStoryRequest`: Added `discussion_points`, `decisions`, and `questions` properties

### New React Query Hooks

New hooks have been added to `src/hooks/useSessionStories.ts`:

- `useUpdateDiscussionPoints`: Updates the discussion points for a session story
- `useUpdateDecisions`: Updates the decisions for a session story
- `useUpdateQuestions`: Updates the questions for a session story

### Component Updates

The following components have been updated:

- `StoryDiscussionCard`: Now uses the `EditableItem` component for discussion points, decisions, and questions
- `GroomingStoryDetail`: Updated to pass the new props to the `StoryDiscussionCard` component
- `StoriesTab`: Updated to use the new hooks and pass the handler functions to the `GroomingStoryDetail` component

## How It Works

1. Users can now add, edit, and delete discussion points, decisions, and questions during grooming sessions.
2. The changes are persisted to the database using the new hooks.
3. The UI provides a more interactive experience with the `EditableItem` component.

## Future Improvements

- Add validation for discussion points, decisions, and questions
- Add support for assigning owners to action items
- Enhance the UI with additional features like sorting and filtering
