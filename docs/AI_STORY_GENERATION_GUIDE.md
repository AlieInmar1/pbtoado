# AI Story Generation Guide

## Overview

The AI Story Generator is a powerful feature that helps product managers, developers, and stakeholders create well-structured stories, features, and epics for ProductBoard. It uses advanced AI to transform simple inputs into properly formatted requirements with appropriate titles, descriptions, and acceptance criteria.

## Features

- Generate user stories, features, and epics with proper formatting
- Automatically create acceptance criteria in the "Given/When/Then" format
- Support for component-specific context
- Intelligent parsing of user inputs to extract key information

## How to Use

### Basic Usage

1. In the Story Creator form, enter your idea or problem statement in the "Quick Idea Entry" text area
2. Select the appropriate hierarchy level (Story, Feature, or Epic)
3. Click "Generate with AI"
4. Review and edit the generated content as needed
5. Complete any additional required fields
6. Submit the story to ProductBoard

### Example Inputs

#### For Stories

Input:
```
Create a login feature
```

Output:
```
Title: Implement Secure User Login Feature

Description: As a registered user, I want to securely log into the application using my username and password so that I can access my personal account and associated features.

Acceptance Criteria:
- Given that a user has navigated to the login page, when the user enters their valid username and password and clicks on the login button, then the user should be authenticated and redirected to their dashboard.
- Given that a user has entered an incorrect username or password, when the user attempts to log in, then the user should be presented with an error message.
- Given that a user has forgotten their password, when they click on the "Forgot Password" link, then they should be redirected to a page where they can enter their email address to receive a password reset link.
```

#### For Features

Input:
```
Create a login feature
```

Output:
```
Title: Secure User Login System

Description: The Secure User Login System feature is designed to facilitate a secure and efficient way for users to access their accounts within the application. This feature is intended for all users, ensuring that their personal and application data are protected through authentication.

Acceptance Criteria:
- Given the login feature must support both password-based and biometric authentication methods.
- Given after three consecutive failed login attempts, the user's account will be temporarily locked for a period of 10 minutes.
- Given the feature must include a "Forgot Password" option allowing users to securely reset their password.
- Given the system must encrypt user passwords and personal information stored in the database.
- Given the login process must be completed in less than 5 seconds under standard network conditions.
```

#### For Epics

Input:
```
Create a login feature
```

Output:
```
Title: Secure User Authentication System

Description: This epic focuses on creating a robust, secure, and user-friendly login feature for our application. This system is designed to ensure that users can securely access their accounts, protect their personal information, and enhance the overall user experience.

Acceptance Criteria:
- Given the login feature must support authentication via username and password with options to integrate social media logins and 2FA.
- Given we must ensure the login process complies with security best practices including encrypted data transmission.
- Given we need to implement user-friendly error messages and guidance for login failures.
- Given we should provide a seamless and responsive login interface on both desktop and mobile platforms.
- Given we must incorporate user feedback mechanisms to identify pain points in the login process.
```

### Advanced Usage

#### Component-Specific Generation

When generating a story for a specific component, select the component from the dropdown before generating. The AI will tailor the story to be relevant to that component.

#### Editing Generated Content

The AI-generated content is a starting point. You should review and edit:

1. The title to ensure it's concise and descriptive
2. The description to add any specific details relevant to your project
3. The acceptance criteria to ensure they cover all necessary scenarios

## Best Practices

1. **Be specific in your input**: The more specific your input, the better the AI can generate relevant content.
2. **Review and edit**: Always review and edit the generated content to ensure it meets your specific requirements.
3. **Add technical details**: The AI provides a good structure, but you may need to add technical details specific to your implementation.
4. **Validate acceptance criteria**: Ensure the acceptance criteria cover all the necessary scenarios and edge cases.

## Troubleshooting

If the AI-generated content doesn't meet your expectations:

1. Try providing more specific input with more details
2. Manually edit the generated content to better fit your needs
3. Try breaking down complex requirements into multiple, simpler stories

## Feedback

We're continuously improving the AI Story Generator. If you have feedback or suggestions, please share them with the development team.
