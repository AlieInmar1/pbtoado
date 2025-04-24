import fs from 'fs';

console.log('Starting debug script...');
console.log('Current directory:', process.cwd());
console.log('main.js exists:', fs.existsSync('main.js'));
console.log('main.js.backup exists:', fs.existsSync('main.js.backup'));

try {
  // Step 1: Create a backup if it doesn't exist
  if (!fs.existsSync('main.js.backup')) {
    console.log('Creating backup of main.js');
    fs.copyFileSync('main.js', 'main.js.backup');
  }

  // Read the file content
  console.log('Reading main.js...');
  const content = fs.readFileSync('main.js', 'utf8');
  
  // Log a snippet of the content
  console.log('First 200 characters of main.js:');
  console.log(content.substring(0, 200));
  
  // Count how many saveScreenshot function calls there are
  const saveScreenshotCalls = (content.match(/saveScreenshot\(/g) || []).length;
  console.log(`Found ${saveScreenshotCalls} calls to saveScreenshot function`);
  
  // Search for the saveScreenshot function definition
  const functionPattern = /async function saveScreenshot\(page key\)/;
  const hasFunction = functionPattern.test(content);
  console.log('Found saveScreenshot function definition:', hasFunction);
  
  // Look for missing commas in the function signature and usage
  const missingSeparator = /saveScreenshot\(page key\)/.test(content);
  console.log('Missing comma between params:', missingSeparator);
  
  const missingValueSeparator = /Actor\.setValue\(key screenshotBuffer/.test(content);
  console.log('Missing comma in setValue call:', missingValueSeparator);
  
  // Extract current navigation code section
  const navigationCodeStart = content.indexOf('// Navigate to ProductBoard URL');
  if (navigationCodeStart !== -1) {
    const snippetEnd = content.indexOf('// Quick auth check', navigationCodeStart);
    const snippetLength = snippetEnd !== -1 ? snippetEnd - navigationCodeStart : 500;
    
    console.log('\nCurrent navigation code snippet:');
    console.log(content.substring(navigationCodeStart, navigationCodeStart + snippetLength));
  } else {
    console.log('Could not find navigation code section');
  }
  
  console.log('\nDebug complete');
} catch (error) {
  console.error('Error in debug script:', error);
}
