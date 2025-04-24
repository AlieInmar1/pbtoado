import fs from 'fs';

// Read the file
let content = fs.readFileSync('main.js', 'utf8');

// Find the navigation statement
const navigationPattern = /await page\.goto\(pbStoryUrl, \{ waitUntil: ['"]networkidle['"], timeout: \d+ \}\);/;

// Replace with a more robust implementation that uses 'domcontentloaded' instead of 'networkidle'
// and has a shorter timeout but with retry logic
const improvedNavigationCode = `
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
content = content.replace(navigationPattern, improvedNavigationCode);

// Save the modified content
fs.writeFileSync('main.js', content);

console.log('Added navigation retry logic to main.js');
