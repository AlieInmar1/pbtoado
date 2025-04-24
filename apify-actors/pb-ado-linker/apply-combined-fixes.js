import fs from 'fs';

console.log('Starting combined fixes application...');

// Read the original file
const content = fs.readFileSync('main.js', 'utf8');

// Step 1: Fix the saveScreenshot function scope
console.log('Step 1: Moving saveScreenshot function outside the try block...');

// Find the saveScreenshot function and extract it
const saveScreenshotRegex = /async function saveScreenshot\(page, name\) {[\s\S]*?}\s*\/\/ Click the Integrations/;
const saveScreenshotMatch = content.match(saveScreenshotRegex);

if (!saveScreenshotMatch) {
  console.error('Could not find saveScreenshot function!');
  process.exit(1);
}

// Extract the function without the comment
const saveScreenshotFunc = saveScreenshotMatch[0].replace(/\s*\/\/ Click the Integrations$/, '');

// Replace the old location with just the comment
const contentWithoutOldFunction = content.replace(saveScreenshotRegex, '// Click the Integrations');

// Insert the function before the try block
const tryBlockStart = /let browser = null;\s+let page = null;\s+try {/;
const contentWithNewFunctionLocation = contentWithoutOldFunction.replace(tryBlockStart, 
  `let browser = null;
  let page = null;
  
  // Save screenshots for debugging
  ${saveScreenshotFunc}
  
  try {`);

// Step 2: Improve the navigation code with retry logic
console.log('Step 2: Updating navigation code with retry logic...');

// Find the current navigation code
const navigationRegex = /\/\/ Navigate to ProductBoard URL[\s\S]*?console\.log\('Navigation complete\.'\);/;
const navigationMatch = contentWithNewFunctionLocation.match(navigationRegex);

if (!navigationMatch) {
  console.error('Could not find navigation code!');
  process.exit(1);
}

// Define the improved navigation code with retry logic
const improvedNavigationCode = `// Navigate to ProductBoard URL
        console.log('Navigating to', pbStoryUrl, '...');
        
        let navigationSuccess = false;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!navigationSuccess && attempts < maxAttempts) {
            try {
                attempts++;
                console.log(\`Navigation attempt \${attempts} of \${maxAttempts}...\`);
                
                // Use domcontentloaded instead of networkidle for faster initial load
                await page.goto(pbStoryUrl, { 
                    waitUntil: 'domcontentloaded', 
                    timeout: 30000 
                });
                
                // Additional check for navigation completion
                await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 })
                    .catch(err => console.log('Page still loading, but proceeding...'));
                
                navigationSuccess = true;
                console.log('Navigation complete.');
            } catch (navigationError) {
                console.log(\`Navigation attempt \${attempts} failed: \${navigationError.message}\`);
                
                if (attempts >= maxAttempts) {
                    throw new Error(\`Failed to navigate after \${maxAttempts} attempts: \${navigationError.message}\`);
                }
                
                // Wait before retry
                console.log('Waiting 5 seconds before retry...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }`;

// Replace the navigation code
const finalContent = contentWithNewFunctionLocation.replace(navigationRegex, improvedNavigationCode);

// Save the updated content
fs.writeFileSync('main.js', finalContent);

// Verify syntax
console.log('Validating syntax...');
try {
  require('child_process').execSync('node --check main.js', { encoding: 'utf8' });
  console.log('Syntax validation successful! All fixes applied correctly.');
} catch (error) {
  console.error('Syntax validation failed:', error.message);
  console.log('Reverting changes...');
  const backup = fs.readFileSync('main.js.backup', 'utf8');
  fs.writeFileSync('main.js', backup);
  console.log('Changes reverted to backup.');
  process.exit(1);
}

console.log('Fixes applied successfully!');
