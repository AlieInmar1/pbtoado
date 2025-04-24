import fs from 'fs';

console.log('Starting comprehensive fixes application...');

// First, read the current content of main.js
let content = fs.readFileSync('main.js', 'utf8');

// Step 1: Fix the saveScreenshot function syntax errors
console.log('Step 1: Fixing saveScreenshot function syntax errors...');

// The function is defined with syntax errors - missing commas between parameters
content = content.replace(
  /async function saveScreenshot\(page key\)/g,
  'async function saveScreenshot(page, key)'
);

// Also fix the Actor.setValue line which has missing commas
content = content.replace(
  /await Actor\.setValue\(key screenshotBuffer \{ contentType: ['"]image\/png['"] \}\);/g,
  'await Actor.setValue(key, screenshotBuffer, { contentType: \'image/png\' });'
);

// Step 2: Move the saveScreenshot function outside of the try block
console.log('Step 2: Moving saveScreenshot function outside the try block...');

// First, extract the saveScreenshot function with its fixed syntax
const functionRegex = /async function saveScreenshot\(page, key\) \{[\s\S]*?\}/;
const match = content.match(functionRegex);

if (!match) {
  console.error('Could not find saveScreenshot function after syntax fix!');
  process.exit(1);
}

const saveScreenshotFunc = match[0];

// Remove the original function from inside the try block
content = content.replace(functionRegex, '');

// Insert the function before the try block
const tryBlockStart = /let browser = null;\s+let page = null;\s+try {/;
content = content.replace(tryBlockStart, 
  `let browser = null;
  let page = null;
  
  // Save screenshots for debugging
  ${saveScreenshotFunc}
  
  try {`);

// Step 3: Improve the navigation code with retry logic
console.log('Step 3: Updating navigation code with retry logic...');

// Find the current navigation code
const navigationRegex = /\/\/ Navigate to ProductBoard URL[\s\S]*?console\.log\('Navigation complete\.'\);/;
const navigationMatch = content.match(navigationRegex);

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
content = content.replace(navigationMatch[0], improvedNavigationCode);

// Step 4: Fix any other syntax errors in the script
console.log('Step 4: Fixing other syntax errors...');

// Fix the dropdownResult if condition which might have syntax issues
content = content.replace(
  /const dropdownResult = await handleProjectDropdown\(modal adoProjectName page saveScreenshot\);/g,
  'const dropdownResult = await handleProjectDropdown(modal, adoProjectName, page, saveScreenshot);'
);

// Fix a syntax issue with a try block that has invalid structure
content = content.replace(
  /} try {[\s\S]*?\/\/ Dummy try block added to fix syntax/,
  '} catch (dummyError) {\n            // Dummy catch block added to fix syntax\n        }'
);

// Save the updated content
fs.writeFileSync('main.js.fixed2', content);

console.log('Fixes saved to main.js.fixed2. Validating syntax...');

// Check syntax (optional, may not work perfectly with module syntax)
try {
  require('child_process').execSync('node --check main.js.fixed2', { encoding: 'utf8' });
  console.log('Syntax validation successful! Applying the fix to main.js');
  
  // Copy the fixed file to main.js
  fs.copyFileSync('main.js.fixed2', 'main.js');
  console.log('All fixes applied successfully!');
} catch (error) {
  console.error('Syntax validation failed:', error.message);
  console.log('Fixes saved to main.js.fixed2, but not applied to main.js due to syntax errors.');
  process.exit(1);
}
