# AI Story Creator - User Guide

This guide explains how to use the AI-powered Story Creator to generate well-structured product stories quickly and effectively.

## Overview

The AI Story Creator is a powerful tool that helps product managers, developers, and other stakeholders create comprehensive, well-structured stories for product features with AI assistance. It can transform simple ideas into fully-fledged stories with all the necessary elements like title, description, acceptance criteria, and RICE scoring.

## Accessing the AI Story Generator

There are two ways to access the AI Story Generator:

1. From the main navigation, go to **Story Creator** in the sidebar
2. Direct link: `/story-creator/from-idea`

## How to Generate a Story from an Idea

### Step 1: Enter Your Idea

1. In the **Your Idea** field, enter a brief description of your feature idea
   - Be clear and concise, but include enough detail for the AI to understand
   - Example: "A dashboard that shows users their activity metrics over time"

### Step 2: Select Context Parameters

These parameters help the AI understand the context of your idea:

1. **Domain**: Select the most relevant domain for your idea
   - Options include Product, Marketing, Support, Security, Performance, User Experience
   - This helps frame the generated content appropriately

2. **Target Audience**: Choose who the feature is intended for
   - Options include All Users, Enterprise, Small Business, Developers, Designers, Product Managers
   - This helps tailor the content to address specific user needs

3. **Priority**: Set the importance level
   - Options include Low, Medium, High, Critical
   - Affects the generated timeframe and RICE scoring

### Step 3: Add Additional Context (Optional)

For more tailored results, you can provide:

1. **Parent Feature**: If this story is part of a larger feature
   - Example: "User Analytics Platform"
   - Helps establish relationship context

2. **Component**: The specific component this relates to
   - Example: "Reporting Module"
   - Helps with technical context

### Step 4: Generate the Story

1. Click the **Generate Story** button
2. Wait while the AI processes your request (typically 5-15 seconds)

## Understanding the Generated Story

The AI will generate a complete story with the following elements:

### Basic Information

- **Title**: A concise, descriptive title for the story
- **Description**: A comprehensive explanation of the feature and its value

### Acceptance Criteria

A list of specific, testable conditions that must be met for the story to be considered complete. These will be formatted as bullet points for clarity.

### Classification

- **Investment Category**: How the story is categorized (e.g., Product Enhancement, New Feature)
- **Timeframe**: Suggested implementation timeframe (e.g., Q2 2025)

### RICE Scoring

The AI will provide suggested values for:

- **Reach**: How many users will be impacted (0-100)
- **Impact**: How significant the impact will be (0-100)
- **Confidence**: How confident we are in the estimates (0-100)
- **Effort**: How much work is required (0.5-5, with higher numbers meaning more effort)

### Tags & Customer Need

- **Tags**: Relevant keywords to categorize the story
- **Customer Need Description**: A summary of the underlying customer need

## Editing and Refining

After generating a story:

1. Review the generated content
2. If needed, you can:
   - Reset and try again with a modified idea
   - Copy elements you like into the full Story Creator form

## Tips for Best Results

1. **Be specific**: "A feature to improve user onboarding" is too vague. "A step-by-step interactive guide for new users that highlights key features" is better.

2. **Include the problem**: Mention what problem your idea solves, not just what it does.

3. **Mention key constraints**: If there are important limitations or requirements, include them.

4. **Try different domains**: If you're not satisfied with the results, try generating the same idea under different domains.

5. **Combine with manual editing**: The AI gives you a great starting point, but you can always refine further in the Story Creator.

## Examples

### Example 1: Simple Feature

**Idea**: "Allow users to export their data in CSV format"

**Good parameters**:
- Domain: Product
- Audience: All Users
- Priority: Medium

### Example 2: Complex Enterprise Feature

**Idea**: "Create a permission system that allows admins to set granular access controls for different user roles"

**Good parameters**:
- Domain: Security
- Audience: Enterprise
- Priority: High
- Component: "Authentication System"

## Troubleshooting

If you encounter issues:

- **Generation takes too long**: Refresh and try again with a simpler idea
- **Content seems generic**: Add more specific details to your idea
- **Missing important elements**: Check if you selected the appropriate domain and context parameters

For technical issues, please refer to the AI Story Generator Troubleshooting Guide.
