// Test script for the Story Creator feature
import { supabase } from './lib/supabase';

async function testStoryCreator() {
  console.log('Testing Story Creator functionality...');
  
  // 1. Check if the stories table exists
  console.log('Checking stories table...');
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (tablesError) {
    console.error('Error checking tables:', tablesError);
    return;
  }

  const hasStoriesTable = tables.some(t => t.table_name === 'stories');
  console.log(`Stories table exists: ${hasStoriesTable}`);

  if (!hasStoriesTable) {
    console.error('Stories table not found! Please check your database setup.');
    return;
  }

  // 2. Check the structure of the stories table
  console.log('\nChecking stories table structure...');
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'stories')
    .eq('table_schema', 'public');

  if (columnsError) {
    console.error('Error checking columns:', columnsError);
    return;
  }

  console.log('Stories table columns:');
  columns.forEach(col => {
    console.log(`- ${col.column_name} (${col.data_type})`);
  });

  // Check for essential fields
  const requiredColumns = [
    'id', 'title', 'description', 'reach_score', 
    'impact_score', 'confidence_score', 'effort_score', 
    'rice_score', 'created_at', 'updated_at'
  ];
  
  const missingColumns = requiredColumns.filter(
    col => !columns.some(c => c.column_name === col)
  );

  if (missingColumns.length > 0) {
    console.error(`\nMissing required columns: ${missingColumns.join(', ')}`);
  } else {
    console.log('\nAll required columns are present!');
  }

  // 3. Check any existing stories
  console.log('\nChecking existing stories...');
  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('*')
    .limit(5);

  if (storiesError) {
    console.error('Error fetching stories:', storiesError);
    return;
  }

  console.log(`Found ${stories.length} stories`);
  if (stories.length > 0) {
    console.log('Sample story:', stories[0]);
  }

  console.log('\nRouting check: The following routes should be configured:');
  console.log('- /story-creator           → StoryCreatorLandingPage');
  console.log('- /story-creator/new       → StoryCreatorPage');
  console.log('- /story-creator/from-idea → IdeaToStoryGenerator');
  console.log('- /story-creator/edit/:id  → StoryCreatorPage');
  console.log('- /story-creator/templates → TemplateManagementPage');

  console.log('\nState transfer test:');
  console.log('1. Open console in browser');
  console.log('2. Navigate to /story-creator/from-idea');
  console.log('3. Generate a story and click "Continue to Full Editor"');
  console.log('4. Check console logs for location state and component initialization data');
  console.log('5. Verify the data flows from IdeaToStoryGenerator to StoryCreatorPage');
}

// Run the test
testStoryCreator().catch(err => {
  console.error('Test failed with error:', err);
});
