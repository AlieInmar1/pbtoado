# Database Troubleshooting Guide

This guide provides instructions for diagnosing and fixing database-related issues in the application, particularly when features or components are not appearing in the Story Creator form.

## Common Issues

1. **Empty Database Tables**: The database tables might be empty or not populated with the necessary data.
2. **Connection Issues**: The application might not be able to connect to the Supabase database.
3. **Permission Issues**: The Supabase anonymous key might not have the necessary permissions to access the data.
4. **RLS (Row Level Security) Policies**: The RLS policies might be restricting access to the data.
5. **Data Structure Mismatches**: The application might be looking for fields with different names than what's in the database (e.g., `type` vs `feature_type`).

## Diagnostic Tools

We've created two diagnostic tools to help identify and fix these issues:

### 1. Database Check Tool

This tool checks if the required database tables exist and have data.

```bash
npm run check-db
```

This will:
- Verify the Supabase connection
- Check if the required tables exist
- Count the number of rows in each table
- Fetch a sample row from each table
- Check RLS policies

### 2. Sample Data Population Tool

This tool populates the database with sample data for testing.

```bash
npm run populate-db
```

This will:
- Check if data already exists in the database
- If not, insert sample data including:
  - A test workspace
  - Sample components (Frontend, Backend, Mobile)
  - Sample features and sub-features

## Enhanced Debugging in the Application

The application has been enhanced with additional debugging features:

1. **Detailed Error Logging**: The `fetchFeatures()` function now includes detailed error logging to help identify issues.
2. **Data Sync Button**: The Story Creator form now includes a "Sync Data" button that allows you to manually trigger a sync of ProductBoard data.
3. **Status Messages**: The form now displays status messages indicating whether features and components are loading or if none were found.

## Troubleshooting Steps

If you're experiencing issues with features or components not appearing in the Story Creator form, follow these steps:

1. **Check the Console**: Open the browser's developer console to see if there are any error messages.

2. **Run the Database Check Tool**: Run `npm run check-db` to check if the database tables exist and have data.

3. **Populate the Database**: If the tables are empty, run `npm run populate-db` to populate them with sample data.

4. **Check Supabase Dashboard**: Log in to the Supabase dashboard and:
   - Verify that the tables exist
   - Check if they contain data
   - Review the RLS policies

5. **Check Environment Variables**: Make sure the `.env` file contains the correct Supabase URL and anonymous key.

6. **Use the Sync Button**: In the Story Creator form, click the "Sync Data" button to manually trigger a sync of ProductBoard data.

7. **Check Authentication**: If you're using authentication, make sure the user is authenticated and has the necessary permissions.

## Common Solutions

1. **Empty Tables**: Run `npm run populate-db` to populate the tables with sample data.

2. **Connection Issues**: Check the Supabase URL and anonymous key in the `.env` file.

3. **Permission Issues**: Make sure the anonymous key has the necessary permissions to access the data. You might need to use the service role key for testing.

4. **RLS Policies**: Review the RLS policies in the Supabase dashboard. You might need to modify them to allow access to the data.

5. **Data Structure Mismatches**: The application has been updated to handle both `type` and `feature_type` fields for features. If you're experiencing issues with other data structure mismatches, check the console logs for the data structure and update the code accordingly.

## Advanced Troubleshooting

If the above steps don't resolve the issue, you might need to:

1. **Check the Database Schema**: Make sure the database schema matches what the application expects.

2. **Review the API Code**: Check the API code to make sure it's correctly querying the database.

3. **Test with Direct Queries**: Use the Supabase dashboard to run direct SQL queries to test if the data is accessible.

4. **Check for Data Integrity Issues**: Make sure the data in the database is correctly formatted and contains all required fields.

5. **Review the Application Code**: Check the application code to make sure it's correctly handling the data returned from the API.

6. **Check Console Logs**: The application now logs more detailed information about the data structure. Check the browser console for these logs to help diagnose issues.

7. **Field Name Discrepancies**: If you're seeing "No features found" despite having features in the database, check if the features have `type = 'feature'` or `feature_type = 'feature'`. The application now checks for both.

## Getting Help

If you're still experiencing issues after following these steps, please contact the development team for assistance.
