import fs from 'fs';

// Read the file
let content = fs.readFileSync('main.js', 'utf8');

// Define the patterns to find and replace
const tryBlockStart = /let browser = null;\s+let page = null;\s+try {/;
const saveScreenshotFunctionDefinition = /async function saveScreenshot\(page, name\) {[\s\S]*?}\s+\/\/ Click the Integrations/;

// Extract the saveScreenshot function definition
const match = content.match(saveScreenshotFunctionDefinition);
if (!match) {
  console.error('Could not find the saveScreenshot function definition!');
  process.exit(1);
}

const saveScreenshotFunc = match[0].replace(/\s+\/\/ Click the Integrations$/, '');

// Replace the original content to move the function outside the try block
content = content.replace(tryBlockStart, 
  `let browser = null;
  let page = null;
  
  // Save screenshots for debugging
  ${saveScreenshotFunc}
  
  try {`);

// Remove the old function definition from inside the try block
content = content.replace(saveScreenshotFunctionDefinition, '// Click the Integrations');

// Save the fixed content
fs.writeFileSync('main.js', content);

console.log('Fixed saveScreenshot scope in main.js');
