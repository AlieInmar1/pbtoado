import fs from 'fs';

// Read the file
let content = fs.readFileSync('main.js', 'utf8');

// Let's look for the standalone catch that's causing problems
const problematicSection = content.slice(content.indexOf('// Navigate to ProductBoard URL'), content.indexOf('// Quick auth check'));

if (problematicSection.includes('catch (error)') || problematicSection.includes('catch (navigationError)')) {
  // We need to insert a proper try-catch structure
  
  // First, let's restore the original main.js from backup as we might have messed up the structure
  const backup = fs.readFileSync('main.js.backup', 'utf8');
  fs.writeFileSync('main.js', backup);
  console.log('Restored from backup to ensure clean state');
  
  // Now read the updated content
  content = fs.readFileSync('main.js', 'utf8');
  
  // Get the location of the navigation section
  const navigationStartIdx = content.indexOf('// Navigate to ProductBoard URL');
  const navigationEndIdx = content.indexOf('console.log(\'Navigation complete.\');') + 'console.log(\'Navigation complete.\');'.length;
  
  // Extract everything before and after the navigation section
  const beforeNavigation = content.substring(0, navigationStartIdx);
  const afterNavigation = content.substring(navigationEndIdx);
  
  // Create the new navigation section with proper try-catch structure
  const newNavigationSection = `// Navigate to ProductBoard URL
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
  
  // Combine the parts together
  const newContent = beforeNavigation + newNavigationSection + afterNavigation;
  
  // Write the new content back to the file
  fs.writeFileSync('main.js', newContent);
  console.log('Fixed navigation section with proper try-catch structure');
} else {
  console.log('Could not identify the exact syntax problem in the navigation section');
}
